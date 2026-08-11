import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.leads import Lead
from app.models.enums import LeadStage
from app.models.users import User
from app.routers.clients import _to_client_out, create_client_with_user
from app.schemas.clients import ClientOut
from app.schemas.leads import LeadCreate, LeadOut, LeadStageUpdate, LeadUpdate

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
    lead = Lead(coach_id=coach.id, **body.model_dump())
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

    client = await create_client_with_user(
        db,
        coach,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        program=lead.interested_in,
        goals=lead.notes,
    )
    lead.stage = LeadStage.converted
    await db.commit()

    user = await db.get(User, client.user_id)
    assert user is not None
    return _to_client_out(client, user)
