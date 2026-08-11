import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.clients import Client
from app.models.documents import Document
from app.models.users import User
from app.schemas.documents import DocumentOut
from app.storage import read_file, save_upload

router = APIRouter(prefix="/documents", tags=["documents"])


def _to_out(doc: Document, uploader_name: str) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        name=doc.name,
        type=doc.type,
        uploaded_by_name=uploader_name,
        created_at=doc.created_at,
        download_url=f"/documents/{doc.id}/download",
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    client_id: uuid.UUID,
    file: UploadFile,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    key, file_type = await save_upload(file)
    doc = Document(
        coach_id=coach.id,
        client_id=client_id,
        name=file.filename or "Untitled",
        type=file_type,
        s3_key=key,
        uploaded_by=coach.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return _to_out(doc, coach.name)


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentOut]:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    result = await db.execute(
        select(Document, User)
        .join(User, User.id == Document.uploaded_by)
        .where(Document.client_id == client_id)
        .order_by(Document.created_at.desc())
    )
    return [_to_out(d, u.name) for d, u in result.all()]


@router.post("/mine", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_my_document(
    file: UploadFile,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    key, file_type = await save_upload(file)
    doc = Document(
        coach_id=client.coach_id,
        client_id=client.id,
        name=file.filename or "Untitled",
        type=file_type,
        s3_key=key,
        uploaded_by=client.user_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    user = await db.get(User, client.user_id)
    assert user is not None
    return _to_out(doc, user.name)


@router.get("/mine", response_model=list[DocumentOut])
async def list_my_documents(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[DocumentOut]:
    result = await db.execute(
        select(Document, User)
        .join(User, User.id == Document.uploaded_by)
        .where(Document.client_id == client.id)
        .order_by(Document.created_at.desc())
    )
    return [_to_out(d, u.name) for d, u in result.all()]


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    is_owning_coach = doc.coach_id == user.id
    is_owning_client = False
    if not is_owning_coach:
        result = await db.execute(select(Client).where(Client.id == doc.client_id))
        client = result.scalar_one_or_none()
        is_owning_client = client is not None and client.user_id == user.id

    if not (is_owning_coach or is_owning_client):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    content = await read_file(doc.s3_key)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.name}"'},
    )
