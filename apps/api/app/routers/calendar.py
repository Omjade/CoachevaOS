import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach, require_coach
from app.models.calendar_connections import CalendarConnection
from app.models.clients import Client
from app.models.enums import CalendarProvider, MeetingStatus
from app.models.meetings import Meeting
from app.models.users import CoachProfile, User
from app.routers.integrations import create_video_call_link
from app.schemas.calendar import (
    AvailabilityRules,
    MeetingBookRequest,
    MeetingCreate,
    MeetingOut,
    SchedulingLinksOut,
)

router = APIRouter(tags=["calendar"])


def _to_out(meeting: Meeting, client_name: str) -> MeetingOut:
    return MeetingOut(
        id=meeting.id,
        client_id=meeting.client_id,
        client_name=client_name,
        starts_at=meeting.starts_at,
        ends_at=meeting.ends_at,
        status=meeting.status,
        meeting_url=meeting.meeting_url,
    )


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
    return [_to_out(m, u.name) for m, u in result.all()]


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

    meeting = Meeting(
        coach_id=coach.id,
        client_id=body.client_id,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        status=MeetingStatus.scheduled,
        meeting_url=await create_video_call_link(
            db,
            coach.id,
            starts_at=body.starts_at,
            ends_at=body.ends_at,
            topic=f"Session with {user.name}",
        ),
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
    return links


@router.get("/calendar/availability", response_model=AvailabilityRules)
async def get_coach_availability_for_client(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> AvailabilityRules:
    profile = await db.get(CoachProfile, client.coach_id)
    if profile is None or not profile.availability_rules_json:
        return AvailabilityRules()
    return AvailabilityRules.model_validate(profile.availability_rules_json)


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
    rules = (
        AvailabilityRules.model_validate(profile.availability_rules_json)
        if profile and profile.availability_rules_json
        else AvailabilityRules()
    )

    day_key = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][body.starts_at.weekday()]
    if not getattr(rules.days, day_key):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Coach is not bookable on that day")

    time_str = body.starts_at.strftime("%H:%M")
    if rules.slots and time_str not in rules.slots:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That time slot isn't offered")

    ends_at = body.starts_at + timedelta(minutes=rules.session_length)

    user = await db.get(User, client.user_id)
    assert user is not None

    meeting = Meeting(
        coach_id=client.coach_id,
        client_id=client.id,
        starts_at=body.starts_at,
        ends_at=ends_at,
        status=MeetingStatus.scheduled,
        meeting_url=await create_video_call_link(
            db,
            client.coach_id,
            starts_at=body.starts_at,
            ends_at=ends_at,
            topic=f"Session with {user.name}",
        ),
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)
    return _to_out(meeting, user.name)


@router.post("/webhooks/calcom", status_code=status.HTTP_200_OK)
async def calcom_webhook(request: Request) -> dict:
    # Placeholder receiver for when a real Cal.com account is connected — the
    # booking flow above is self-contained and doesn't depend on this yet.
    await request.body()
    return {"received": True}
