import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.clients import Client
from app.models.sessions import SessionNote
from app.models.users import User
from app.routers.clients import _get_owned_client
from app.schemas.sessions import SessionNoteCreate, SessionNoteOut, SessionNoteUpdate

router = APIRouter(tags=["sessions"])


async def _get_owned_note(
    db: AsyncSession, coach_id: uuid.UUID, client_id: uuid.UUID, note_id: uuid.UUID
) -> SessionNote:
    note = await db.get(SessionNote, note_id)
    if note is None or note.coach_id != coach_id or note.client_id != client_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session note not found")
    return note


# NOTE: /clients/me/sessions must be declared before /clients/{client_id}/sessions —
# same route-ordering reason documented in goals.py.


@router.get("/clients/me/sessions", response_model=list[SessionNoteOut])
async def list_my_sessions(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[SessionNote]:
    result = await db.execute(
        select(SessionNote)
        .where(SessionNote.client_id == client.id)
        .order_by(SessionNote.session_date.desc())
    )
    return list(result.scalars().all())


@router.get("/clients/{client_id}/sessions", response_model=list[SessionNoteOut])
async def list_client_sessions(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[SessionNote]:
    await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(SessionNote)
        .where(SessionNote.client_id == client_id)
        .order_by(SessionNote.session_date.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/clients/{client_id}/sessions", response_model=SessionNoteOut, status_code=status.HTTP_201_CREATED
)
async def create_client_session(
    client_id: uuid.UUID,
    body: SessionNoteCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> SessionNote:
    await _get_owned_client(db, coach, client_id)
    note = SessionNote(coach_id=coach.id, client_id=client_id, created_by=coach.id, **body.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.patch("/clients/{client_id}/sessions/{note_id}", response_model=SessionNoteOut)
async def update_client_session(
    client_id: uuid.UUID,
    note_id: uuid.UUID,
    body: SessionNoteUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> SessionNote:
    await _get_owned_client(db, coach, client_id)
    note = await _get_owned_note(db, coach.id, client_id, note_id)
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(note, key, value)
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/clients/{client_id}/sessions/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_session(
    client_id: uuid.UUID,
    note_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_owned_client(db, coach, client_id)
    note = await _get_owned_note(db, coach.id, client_id, note_id)
    await db.delete(note)
    await db.commit()
