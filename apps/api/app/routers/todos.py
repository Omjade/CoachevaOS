import json
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_text
from app.db import get_db
from app.deps import require_coach
from app.models.enums import TodoCreatedVia
from app.models.todos import Todo
from app.models.users import User
from app.schemas.todos import TodoCreate, TodoOut, TodoUpdate, VoiceParseRequest, VoiceParseResult

router = APIRouter(prefix="/todos", tags=["todos"])

VOICE_PARSE_SYSTEM_PROMPT = (
    "Extract a clean list of discrete, actionable to-do items from the coach's "
    "spoken notes. Return ONLY a JSON array of strings, no other text."
)


@router.get("", response_model=list[TodoOut])
async def list_todos(
    date: date = Query(...),
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[TodoOut]:
    result = await db.execute(
        select(Todo)
        .where(Todo.coach_id == coach.id, Todo.date == date)
        .order_by(Todo.time.asc().nulls_last(), Todo.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
async def create_todo(
    body: TodoCreate, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> TodoOut:
    todo = Todo(
        coach_id=coach.id,
        date=body.date,
        text=body.text,
        priority=body.priority,
        time=body.time,
        created_via=TodoCreatedVia.manual,
    )
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    return todo


async def _get_owned_todo(db: AsyncSession, coach: User, todo_id: uuid.UUID) -> Todo:
    todo = await db.get(Todo, todo_id)
    if todo is None or todo.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Todo not found")
    return todo


@router.patch("/{todo_id}", response_model=TodoOut)
async def update_todo(
    todo_id: uuid.UUID,
    body: TodoUpdate,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> TodoOut:
    todo = await _get_owned_todo(db, coach, todo_id)
    if body.text is not None:
        todo.text = body.text
    if body.is_complete is not None:
        todo.is_complete = body.is_complete
    if body.priority is not None:
        todo.priority = body.priority
    if body.time is not None:
        todo.time = body.time
    await db.commit()
    await db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> None:
    todo = await _get_owned_todo(db, coach, todo_id)
    await db.delete(todo)
    await db.commit()


@router.post("/carry-forward", response_model=list[TodoOut])
async def carry_forward_incomplete(
    date: date = Query(...),
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[TodoOut]:
    """Copies yesterday's incomplete todos into `date` — a copy, not a move,
    so the original day's list stays an accurate historical record."""
    yesterday = date - timedelta(days=1)
    result = await db.execute(
        select(Todo).where(Todo.coach_id == coach.id, Todo.date == yesterday, Todo.is_complete.is_(False))
    )
    carried: list[Todo] = []
    for source in result.scalars().all():
        copy = Todo(
            coach_id=coach.id,
            date=date,
            text=source.text,
            priority=source.priority,
            time=None,
            created_via=source.created_via,
            carried_forward_from=yesterday,
        )
        db.add(copy)
        carried.append(copy)
    await db.commit()
    for c in carried:
        await db.refresh(c)
    return carried


@router.post("/voice-parse", response_model=VoiceParseResult, status_code=status.HTTP_201_CREATED)
async def voice_parse(
    body: VoiceParseRequest, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> VoiceParseResult:
    text = await generate_text(VOICE_PARSE_SYSTEM_PROMPT, body.transcript, db=db, coach_id=coach.id, feature="todo_voice_parse")
    try:
        items = json.loads(text)
        if not isinstance(items, list):
            raise ValueError("Expected a JSON array")
        tasks = [str(item).strip() for item in items if str(item).strip()]
    except (json.JSONDecodeError, ValueError):
        # Graceful fallback: treat the whole transcript as one task rather
        # than silently dropping it when the model doesn't return clean JSON.
        tasks = [body.transcript.strip()] if body.transcript.strip() else []

    created: list[Todo] = []
    for task_text in tasks:
        todo = Todo(
            coach_id=coach.id,
            date=body.date,
            text=task_text[:500],
            created_via=TodoCreatedVia.voice_ai,
        )
        db.add(todo)
        created.append(todo)
    await db.commit()
    for t in created:
        await db.refresh(t)
    return VoiceParseResult(created=created)
