import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.calendar_connections import CalendarConnection
from app.models.clients import Client
from app.models.enums import CalendarProvider, MeetingStatus, UserRole
from app.models.meetings import Meeting
from app.models.users import CoachProfile, User
from app.routers.integrations import create_video_call_link, get_preferred_video_provider
from app.schemas.calendar import (
    AvailabilityRules,
    AvailabilityRulesForClient,
    MeetingBookRequest,
    MeetingCreate,
    MeetingOut,
    MeetingRescheduleRequest,
    SchedulingLinksOut,
)

router = APIRouter(tags=["calendar"])


def _to_out(meeting: Meeting, client_name: str, client_timezone: str | None = None) -> MeetingOut:
    return MeetingOut(
        id=meeting.id,
        client_id=meeting.client_id,
        client_name=client_name,
        client_timezone=client_timezone,
        starts_at=meeting.starts_at,
        ends_at=meeting.ends_at,
        status=meeting.status,
        meeting_url=meeting.meeting_url,
        meeting_provider=meeting.meeting_provider,
        booking_source=meeting.booking_source,
    )


def _safe_zone(tz_name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name or "UTC")
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def _local_wall_clock_to_utc(date_str: str, time_str: str, tz: ZoneInfo) -> datetime:
    try:
        naive = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date or time") from exc
    return naive.replace(tzinfo=tz)


