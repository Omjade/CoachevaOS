import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.clients import Client
from app.models.tasks import Task
from app.models.users import User
from app.schemas.tasks import TaskCreate, TaskOut, TaskUpdate

tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])
client_tasks_router = APIRouter(prefix="/clients", tags=["tasks"])


def _to_out(task: Task, added_by: User) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        due_date=task.due_date,
        done=task.done,
        priority=task.priority,
        is_recurring=task.is_recurring,
        added_by_user_id=task.added_by_user_id,
        added_by_name=added_by.name,
        added_by_role=added_by.role,
        created_at=task.created_at,
    )


async def _list_for_client(db: AsyncSession, client_id: uuid.UUID) -> list[TaskOut]:
    result = await db.execute(
        select(Task, User)
        .join(User, User.id == Task.added_by_user_id)
        .where(Task.client_id == client_id)
        .order_by(Task.done.asc(), Task.due_date.asc().nulls_last(), Task.created_at.desc())
    )
    return [_to_out(t, u) for t, u in result.all()]


@client_tasks_router.get("/me/tasks", response_model=list[TaskOut])
async def list_my_tasks(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[TaskOut]:
    return await _list_for_client(db, client.id)


@client_tasks_router.post(
    "/me/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED
)
async def add_my_task(
    body: TaskCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    user = await db.get(User, client.user_id)
    assert user is not None
    task = Task(
        coach_id=client.coach_id,
        client_id=client.id,
        title=body.title,
        due_date=body.due_date,
        priority=body.priority,
        added_by_user_id=user.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _to_out(task, user)


@client_tasks_router.get("/{client_id}/tasks", response_model=list[TaskOut])
async def list_client_tasks(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[TaskOut]:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return await _list_for_client(db, client_id)


@client_tasks_router.post(
    "/{client_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED
)
async def add_client_task(
    client_id: uuid.UUID,
    body: TaskCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    task = Task(
        coach_id=coach.id,
        client_id=client_id,
        title=body.title,
        due_date=body.due_date,
        priority=body.priority,
        added_by_user_id=coach.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _to_out(task, coach)


async def _get_owned_task(db: AsyncSession, user: User, task_id: uuid.UUID) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    if task.coach_id == user.id:
        return task

    result = await db.execute(select(Client).where(Client.id == task.client_id))
    client = result.scalar_one_or_none()
    if client is not None and client.user_id == user.id:
        return task

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")


@tasks_router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    task = await _get_owned_task(db, user, task_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    added_by = await db.get(User, task.added_by_user_id)
    assert added_by is not None
    return _to_out(task, added_by)


@tasks_router.patch("/{task_id}/complete", response_model=TaskOut)
async def toggle_task_complete(
    task_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    task = await _get_owned_task(db, user, task_id)
    task.done = not task.done
    await db.commit()
    await db.refresh(task)
    added_by = await db.get(User, task.added_by_user_id)
    assert added_by is not None
    return _to_out(task, added_by)
