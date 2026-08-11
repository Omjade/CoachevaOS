import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.clients import Client
from app.models.goals import ClientGoal
from app.models.users import User
from app.routers.clients import _get_owned_client
from app.schemas.goals import GoalCreate, GoalOut, GoalUpdate

router = APIRouter(tags=["goals"])


async def _next_order(db: AsyncSession, client_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.coalesce(func.max(ClientGoal.order), -1)).where(ClientGoal.client_id == client_id)
    )
    return (result.scalar_one() or -1) + 1


async def _get_goal(db: AsyncSession, client_id: uuid.UUID, goal_id: uuid.UUID) -> ClientGoal:
    goal = await db.get(ClientGoal, goal_id)
    if goal is None or goal.client_id != client_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    return goal


def _apply_update(goal: ClientGoal, body: GoalUpdate) -> None:
    if body.title is not None:
        goal.title = body.title
    if body.target_date is not None:
        goal.target_date = body.target_date
    if body.done is not None:
        goal.done = body.done
    if body.order is not None:
        goal.order = body.order


# NOTE: the /clients/me/goals routes must be declared before /clients/{client_id}/goals —
# Starlette matches routes in registration order, and a client_id path converter has no
# runtime type constraint until FastAPI parses it, so "me" would otherwise match the
# parameterized route first and fail UUID validation (same ordering already used in clients.py).


@router.get("/clients/me/goals", response_model=list[GoalOut])
async def list_my_goals(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[ClientGoal]:
    result = await db.execute(
        select(ClientGoal).where(ClientGoal.client_id == client.id).order_by(ClientGoal.order)
    )
    return list(result.scalars().all())


@router.post("/clients/me/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_my_goal(
    body: GoalCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ClientGoal:
    goal = ClientGoal(
        client_id=client.id,
        created_by=client.user_id,
        title=body.title,
        target_date=body.target_date,
        order=await _next_order(db, client.id),
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.patch("/clients/me/goals/{goal_id}", response_model=GoalOut)
async def update_my_goal(
    goal_id: uuid.UUID,
    body: GoalUpdate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ClientGoal:
    goal = await _get_goal(db, client.id, goal_id)
    _apply_update(goal, body)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/clients/me/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_goal(
    goal_id: uuid.UUID,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> None:
    goal = await _get_goal(db, client.id, goal_id)
    await db.delete(goal)
    await db.commit()


@router.get("/clients/{client_id}/goals", response_model=list[GoalOut])
async def list_client_goals(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[ClientGoal]:
    await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(ClientGoal).where(ClientGoal.client_id == client_id).order_by(ClientGoal.order)
    )
    return list(result.scalars().all())


@router.post("/clients/{client_id}/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_client_goal(
    client_id: uuid.UUID,
    body: GoalCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientGoal:
    await _get_owned_client(db, coach, client_id)
    goal = ClientGoal(
        client_id=client_id,
        created_by=coach.id,
        title=body.title,
        target_date=body.target_date,
        order=await _next_order(db, client_id),
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.patch("/clients/{client_id}/goals/{goal_id}", response_model=GoalOut)
async def update_client_goal(
    client_id: uuid.UUID,
    goal_id: uuid.UUID,
    body: GoalUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientGoal:
    await _get_owned_client(db, coach, client_id)
    goal = await _get_goal(db, client_id, goal_id)
    _apply_update(goal, body)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/clients/{client_id}/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_goal(
    client_id: uuid.UUID,
    goal_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_owned_client(db, coach, client_id)
    goal = await _get_goal(db, client_id, goal_id)
    await db.delete(goal)
    await db.commit()
