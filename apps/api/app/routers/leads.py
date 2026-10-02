import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.clients import Client
from app.models.leads import Lead
from app.models.enums import ClientStatus, LeadStage
from app.models.users import User
from app.routers.calendar import _to_out, create_meeting_for_client
from app.routers.clients import _to_client_out, create_client_with_user
from app.schemas.calendar import MeetingOut
from app.schemas.clients import ClientOut
from app.schemas.leads import LeadCreate, LeadOut, LeadScheduleRequest, LeadStageUpdate, LeadUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


async def _get_owned_lead(db: AsyncSession, coach: User, lead_id: uuid.UUID) -> Lead:
    lead = await db.get(Lead, lead_id)
    if lead is None or lead.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    return lead


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Lead:
    # exclude_none so an unset "source" falls through to the Lead model's own
    # NOT-NULL "manual" default instead of trying to insert an explicit NULL.
    lead = Lead(coach_id=coach.id, **body.model_dump(exclude_none=True))
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("", response_model=list[LeadOut])
async def list_leads(
    limit: int = 200,
    offset: int = 0,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[Lead]:
    result = await db.execute(
        select(Lead)
        .where(Lead.coach_id == coach.id)
        .order_by(Lead.created_at.desc())
        .limit(min(limit, 1000))
        .offset(offset)
    )
    return list(result.scalars().all())


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> Lead:
    return await _get_owned_lead(db, coach, lead_id)


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: uuid.UUID,
    body: LeadUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Lead:
    lead = await _get_owned_lead(db, coach, lead_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.patch("/{lead_id}/stage", response_model=LeadOut)
async def update_lead_stage(
    lead_id: uuid.UUID,
    body: LeadStageUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Lead:
    lead = await _get_owned_lead(db, coach, lead_id)
    lead.stage = body.stage
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/{lead_id}/convert", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def convert_lead(
    lead_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientOut:
    lead = await _get_owned_lead(db, coach, lead_id)
    if not lead.email:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Lead needs an email on file before converting"
        )

    # Scheduling a discovery call (POST /leads/{id}/schedule, below) already
    # creates a real Client row for this lead (trial_session status) so the
    # meeting has somewhere to attach — reuse it here instead of creating a
    # second, duplicate Client, so meeting/message history carries through.
    client: Client | None = None
    if lead.converted_client_id is not None:
        client = await db.get(Client, lead.converted_client_id)
        if client is not None and client.coach_id == coach.id:
            client.status = ClientStatus.active

    if client is None:
        client = await create_client_with_user(
            db,
            coach,
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            program=lead.interested_in,
            # lead.notes is the raw form Q&A dump for form-sourced leads — keep it
            # in the coach-only notes field, never in goals (a short, deliberately
            # authored line the client is meant to see, not auto-filled intake data).
            goals=None,
            notes=lead.notes,
        )

    lead.stage = LeadStage.converted
    lead.converted_client_id = client.id
    await db.commit()

    user = await db.get(User, client.user_id)
    assert user is not None
    return _to_client_out(client, user)


@router.post("/{lead_id}/schedule", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
async def schedule_lead_meeting(
    lead_id: uuid.UUID,
    body: LeadScheduleRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    """Lets a coach book a discovery call straight from the Leads pipeline,
    without leaving the app. A Lead isn't a Client yet, but a Meeting needs
    one to attach to — so this creates (or reuses, if already scheduled
    once) a real Client row for the lead, set to trial_session status. That
    status already exists specifically for "had a session, hasn't committed
    yet": it's excluded from active-client counts, billing, and the at-risk
    sweep, so an unconverted lead never silently counts as a paying client.
    convert_lead (above) reuses this same Client on actual conversion rather
    than creating a duplicate."""
    lead = await _get_owned_lead(db, coach, lead_id)
    if not lead.email:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Lead needs an email on file before scheduling"
        )

    client: Client | None = None
    if lead.converted_client_id is not None:
        client = await db.get(Client, lead.converted_client_id)
        if client is None or client.coach_id != coach.id:
            client = None

    if client is None:
        client = await create_client_with_user(
            db,
            coach,
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            program=lead.interested_in,
            goals=None,
            notes=lead.notes,
            status=ClientStatus.trial_session,
        )
        lead.converted_client_id = client.id

    user = await db.get(User, client.user_id)
    assert user is not None

    meeting = await create_meeting_for_client(
        db,
        coach,
        client,
        user,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        topic=f"Discovery call with {lead.name}",
    )
    await db.commit()
    await db.refresh(meeting)
    return _to_out(meeting, user.name)


@router.post("/{lead_id}/restore", response_model=LeadOut)
async def restore_lead(
    lead_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Lead:
    """Undo a mistaken conversion: puts the lead back in the pipeline and
    soft-deactivates (doesn't delete) the client record it created."""
    lead = await _get_owned_lead(db, coach, lead_id)
    if lead.stage != LeadStage.converted or lead.converted_client_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This lead hasn't been converted")

    client = await db.get(Client, lead.converted_client_id)
    if client is not None and client.coach_id == coach.id:
        client.status = ClientStatus.paused

    lead.stage = LeadStage.booked
    lead.converted_client_id = None
    await db.commit()
    await db.refresh(lead)
    return lead
