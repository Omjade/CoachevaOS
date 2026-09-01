import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.ingest import ingest_document_for_rag
from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.clients import Client
from app.models.documents import Document
from app.models.enums import MessageType
from app.models.messaging import Thread
from app.models.users import User
from app.routers.threads import _create_and_broadcast
from app.schemas.documents import DocumentOut, DocumentShareOut, DocumentShareRequest
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
        is_library=doc.client_id is None,
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile,
    client_id: uuid.UUID | None = None,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    """client_id omitted = a coach's own client-agnostic reference document —
    never visible to any client, kept in one place for the coach's own use."""
    if client_id is not None:
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
    await ingest_document_for_rag(db, doc)
    return _to_out(doc, coach.name)


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    client_id: uuid.UUID | None = None,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentOut]:
    if client_id is not None:
        client = await db.get(Client, client_id)
        if client is None or client.coach_id != coach.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
        where_clause = Document.client_id == client_id
    else:
        # The coach's own library — never any other coach's, never a
        # particular client's.
        where_clause = (Document.coach_id == coach.id) & (Document.client_id.is_(None))

    result = await db.execute(
        select(Document, User)
        .join(User, User.id == Document.uploaded_by)
        .where(where_clause)
        .order_by(Document.created_at.desc())
    )
    return [_to_out(d, u.name) for d, u in result.all()]


@router.post("/{document_id}/share", response_model=DocumentShareOut)
async def share_document_with_clients(
    document_id: uuid.UUID,
    body: DocumentShareRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> DocumentShareOut:
    """Sends a reference link to the document as a chat message to each
    selected client's existing thread — mirrors forms.py's share_form_with_clients.
    Usable on any document regardless of whether it started client-scoped or
    library-scoped. download_document's authorization only ever grants access
    to the document's own client_id, which a library doc (client_id=None)
    doesn't have — so sharing creates one new per-client Document row per
    recipient, pointing at the SAME s3_key (no re-upload, one file on disk,
    several DB rows), which reuses that existing check with zero changes
    there and also makes the shared file show up in the client's own
    document list, not just a chat message."""
    doc = await db.get(Document, document_id)
    if doc is None or doc.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    result = await db.execute(
        select(Client.id).where(Client.id.in_(body.client_ids), Client.coach_id == coach.id)
    )
    owned_client_ids = set(result.scalars().all())

    sent = 0
    for client_id in owned_client_ids:
        thread_result = await db.execute(
            select(Thread).where(Thread.client_id == client_id, Thread.coach_id == coach.id)
        )
        thread = thread_result.scalar_one_or_none()
        if thread is None:
            continue

        shared_doc = doc
        if doc.client_id != client_id:
            shared_doc = Document(
                coach_id=coach.id,
                client_id=client_id,
                name=doc.name,
                type=doc.type,
                s3_key=doc.s3_key,
                uploaded_by=coach.id,
            )
            db.add(shared_doc)
            await db.flush()

        message_body = f'{coach.name} shared a document with you: "{doc.name}"\n/documents/{shared_doc.id}/download'
        await _create_and_broadcast(
            db, thread, coach, type_=MessageType.text, body=message_body, media_url=None
        )
        sent += 1
    return DocumentShareOut(sent=sent)


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
    await ingest_document_for_rag(db, doc)
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
