import hashlib
import hmac
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.calendar_connections import CalendarConnection
from app.models.clients import Client
from app.models.enums import CalendarProvider, MeetingStatus
from app.models.meetings import Meeting
from app.models.users import User
from app.routers.integrations import ensure_fresh_token

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _get_connection(
    db: AsyncSession, coach_id: uuid.UUID, provider: CalendarProvider
) -> CalendarConnection | None:
    result = await db.execute(
        select(CalendarConnection).where(
            CalendarConnection.coach_id == coach_id, CalendarConnection.provider == provider
        )
    )
    return result.scalar_one_or_none()


async def _find_client_by_email(db: AsyncSession, coach_id: uuid.UUID, email: str | None) -> Client | None:
    """External bookings are matched to an existing CoachevaOS client purely
    by email — if nobody with that email exists yet under this coach, the
    booking is intentionally left un-synced (logged, not surfaced as an
    error) rather than fabricating a new client record from a webhook.

    Exact match, no case-folding — matches this app's existing convention
    everywhere else emails are looked up (auth.py's login/register, clients.py's
    duplicate-email check), none of which normalize case either. Introducing
    case-insensitivity in just this one path would be a new inconsistency, not
    a fix; a real case-sensitivity gap is pre-existing and app-wide."""
    if not email:
        return None
    result = await db.execute(
        select(Client)
        .join(User, User.id == Client.user_id)
        .where(Client.coach_id == coach_id, User.email == email)
    )
    return result.scalar_one_or_none()


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Calendly
# ---------------------------------------------------------------------------


def _verify_calendly_signature(raw_body: bytes, header_value: str | None, signing_key: str) -> bool:
    """Calendly-Webhook-Signature: "t=<unix_ts>,v1=<hex hmac-sha256>", signed
    string is "{t}.{raw_body}" — per Calendly's documented scheme."""
    if not header_value:
        return False
    parts = dict(p.split("=", 1) for p in header_value.split(",") if "=" in p)
    ts, v1 = parts.get("t"), parts.get("v1")
    if not ts or not v1:
        return False
    signed_string = f"{ts}.{raw_body.decode('utf-8')}".encode("utf-8")
    expected = hmac.new(signing_key.encode("utf-8"), signed_string, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)


