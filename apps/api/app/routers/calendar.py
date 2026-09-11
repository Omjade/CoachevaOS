import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.calendar_connections import CalendarConnection
from app.models.clients import Client
from app.models.enums import CalendarProvider, ClientStatus, MeetingStatus, SessionType, UserRole
from app.models.meetings import Meeting
from app.models.users import CoachProfile, User
from app.routers.integrations import create_video_call_link, get_preferred_video_provider
from app.schemas.calendar import (
    AttendanceOverviewRow,
    AvailabilityRules,
    AvailabilityRulesForClient,
    MeetingBookRequest,
    MeetingCreate,
    MeetingOut,
    MeetingRescheduleRequest,
    SchedulingLinksOut,
    SessionBulkCreateRequest,
    SessionBulkCreateResult,
    SessionUpdateRequest,
)
from app.utils.time import utcnow

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
        session_type=meeting.session_type,
        location=meeting.location,
        recurrence_group_id=meeting.recurrence_group_id,
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


_WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _generate_range_dates(start_date: str, end_date: str, weekdays: list[str]) -> list[str]:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    if end < start:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "end_date must be on or after start_date")
    wanted = set(weekdays)
    dates = []
    current = start
    while current <= end:
        if _WEEKDAY_KEYS[current.weekday()] in wanted:
            dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


@router.get("/sessions", response_model=list[MeetingOut])
async def list_sessions(
    client_id: uuid.UUID | None = Query(None),
    start: str | None = Query(None),
    end: str | None = Query(None),
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[MeetingOut]:
    """Per-client Session Log / Calendar view — same underlying `meetings`
    data as GET /meetings, filterable by client and a date window."""
    query = (
        select(Meeting, User)
        .join(Client, Client.id == Meeting.client_id)
        .outerjoin(User, User.id == Client.user_id)
        .where(Meeting.coach_id == coach.id)
    )
    if client_id is not None:
        query = query.where(Meeting.client_id == client_id)
    if start:
        query = query.where(Meeting.starts_at >= datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=ZoneInfo("UTC")))
    if end:
        query = query.where(
            Meeting.starts_at < datetime.strptime(end, "%Y-%m-%d").replace(tzinfo=ZoneInfo("UTC")) + timedelta(days=1)
        )
    query = query.order_by(Meeting.starts_at.asc())
    result = await db.execute(query)
    return [_to_out(m, u.name if u else "", u.timezone if u else None) for m, u in result.all()]


@router.get("/sessions/today", response_model=list[MeetingOut])
async def todays_sessions(
    date: str = Query(...),
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[MeetingOut]:
    """Dashboard's Today's Sessions panel — `date` is the coach's own
    selected day (already resolved to their local calendar date client-side),
    matched against meetings by that UTC calendar day."""
    day_start = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=ZoneInfo("UTC"))
    day_end = day_start + timedelta(days=1)
    result = await db.execute(
        select(Meeting, User)
        .join(Client, Client.id == Meeting.client_id)
        .outerjoin(User, User.id == Client.user_id)
        .where(
            Meeting.coach_id == coach.id,
            Meeting.starts_at >= day_start,
            Meeting.starts_at < day_end,
        )
        .order_by(Meeting.starts_at.asc())
    )
    return [_to_out(m, u.name if u else "", u.timezone if u else None) for m, u in result.all()]


