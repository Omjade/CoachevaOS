import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.clients import Client
from app.models.metrics import MetricDefinition, MetricEntry
from app.models.users import User
from app.routers.clients import _get_owned_client
from app.schemas.metrics import (
    MetricDefinitionCreate,
    MetricDefinitionOut,
    MetricEntryCreate,
    MetricEntryOut,
)

router = APIRouter(tags=["metrics"])


async def _get_owned_definition(
    db: AsyncSession, coach_id: uuid.UUID, definition_id: uuid.UUID
) -> MetricDefinition:
    definition = await db.get(MetricDefinition, definition_id)
    if definition is None or definition.coach_id != coach_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Metric not found")
    return definition


@router.get("/metric-definitions", response_model=list[MetricDefinitionOut])
async def list_metric_definitions(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> list[MetricDefinition]:
    result = await db.execute(select(MetricDefinition).where(MetricDefinition.coach_id == coach.id))
    return list(result.scalars().all())


@router.post(
    "/metric-definitions", response_model=MetricDefinitionOut, status_code=status.HTTP_201_CREATED
)
async def create_metric_definition(
    body: MetricDefinitionCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> MetricDefinition:
    definition = MetricDefinition(coach_id=coach.id, **body.model_dump())
    db.add(definition)
    await db.commit()
    await db.refresh(definition)
    return definition


@router.delete("/metric-definitions/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metric_definition(
    definition_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    definition = await _get_owned_definition(db, coach.id, definition_id)
    await db.delete(definition)
    await db.commit()


# NOTE: /clients/me/... routes must be declared before /clients/{client_id}/... —
# same route-ordering reason documented in goals.py.


@router.get("/clients/me/metric-definitions", response_model=list[MetricDefinitionOut])
async def list_my_metric_definitions(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[MetricDefinition]:
    result = await db.execute(
        select(MetricDefinition).where(MetricDefinition.coach_id == client.coach_id)
    )
    return list(result.scalars().all())


@router.get("/clients/me/metrics/{definition_id}/entries", response_model=list[MetricEntryOut])
async def list_my_metric_entries(
    definition_id: uuid.UUID,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> list[MetricEntry]:
    await _get_owned_definition(db, client.coach_id, definition_id)
    result = await db.execute(
        select(MetricEntry)
        .where(MetricEntry.definition_id == definition_id, MetricEntry.client_id == client.id)
        .order_by(MetricEntry.recorded_at)
    )
    return list(result.scalars().all())


@router.post(
    "/clients/me/metrics/{definition_id}/entries",
    response_model=MetricEntryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_metric_entry(
    definition_id: uuid.UUID,
    body: MetricEntryCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> MetricEntry:
    await _get_owned_definition(db, client.coach_id, definition_id)
    entry = MetricEntry(
        definition_id=definition_id, client_id=client.id, created_by=client.user_id, **body.model_dump()
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/clients/{client_id}/metrics/{definition_id}/entries", response_model=list[MetricEntryOut])
async def list_client_metric_entries(
    client_id: uuid.UUID,
    definition_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[MetricEntry]:
    await _get_owned_client(db, coach, client_id)
    await _get_owned_definition(db, coach.id, definition_id)
    result = await db.execute(
        select(MetricEntry)
        .where(MetricEntry.definition_id == definition_id, MetricEntry.client_id == client_id)
        .order_by(MetricEntry.recorded_at)
    )
    return list(result.scalars().all())


@router.post(
    "/clients/{client_id}/metrics/{definition_id}/entries",
    response_model=MetricEntryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_client_metric_entry(
    client_id: uuid.UUID,
    definition_id: uuid.UUID,
    body: MetricEntryCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> MetricEntry:
    await _get_owned_client(db, coach, client_id)
    await _get_owned_definition(db, coach.id, definition_id)
    entry = MetricEntry(
        definition_id=definition_id, client_id=client_id, created_by=coach.id, **body.model_dump()
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