@router.post("/calendly/{coach_id}", status_code=status.HTTP_200_OK)
async def calendly_webhook(
    coach_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)
) -> dict:
    raw_body = await request.body()
    connection = await _get_connection(db, coach_id, CalendarProvider.calendly)
    signing_key = (connection.extra_json or {}).get("webhook_signing_key") if connection else None
    if not connection or not signing_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No Calendly connection for this account")

    if not _verify_calendly_signature(
        raw_body, request.headers.get("Calendly-Webhook-Signature"), signing_key
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid webhook signature")

    body = await request.json()
    event_type = body.get("event")
    payload = body.get("payload", {})
    event_uri = payload.get("event")  # URI reference to the scheduled event resource

    if event_type == "invitee.canceled":
        if event_uri:
            result = await db.execute(
                select(Meeting).where(
                    Meeting.coach_id == coach_id,
                    Meeting.booking_source == "calendly",
                    Meeting.external_event_uri == event_uri,
                )
            )
            meeting = result.scalar_one_or_none()
            if meeting is not None:
                meeting.status = MeetingStatus.canceled
                await db.commit()
        return {"received": True}

    if event_type != "invitee.created" or not event_uri:
        return {"received": True}

    client = await _find_client_by_email(db, coach_id, payload.get("email"))
    if client is None:
        return {"received": True}

    # The webhook payload doesn't include the event's start/end time —
    # Calendly's own docs say to fetch the referenced scheduled-event
    # resource for that. Refreshes first if the stored token is near/past
    # expiry, same as every other authenticated provider call in this app.
    token = await ensure_fresh_token(db, connection)
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            event_res = await http.get(event_uri, headers={"Authorization": f"Bearer {token}"})
    except httpx.HTTPError:
        return {"received": True}
    if event_res.status_code != 200:
        return {"received": True}
    event_resource = event_res.json().get("resource", {})
    starts_at = _parse_iso(event_resource.get("start_time"))
    ends_at = _parse_iso(event_resource.get("end_time"))
    if not starts_at or not ends_at:
        return {"received": True}

    existing = await db.execute(
        select(Meeting).where(
            Meeting.coach_id == coach_id,
            Meeting.booking_source == "calendly",
            Meeting.external_event_uri == event_uri,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return {"received": True}  # already synced — webhook delivery can retry

    db.add(
        Meeting(
            coach_id=coach_id,
            client_id=client.id,
            starts_at=starts_at,
            ends_at=ends_at,
            status=MeetingStatus.scheduled,
            meeting_url=None,
            meeting_provider=None,
            booking_source="calendly",
            external_event_uri=event_uri,
        )
    )
    await db.commit()
    return {"received": True}


# ---------------------------------------------------------------------------
# Cal.com
# ---------------------------------------------------------------------------


def _verify_calcom_signature(raw_body: bytes, header_value: str | None, secret: str) -> bool:
    """X-Cal-Signature-256: hex HMAC-SHA256 of the raw body, keyed with the
    per-webhook secret supplied at subscription-creation time."""
    if not header_value:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_value)


@router.post("/calcom/{coach_id}", status_code=status.HTTP_200_OK)
async def calcom_webhook(
    coach_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)
) -> dict:
    raw_body = await request.body()
    connection = await _get_connection(db, coach_id, CalendarProvider.cal_com)
    secret = (connection.extra_json or {}).get("webhook_secret") if connection else None
    if not connection or not secret:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No Cal.com connection for this account")

    if not _verify_calcom_signature(raw_body, request.headers.get("X-Cal-Signature-256"), secret):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid webhook signature")

    body = await request.json()
    trigger = body.get("triggerEvent")
    payload = body.get("payload", {})

    if trigger == "BOOKING_CANCELLED":
        uid = payload.get("uid")
        if uid:
            result = await db.execute(
                select(Meeting).where(
                    Meeting.coach_id == coach_id,
                    Meeting.booking_source == "cal_com",
                    Meeting.external_event_uri == uid,
                )
            )
            meeting = result.scalar_one_or_none()
            if meeting is not None:
                meeting.status = MeetingStatus.canceled
                await db.commit()
        return {"received": True}

    if trigger == "BOOKING_RESCHEDULED":
        old_uid = payload.get("rescheduleUid")
        new_uid = payload.get("uid")
        starts_at = _parse_iso(payload.get("startTime"))
        ends_at = _parse_iso(payload.get("endTime"))
        if old_uid and new_uid and starts_at and ends_at:
            result = await db.execute(
                select(Meeting).where(
                    Meeting.coach_id == coach_id,
                    Meeting.booking_source == "cal_com",
                    Meeting.external_event_uri == old_uid,
                )
            )
            meeting = result.scalar_one_or_none()
            if meeting is not None:
                meeting.starts_at = starts_at
                meeting.ends_at = ends_at
                meeting.external_event_uri = new_uid
                await db.commit()
        return {"received": True}

    if trigger != "BOOKING_CREATED":
        return {"received": True}

    uid = payload.get("uid")
    starts_at = _parse_iso(payload.get("startTime"))
    ends_at = _parse_iso(payload.get("endTime"))
    attendees = payload.get("attendees") or []
    attendee_email = attendees[0].get("email") if attendees else None
    if not uid or not starts_at or not ends_at:
        return {"received": True}

    client = await _find_client_by_email(db, coach_id, attendee_email)
    if client is None:
        return {"received": True}

    existing = await db.execute(
        select(Meeting).where(
            Meeting.coach_id == coach_id,
            Meeting.booking_source == "cal_com",
            Meeting.external_event_uri == uid,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return {"received": True}

    video_call_data = payload.get("videoCallData") or {}
    db.add(
        Meeting(
            coach_id=coach_id,
            client_id=client.id,
            starts_at=starts_at,
            ends_at=ends_at,
            status=MeetingStatus.scheduled,
            meeting_url=video_call_data.get("url"),
            meeting_provider=None,
            booking_source="cal_com",
            external_event_uri=uid,
        )
    )
    await db.commit()
    return {"received": True}