@router.post(
    "/sessions/bulk-create", response_model=SessionBulkCreateResult, status_code=status.HTTP_201_CREATED
)
async def bulk_create_sessions(
    body: SessionBulkCreateRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> SessionBulkCreateResult:
    """Schedule Builder submit — bulk-inserts Meeting rows sharing one
    recurrence_group_id, from either a date-range+weekday-recurrence spec or
    an explicit list of dates. Best-effort per slot: a slot that collides
    with an existing booking is skipped rather than failing the whole batch."""
    client = await db.get(Client, body.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    user = await db.get(User, client.user_id) if client.user_id else None
    client_name = user.name if user else (client.program or "Client")

    tz = _safe_zone(coach.timezone)

    if body.dates:
        entries = [(d.date, d.time) for d in body.dates]
    else:
        assert body.start_date and body.end_date and body.weekdays and body.time
        for wd in body.weekdays:
            if wd not in _WEEKDAY_KEYS:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid weekday: {wd}")
        entries = [(d, body.time) for d in _generate_range_dates(body.start_date, body.end_date, body.weekdays)]

    if not entries:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No sessions to create for those settings")

    recurrence_group_id = uuid.uuid4()
    created: list[Meeting] = []
    duration = timedelta(minutes=body.duration_minutes)

    for date_str, time_str in entries:
        starts_at = _local_wall_clock_to_utc(date_str, time_str, tz).astimezone(ZoneInfo("UTC"))
        ends_at = starts_at + duration
        if await _conflict_exists(db, coach.id, starts_at, ends_at):
            continue

        meeting_url: str | None = None
        meeting_provider: str | None = None
        if body.session_type == SessionType.video:
            if body.video_provider in (CalendarProvider.google, CalendarProvider.zoom):
                meeting_provider, meeting_url = await create_video_call_link(
                    db,
                    coach.id,
                    starts_at=starts_at,
                    ends_at=ends_at,
                    topic=f"Session with {client_name}",
                    provider=body.video_provider,
                )
            else:
                meeting_url = body.manual_meeting_url
                meeting_provider = body.video_provider.value if body.video_provider else None

        meeting = Meeting(
            coach_id=coach.id,
            client_id=client.id,
            starts_at=starts_at,
            ends_at=ends_at,
            status=MeetingStatus.scheduled,
            meeting_url=meeting_url,
            meeting_provider=meeting_provider,
            session_type=body.session_type,
            location=body.location if body.session_type == SessionType.in_person else None,
            recurrence_group_id=recurrence_group_id,
        )
        db.add(meeting)
        created.append(meeting)

    if not created:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Every generated slot conflicts with an existing session."
        )

    await db.commit()
    for m in created:
        await db.refresh(m)

    return SessionBulkCreateResult(
        recurrence_group_id=recurrence_group_id,
        created=[_to_out(m, client_name) for m in created],
    )


@router.patch("/sessions/{meeting_id}", response_model=MeetingOut)
async def update_session(
    meeting_id: uuid.UUID,
    body: SessionUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    meeting = await _load_owned_meeting(db, meeting_id, user)

    has_time_change = body.starts_at is not None or (body.date is not None and body.time is not None)
    if has_time_change:
        if meeting.booking_source != "internal":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This session was booked externally — reschedule it from where it was booked.",
            )
        duration = meeting.ends_at - meeting.starts_at
        if body.starts_at is not None:
            new_starts_at = body.starts_at
        else:
            coach_user = await db.get(User, meeting.coach_id)
            tz = _safe_zone(coach_user.timezone if coach_user else None)
            assert body.date is not None and body.time is not None
            new_starts_at = _local_wall_clock_to_utc(body.date, body.time, tz).astimezone(ZoneInfo("UTC"))
        new_ends_at = new_starts_at + duration
        if await _conflict_exists(db, meeting.coach_id, new_starts_at, new_ends_at, exclude_meeting_id=meeting.id):
            raise HTTPException(status.HTTP_409_CONFLICT, "That time is already booked. Pick another slot.")
        meeting.starts_at = new_starts_at
        meeting.ends_at = new_ends_at
        # A changed time detaches this session from its bulk-created series —
        # bulk actions like "cancel all remaining" should no longer touch a
        # session the coach has individually moved.
        meeting.recurrence_group_id = None

    if body.status is not None:
        meeting.status = body.status
        if body.status in (MeetingStatus.attended, MeetingStatus.no_show):
            meeting.marked_by = user.id
            meeting.marked_at = utcnow()

    await db.commit()
    await db.refresh(meeting)

    client = await db.get(Client, meeting.client_id)
    client_user = await db.get(User, client.user_id) if client and client.user_id else None
    return _to_out(meeting, client_user.name if client_user else "", client_user.timezone if client_user else None)


@router.patch("/sessions/recurrence/{group_id}/cancel-remaining", response_model=list[MeetingOut])
async def cancel_remaining_in_series(
    group_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[MeetingOut]:
    result = await db.execute(
        select(Meeting).where(
            Meeting.coach_id == coach.id,
            Meeting.recurrence_group_id == group_id,
            Meeting.status == MeetingStatus.scheduled,
            Meeting.starts_at > utcnow(),
        )
    )
    meetings = result.scalars().all()
    for m in meetings:
        m.status = MeetingStatus.canceled
    await db.commit()

    out: list[MeetingOut] = []
    for m in meetings:
        await db.refresh(m)
        client = await db.get(Client, m.client_id)
        client_user = await db.get(User, client.user_id) if client and client.user_id else None
        out.append(_to_out(m, client_user.name if client_user else ""))
    return out


@router.get("/sessions/attendance-overview", response_model=list[AttendanceOverviewRow])
async def attendance_overview(
    range: str = Query("this_month"),
    start: str | None = Query(None),
    end: str | None = Query(None),
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceOverviewRow]:
    """Coach-level aggregate over `meetings` — no new table. `attendance_rate`
    is attended / (attended + no_show), same formula as the per-client
    Session Log header (excludes still-scheduled/cancelled from the rate,
    though `scheduled` in the response is the total count in the window)."""
    now = utcnow()
    if range == "this_week":
        range_start = now - timedelta(days=now.weekday())
        range_end = now
    elif range == "last_30_days":
        range_start = now - timedelta(days=30)
        range_end = now
    elif range == "custom" and start and end:
        range_start = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=ZoneInfo("UTC"))
        range_end = datetime.strptime(end, "%Y-%m-%d").replace(tzinfo=ZoneInfo("UTC")) + timedelta(days=1)
    else:  # this_month (default)
        range_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        range_end = now

    result = await db.execute(
        select(Meeting, Client, User)
        .join(Client, Client.id == Meeting.client_id)
        .outerjoin(User, User.id == Client.user_id)
        .where(
            Meeting.coach_id == coach.id,
            Meeting.starts_at >= range_start,
            Meeting.starts_at <= range_end,
            Client.status != ClientStatus.deleted,
        )
    )
    rows: dict[uuid.UUID, dict] = {}
    for meeting, client, user in result.all():
        entry = rows.setdefault(
            client.id,
            {
                "client_name": user.name if user else (client.program or "Client"),
                "scheduled": 0,
                "attended": 0,
                "no_show": 0,
            },
        )
        entry["scheduled"] += 1
        if meeting.status in (MeetingStatus.attended, MeetingStatus.completed):
            entry["attended"] += 1
        elif meeting.status == MeetingStatus.no_show:
            entry["no_show"] += 1

    overview: list[AttendanceOverviewRow] = []
    for client_id, entry in rows.items():
        marked = entry["attended"] + entry["no_show"]
        rate = round(entry["attended"] / marked, 3) if marked else 0.0
        overview.append(
            AttendanceOverviewRow(
                client_id=client_id,
                client_name=entry["client_name"],
                scheduled=entry["scheduled"],
                attended=entry["attended"],
                no_show=entry["no_show"],
                attendance_rate=rate,
            )
        )
    overview.sort(key=lambda r: r.attendance_rate)
    return overview