async def _conflict_exists(
    db: AsyncSession,
    coach_id: uuid.UUID,
    starts_at: datetime,
    ends_at: datetime,
    exclude_meeting_id: uuid.UUID | None = None,
) -> bool:
    query = select(Meeting).where(
        Meeting.coach_id == coach_id,
        Meeting.status == MeetingStatus.scheduled,
        Meeting.starts_at < ends_at,
        Meeting.ends_at > starts_at,
    )
    if exclude_meeting_id is not None:
        query = query.where(Meeting.id != exclude_meeting_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


@router.get("/meetings", response_model=list[MeetingOut])
async def list_meetings(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[MeetingOut]:
    result = await db.execute(
        select(Meeting, User)
        .join(Client, Client.id == Meeting.client_id)
        .join(User, User.id == Client.user_id)
        .where(Meeting.coach_id == coach.id)
        .order_by(Meeting.starts_at.asc())
    )
    return [_to_out(m, u.name, u.timezone) for m, u in result.all()]


@router.post("/meetings", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    body: MeetingCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    client = await db.get(Client, body.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    user = await db.get(User, client.user_id)
    assert user is not None

    if await _conflict_exists(db, coach.id, body.starts_at, body.ends_at):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "You already have a session booked at that time."
        )

    provider, url = await create_video_call_link(
        db,
        coach.id,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        topic=f"Session with {user.name}",
    )
    meeting = Meeting(
        coach_id=coach.id,
        client_id=body.client_id,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        status=MeetingStatus.scheduled,
        meeting_url=url,
        meeting_provider=provider,
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)
    return _to_out(meeting, user.name)


@router.get("/calendar/scheduling-links", response_model=SchedulingLinksOut)
async def get_scheduling_links(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> SchedulingLinksOut:
    result = await db.execute(
        select(CalendarConnection).where(
            CalendarConnection.coach_id == client.coach_id,
            CalendarConnection.provider.in_([CalendarProvider.calendly, CalendarProvider.cal_com]),
        )
    )
    links = SchedulingLinksOut()
    for connection in result.scalars().all():
        url = connection.extra_json.get("scheduling_url") if connection.extra_json else None
        url = url or connection.account_label
        if connection.provider == CalendarProvider.calendly:
            links.calendly_url = url
        else:
            links.cal_com_url = url
    links.video_provider = await get_preferred_video_provider(db, client.coach_id)
    return links


@router.get("/calendar/availability", response_model=AvailabilityRulesForClient)
async def get_coach_availability_for_client(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> AvailabilityRulesForClient:
    profile = await db.get(CoachProfile, client.coach_id)
    coach_user = await db.get(User, client.coach_id)
    base = (
        AvailabilityRules.model_validate(profile.availability_rules_json)
        if profile and profile.availability_rules_json
        else AvailabilityRules()
    )
    return AvailabilityRulesForClient(
        **base.model_dump(), coach_timezone=(coach_user.timezone if coach_user else "UTC") or "UTC"
    )


@router.get("/meetings/mine", response_model=list[MeetingOut])
async def list_my_meetings(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[MeetingOut]:
    result = await db.execute(
        select(Meeting)
        .where(Meeting.client_id == client.id)
        .order_by(Meeting.starts_at.asc())
    )
    user = await db.get(User, client.user_id)
    assert user is not None
    return [_to_out(m, user.name) for m in result.scalars().all()]


@router.post("/meetings/book", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
async def book_meeting(
    body: MeetingBookRequest,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    profile = await db.get(CoachProfile, client.coach_id)
    coach_user = await db.get(User, client.coach_id)
    rules = (
        AvailabilityRules.model_validate(profile.availability_rules_json)
        if profile and profile.availability_rules_json
        else AvailabilityRules()
    )
    tz = _safe_zone(coach_user.timezone if coach_user else None)

    # date/time arrive already expressed in the coach's own wall clock (the
    # client picked them straight off AvailabilityRulesForClient.slots) — no
    # timezone conversion has happened yet on either side, so this is the one
    # and only place the instant gets constructed.
    starts_at_local = _local_wall_clock_to_utc(body.date, body.time, tz)

    day_key = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][starts_at_local.weekday()]
    if not getattr(rules.days, day_key):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Coach is not bookable on that day")

    if rules.slots and body.time not in rules.slots:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That time slot isn't offered")

    starts_at = starts_at_local.astimezone(ZoneInfo("UTC"))
    ends_at = starts_at + timedelta(minutes=rules.session_length)

    if await _conflict_exists(db, client.coach_id, starts_at, ends_at):
        raise HTTPException(status.HTTP_409_CONFLICT, "That time was just booked. Pick another slot.")

    user = await db.get(User, client.user_id)
    assert user is not None

    provider, url = await create_video_call_link(
        db,
        client.coach_id,
        starts_at=starts_at,
        ends_at=ends_at,
        topic=f"Session with {user.name}",
    )
    meeting = Meeting(
        coach_id=client.coach_id,
        client_id=client.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=MeetingStatus.scheduled,
        meeting_url=url,
        meeting_provider=provider,
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)
    return _to_out(meeting, user.name)


async def _load_owned_meeting(db: AsyncSession, meeting_id: uuid.UUID, user: User) -> Meeting:
    """Both a coach and a client can act on a meeting they're actually part
    of — resolved from the session (never trusting the URL id alone), same
    ownership discipline used by every other coach/client-scoped endpoint."""
    meeting = await db.get(Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")

    if user.role == UserRole.coach:
        if meeting.coach_id != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")
        return meeting

    if user.role == UserRole.client:
        client_result = await db.execute(
            select(Client).where(Client.id == meeting.client_id, Client.user_id == user.id)
        )
        if client_result.scalar_one_or_none() is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")
        return meeting

    raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")


@router.patch("/meetings/{meeting_id}", response_model=MeetingOut)
async def reschedule_meeting(
    meeting_id: uuid.UUID,
    body: MeetingRescheduleRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    meeting = await _load_owned_meeting(db, meeting_id, user)
    if meeting.status != MeetingStatus.scheduled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only a scheduled session can be rescheduled")
    if meeting.booking_source != "internal":
        # This row is a synced mirror of a real Calendly/Cal.com booking —
        # CoachevaOS isn't the source of truth for its time, so rescheduling
        # it here would silently desync from the real booking with no way
        # to push the change back to the provider.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This session was booked externally — reschedule it from where it was booked.",
        )

    profile = await db.get(CoachProfile, meeting.coach_id)
    coach_user = await db.get(User, meeting.coach_id)
    rules = (
        AvailabilityRules.model_validate(profile.availability_rules_json)
        if profile and profile.availability_rules_json
        else AvailabilityRules()
    )
    duration = meeting.ends_at - meeting.starts_at

    if body.starts_at is not None:
        # Coach-initiated reschedule (their own datetime-local picker) —
        # coaches can already schedule at any time via POST /meetings with no
        # day/slot restriction, so the same freedom applies here.
        new_starts_at = body.starts_at
    else:
        # Client-initiated reschedule — re-validate against the coach's
        # offered days/slots exactly like book_meeting does, so a client
        # can't bypass the slot picker by calling this endpoint directly
        # with an arbitrary date/time.
        tz = _safe_zone(coach_user.timezone if coach_user else None)
        assert body.date is not None and body.time is not None
        day_key = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][
            datetime.strptime(body.date, "%Y-%m-%d").weekday()
        ]
        if not getattr(rules.days, day_key):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Coach is not bookable on that day")
        if rules.slots and body.time not in rules.slots:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "That time slot isn't offered")
        new_starts_at = _local_wall_clock_to_utc(body.date, body.time, tz).astimezone(ZoneInfo("UTC"))
    new_ends_at = new_starts_at + duration

    if await _conflict_exists(db, meeting.coach_id, new_starts_at, new_ends_at, exclude_meeting_id=meeting.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "That time is already booked. Pick another slot.")

    client = await db.get(Client, meeting.client_id)
    client_user = await db.get(User, client.user_id) if client else None
    topic = f"Session with {client_user.name}" if client_user else "Coaching session"

    # The old join link is time-anchored on the provider's side — a reschedule
    # needs a fresh one, not a stale link pointing at the old time.
    provider, url = await create_video_call_link(
        db, meeting.coach_id, starts_at=new_starts_at, ends_at=new_ends_at, topic=topic
    )
    meeting.starts_at = new_starts_at
    meeting.ends_at = new_ends_at
    meeting.meeting_url = url
    meeting.meeting_provider = provider
    await db.commit()
    await db.refresh(meeting)
    return _to_out(meeting, client_user.name if client_user else "", client_user.timezone if client_user else None)


@router.post("/meetings/{meeting_id}/cancel", response_model=MeetingOut)
async def cancel_meeting(
    meeting_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    meeting = await _load_owned_meeting(db, meeting_id, user)
    meeting.status = MeetingStatus.canceled
    await db.commit()
    await db.refresh(meeting)

    client = await db.get(Client, meeting.client_id)
    client_user = await db.get(User, client.user_id) if client else None
    return _to_out(meeting, client_user.name if client_user else "", client_user.timezone if client_user else None)
