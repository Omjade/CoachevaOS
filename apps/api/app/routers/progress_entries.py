import mimetypes
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach
from app.models.clients import Client
from app.models.progress import ProgressEntry
from app.models.users import User
from app.routers.clients import _get_owned_client
from app.schemas.progress import ProgressEntryOut
from app.storage import read_file, save_upload
from app.utils.time import utcnow

router = APIRouter(tags=["progress"])


def _to_out(entry: ProgressEntry, creator_name: str) -> ProgressEntryOut:
    return ProgressEntryOut(
        id=entry.id,
        client_id=entry.client_id,
        created_by=entry.created_by,
        created_by_name=creator_name,
        note=entry.note,
        media_type=entry.media_type,
        entry_date=entry.entry_date,
        created_at=entry.created_at,
    )


async def _create_entry(
    db: AsyncSession,
    *,
    client_id: uuid.UUID,
    created_by: uuid.UUID,
    note: str | None,
    entry_date: date | None,
    file: UploadFile | None,
) -> ProgressEntry:
    if not note and file is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Add a note, a photo, or a video")

    media_key = None
    media_type = None
    if file is not None and file.filename:
        media_key, media_type = await save_upload(file)

    entry = ProgressEntry(
        client_id=client_id,
        created_by=created_by,
        note=note or None,
        media_key=media_key,
        media_type=media_type,
        entry_date=entry_date or utcnow().date(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


# NOTE: /clients/me/progress must be declared before /clients/{client_id}/progress —
# same route-ordering reason documented in goals.py.


@router.get("/clients/me/progress", response_model=list[ProgressEntryOut])
async def list_my_progress(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[ProgressEntryOut]:
    result = await db.execute(
        select(ProgressEntry, User)
        .join(User, User.id == ProgressEntry.created_by)
        .where(ProgressEntry.client_id == client.id)
        .order_by(ProgressEntry.entry_date.desc(), ProgressEntry.created_at.desc())
    )
    return [_to_out(e, u.name) for e, u in result.all()]


@router.post("/clients/me/progress", response_model=ProgressEntryOut, status_code=status.HTTP_201_CREATED)
async def create_my_progress(
    note: str | None = Form(default=None),
    entry_date: date | None = Form(default=None),
    file: UploadFile | None = None,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ProgressEntryOut:
    entry = await _create_entry(
        db,
        client_id=client.id,
        created_by=client.user_id,
        note=note,
        entry_date=entry_date,
        file=file,
    )
    user = await db.get(User, client.user_id)
    assert user is not None
    return _to_out(entry, user.name)


@router.get("/clients/{client_id}/progress", response_model=list[ProgressEntryOut])
async def list_client_progress(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[ProgressEntryOut]:
    await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(ProgressEntry, User)
        .join(User, User.id == ProgressEntry.created_by)
        .where(ProgressEntry.client_id == client_id)
        .order_by(ProgressEntry.entry_date.desc(), ProgressEntry.created_at.desc())
    )
    return [_to_out(e, u.name) for e, u in result.all()]


@router.post(
    "/clients/{client_id}/progress", response_model=ProgressEntryOut, status_code=status.HTTP_201_CREATED
)
async def create_client_progress(
    client_id: uuid.UUID,
    note: str | None = Form(default=None),
    entry_date: date | None = Form(default=None),
    file: UploadFile | None = None,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgressEntryOut:
    await _get_owned_client(db, coach, client_id)
    entry = await _create_entry(
        db,
        client_id=client_id,
        created_by=coach.id,
        note=note,
        entry_date=entry_date,
        file=file,
    )
    return _to_out(entry, coach.name)


@router.get("/progress/{entry_id}/media")
async def get_progress_media(
    entry_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(ProgressEntry, entry_id)
    if entry is None or not entry.media_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No media on this entry")

    result = await db.execute(select(Client).where(Client.id == entry.client_id))
    client = result.scalar_one_or_none()
    is_owning_coach = client is not None and client.coach_id == user.id
    is_owning_client = client is not None and client.user_id == user.id
    if not (is_owning_coach or is_owning_client):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    content = await read_file(entry.media_key)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    content_type, _ = mimetypes.guess_type(entry.media_key)
    fallback = "video/mp4" if entry.media_type == "video" else "image/jpeg"
    return Response(
        content=content,
        media_type=content_type or fallback,
        headers={"Content-Disposition": "inline"},
    )
