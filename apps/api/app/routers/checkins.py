import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_coach
from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.enums import CheckinType
from app.models.users import User
from app.schemas.checkins import CheckinCreate, CheckinOut
from app.utils.time import utcnow

router = APIRouter(prefix="/clients", tags=["checkins"])


def _current_period_key(type_: CheckinType, today: date | None = None) -> str:
    today = today or utcnow().date()
    if type_ == CheckinType.daily:
        return today.isoformat()
    iso_year, iso_week, _ = today.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


async def _get_for_period(
    db: AsyncSession, client_id: uuid.UUID, type_: CheckinType
) -> Checkin | None:
    period_key = _current_period_key(type_)
    result = await db.execute(
        select(Checkin).where(
            Checkin.client_id == client_id,
            Checkin.type == type_,
            Checkin.period_key == period_key,
        )
    )
    return result.scalar_one_or_none()


@router.get("/me/checkins/current", response_model=dict[str, CheckinOut | None])
async def get_my_current_checkins(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> dict:
    daily = await _get_for_period(db, client.id, CheckinType.daily)
    weekly = await _get_for_period(db, client.id, CheckinType.weekly)
    return {"daily": daily, "weekly": weekly}


@router.post("/me/checkins", response_model=CheckinOut, status_code=status.HTTP_201_CREATED)
async def submit_my_checkin(
    body: CheckinCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> Checkin:
    existing = await _get_for_period(db, client.id, body.type)
    if existing is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Already submitted your {body.type.value} check-in for this period",
        )

    checkin = Checkin(
        client_id=client.id,
        type=body.type,
        period_key=_current_period_key(body.type),
        mood=body.mood,
        one_liner=body.one_liner,
        progress_notes=body.progress_notes,
        challenges=body.challenges,
        wins=body.wins,
        submitted_at=utcnow(),
    )
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)
    return checkin


@router.get("/{client_id}/checkins", response_model=list[CheckinOut])
async def list_client_checkins(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[Checkin]:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    result = await db.execute(
        select(Checkin)
        .where(Checkin.client_id == client_id)
        .order_by(Checkin.submitted_at.desc())
        .limit(30)
    )
    return list(result.scalars().all())
