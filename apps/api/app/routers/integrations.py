import base64
import hashlib
import secrets
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import require_coach
from app.models.calendar_connections import CalendarConnection
from app.models.enums import CalendarProvider
from app.models.users import CoachProfile, User
from app.schemas.integrations import GoogleCalendarEventOut, IntegrationStatusOut
from app.security import create_integration_state_token, decode_token

router = APIRouter(prefix="/integrations", tags=["integrations"])


async def _get_connection(
    db: AsyncSession, coach_id: uuid.UUID, provider: CalendarProvider
) -> CalendarConnection | None:
    result = await db.execute(
        select(CalendarConnection).where(
            CalendarConnection.coach_id == coach_id, CalendarConnection.provider == provider
        )
    )
    return result.scalar_one_or_none()


@router.get("", response_model=list[IntegrationStatusOut])
async def list_integrations(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[IntegrationStatusOut]:
    result = await db.execute(
        select(CalendarConnection).where(CalendarConnection.coach_id == coach.id)
    )
    by_provider = {c.provider: c for c in result.scalars().all()}
    return [
        IntegrationStatusOut(
            provider=p,
            connected=p in by_provider,
            account_label=by_provider[p].account_label if p in by_provider else None,
            connected_at=by_provider[p].created_at if p in by_provider else None,
        )
        for p in CalendarProvider
    ]


@router.delete("/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_integration(
    provider: CalendarProvider,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    connection = await _get_connection(db, coach.id, provider)
    if connection is not None:
        await db.delete(connection)
        await db.commit()


@router.get("/{provider}/connect")
async def connect_integration(
    provider: CalendarProvider, coach: User = Depends(require_coach)
) -> RedirectResponse:
    if provider == CalendarProvider.google:
        if not settings.google_client_id:
            raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Google isn't configured")
        state = create_integration_state_token(coach.id, provider.value)
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_calendar_redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/calendar.events email",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return RedirectResponse(
            "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
        )

    if provider == CalendarProvider.zoom:
        if not settings.zoom_client_id:
            raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Zoom isn't configured")
        state = create_integration_state_token(coach.id, provider.value)
        params = {
            "response_type": "code",
            "client_id": settings.zoom_client_id,
            "redirect_uri": settings.zoom_redirect_uri,
            "state": state,
        }
        return RedirectResponse("https://zoom.us/oauth/authorize?" + urllib.parse.urlencode(params))

    if provider == CalendarProvider.calendly:
        if not settings.calendly_client_id:
            raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Calendly isn't configured")
        verifier = secrets.token_urlsafe(64)[:64]
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        state = create_integration_state_token(coach.id, provider.value, extra=verifier)
        params = {
            "client_id": settings.calendly_client_id,
            "response_type": "code",
            "redirect_uri": settings.calendly_redirect_uri,
            "code_challenge_method": "S256",
            "code_challenge": challenge,
            "state": state,
        }
        return RedirectResponse(
            "https://auth.calendly.com/oauth/authorize?" + urllib.parse.urlencode(params)
        )

    if provider == CalendarProvider.cal_com:
        if not settings.calcom_client_id:
            raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Cal.com isn't configured")
        state = create_integration_state_token(coach.id, provider.value)
        params = {
            "client_id": settings.calcom_client_id,
            "redirect_uri": settings.calcom_redirect_uri,
            "state": state,
            "scope": "BOOKING_READ BOOKING_WRITE",
        }
        return RedirectResponse(
            "https://app.cal.com/auth/oauth2/authorize?" + urllib.parse.urlencode(params)
        )

    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown provider")


def _decode_state(state: str, expected_provider: CalendarProvider) -> tuple[uuid.UUID, str]:
    try:
        payload = decode_token(state)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired connect link") from exc
    if payload.get("type") != "integration_state" or payload.get("provider") != expected_provider.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid connect link")
    return uuid.UUID(payload["sub"]), payload.get("extra", "")


async def _upsert_connection(
    db: AsyncSession,
    coach_id: uuid.UUID,
    provider: CalendarProvider,
    *,
    access_token: str,
    refresh_token: str | None,
    expires_in: int | None,
    account_label: str | None,
    extra_json: dict | None = None,
) -> None:
    connection = await _get_connection(db, coach_id, provider)
    if connection is None:
        connection = CalendarConnection(coach_id=coach_id, provider=provider)
        db.add(connection)
    connection.access_token = access_token
    if refresh_token:
        connection.refresh_token = refresh_token
    connection.token_expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None
    )
    connection.account_label = account_label
    if extra_json is not None:
        connection.extra_json = extra_json
    await db.commit()


@router.get("/{provider}/callback")
async def integration_callback(
    provider: CalendarProvider,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    coach_id, extra = (None, "")
    if state:
        try:
            coach_id, extra = _decode_state(state, provider)
        except HTTPException:
            coach_id = None

    profile = await db.get(CoachProfile, coach_id) if coach_id else None
    slug = profile.portal_slug if profile else None
    base_return = f"{settings.frontend_url}/{slug}/calendar" if slug else f"{settings.frontend_url}/dashboard"
    fail_url = f"{base_return}?integration_error={provider.value}"

    if error or not code or not state or coach_id is None:
        return RedirectResponse(fail_url)

    async with httpx.AsyncClient() as http:
        if provider == CalendarProvider.google:
            token_res = await http.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_calendar_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if token_res.status_code != 200:
                return RedirectResponse(fail_url)
            tokens = token_res.json()
            userinfo = await http.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            label = userinfo.json().get("email") if userinfo.status_code == 200 else None
            await _upsert_connection(
                db,
                coach_id,
                provider,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token"),
                expires_in=tokens.get("expires_in"),
                account_label=label,
            )

        elif provider == CalendarProvider.zoom:
            basic = base64.b64encode(
                f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode()
            ).decode()
            token_res = await http.post(
                "https://zoom.us/oauth/token",
                headers={"Authorization": f"Basic {basic}"},
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.zoom_redirect_uri,
                },
            )
            if token_res.status_code != 200:
                return RedirectResponse(fail_url)
            tokens = token_res.json()
            userinfo = await http.get(
                "https://api.zoom.us/v2/users/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            label = userinfo.json().get("email") if userinfo.status_code == 200 else None
            await _upsert_connection(
                db,
                coach_id,
                provider,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token"),
                expires_in=tokens.get("expires_in"),
                account_label=label,
            )

        elif provider == CalendarProvider.calendly:
            token_res = await http.post(
                "https://auth.calendly.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.calendly_client_id,
                    "client_secret": settings.calendly_client_secret,
                    "code": code,
                    "redirect_uri": settings.calendly_redirect_uri,
                    "code_verifier": extra,
                },
            )
            if token_res.status_code != 200:
                return RedirectResponse(fail_url)
            tokens = token_res.json()
            me = await http.get(
                "https://api.calendly.com/users/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            me_data = me.json().get("resource", {}) if me.status_code == 200 else {}
            label = me_data.get("scheduling_url") or me_data.get("email")
            await _upsert_connection(
                db,
                coach_id,
                provider,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token"),
                expires_in=tokens.get("expires_in"),
                account_label=label,
                extra_json={"scheduling_url": me_data.get("scheduling_url")},
            )

        elif provider == CalendarProvider.cal_com:
            token_res = await http.post(
                f"https://api.cal.com/v2/oauth/{settings.calcom_client_id}/exchange",
                headers={"x-cal-secret-key": settings.calcom_client_secret},
                json={"code": code},
            )
            if token_res.status_code != 200:
                return RedirectResponse(fail_url)
            body = token_res.json().get("data", token_res.json())
            access_token = body["accessToken"]
            scheduling_url = None
            try:
                me = await http.get(
                    "https://api.cal.com/v2/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if me.status_code == 200:
                    me_data = me.json().get("data", me.json())
                    username = me_data.get("username")
                    if username:
                        scheduling_url = f"https://cal.com/{username}"
            except httpx.HTTPError:
                pass
            await _upsert_connection(
                db,
                coach_id,
                provider,
                access_token=access_token,
                refresh_token=body.get("refreshToken"),
                expires_in=None,
                account_label=scheduling_url or "Cal.com account",
                extra_json={"scheduling_url": scheduling_url},
            )

    return RedirectResponse(f"{base_return}?connected={provider.value}")


async def _ensure_fresh_token(db: AsyncSession, connection: CalendarConnection) -> str:
    """Returns a valid access token, refreshing it first if it's near/past expiry."""
    if (
        connection.token_expires_at is not None
        and connection.token_expires_at > datetime.now(timezone.utc) + timedelta(minutes=5)
    ):
        return connection.access_token
    if not connection.refresh_token:
        return connection.access_token

    async with httpx.AsyncClient() as http:
        if connection.provider == CalendarProvider.google:
            res = await http.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "refresh_token": connection.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
        elif connection.provider == CalendarProvider.zoom:
            basic = base64.b64encode(
                f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode()
            ).decode()
            res = await http.post(
                "https://zoom.us/oauth/token",
                headers={"Authorization": f"Basic {basic}"},
                data={"grant_type": "refresh_token", "refresh_token": connection.refresh_token},
            )
        else:
            return connection.access_token

    if res.status_code != 200:
        return connection.access_token

    tokens = res.json()
    connection.access_token = tokens["access_token"]
    if tokens.get("refresh_token"):
        connection.refresh_token = tokens["refresh_token"]
    if tokens.get("expires_in"):
        connection.token_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=tokens["expires_in"]
        )
    await db.commit()
    return connection.access_token


@router.get("/google/events", response_model=list[GoogleCalendarEventOut])
async def list_google_calendar_events(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[GoogleCalendarEventOut]:
    """A live read straight from the coach's actual Google Calendar (not our
    own internal Meeting table) — lets the app surface "what's really on your
    calendar," including events that were never booked through CoachevaOS."""
    connection = await _get_connection(db, coach.id, CalendarProvider.google)
    if connection is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Google Calendar isn't connected")

    token = await _ensure_fresh_token(db, connection)
    now = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            res = await http.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "timeMin": now.isoformat(),
                    "maxResults": 10,
                    "singleEvents": "true",
                    "orderBy": "startTime",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Couldn't reach Google Calendar") from exc

    if res.status_code == 401:
        # The refreshed token was itself rejected — the connection is dead
        # (revoked access, expired refresh token). Surface that plainly
        # rather than an opaque 502, so the coach knows to reconnect.
        raise HTTPException(status.HTTP_409_CONFLICT, "Google Calendar access has expired — reconnect it")
    if res.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Couldn't load events from Google Calendar")

    events = res.json().get("items", [])
    out: list[GoogleCalendarEventOut] = []
    for e in events:
        start = e.get("start", {})
        end = e.get("end", {})
        out.append(
            GoogleCalendarEventOut(
                id=e.get("id", ""),
                summary=e.get("summary") or "(No title)",
                start=start.get("dateTime"),
                end=end.get("dateTime"),
                all_day_date=start.get("date"),
                hangout_link=e.get("hangoutLink"),
                html_link=e.get("htmlLink"),
            )
        )
    return out


async def create_video_call_link(
    db: AsyncSession,
    coach_id: uuid.UUID,
    *,
    starts_at: datetime,
    ends_at: datetime,
    topic: str,
) -> str | None:
    """Best-effort: if the coach has Google or Zoom connected (Google preferred),
    create a real call and return its join URL. Returns None if neither is
    connected or the provider call fails — callers should treat that as
    non-fatal, matching how meeting_url has always been optional."""
    for provider in (CalendarProvider.google, CalendarProvider.zoom):
        connection = await _get_connection(db, coach_id, provider)
        if connection is None:
            continue
        token = await _ensure_fresh_token(db, connection)

        try:
            async with httpx.AsyncClient() as http:
                if provider == CalendarProvider.google:
                    res = await http.post(
                        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                        params={"conferenceDataVersion": 1},
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "summary": topic,
                            "start": {"dateTime": starts_at.isoformat()},
                            "end": {"dateTime": ends_at.isoformat()},
                            "conferenceData": {
                                "createRequest": {"requestId": str(uuid.uuid4())}
                            },
                        },
                    )
                    if res.status_code in (200, 201):
                        return res.json().get("hangoutLink")
                else:
                    res = await http.post(
                        "https://api.zoom.us/v2/users/me/meetings",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "topic": topic,
                            "type": 2,
                            # starts_at is stored UTC-aware (Meeting.starts_at) —
                            # a bare "%Y-%m-%dT%H:%M:%S" with no offset and no
                            # timezone field is interpreted by Zoom in the
                            # account's own default timezone, not UTC, so the
                            # real meeting would silently land at the wrong
                            # wall-clock time. Explicit "timezone": "UTC" fixes
                            # this without needing to know that account default.
                            "start_time": starts_at.strftime("%Y-%m-%dT%H:%M:%S"),
                            "timezone": "UTC",
                            "duration": max(1, int((ends_at - starts_at).total_seconds() // 60)),
                        },
                    )
                    if res.status_code in (200, 201):
                        return res.json().get("join_url")
        except httpx.HTTPError:
            return None
    return None
