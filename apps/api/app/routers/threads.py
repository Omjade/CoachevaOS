import json
import mimetypes
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session, get_db
from app.deps import get_current_client, get_current_user, require_coach
from app.models.clients import Client
from app.models.enums import MessageType
from app.models.messaging import Message, Thread
from app.models.notifications import Notification
from app.models.users import User
from app.schemas.messaging import MessageCreate, MessageOut, PresenceOut, ThreadOut
from app.security import decode_token
from app.storage import get_presigned_url, read_file, save_upload
from app.utils.time import utcnow
from app.ws import manager

router = APIRouter(tags=["chat"])


async def _get_authorized_thread(db: AsyncSession, user: User, thread_id: uuid.UUID) -> Thread:
    thread = await db.get(Thread, thread_id)
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")

    if thread.coach_id == user.id:
        return thread

    result = await db.execute(select(Client).where(Client.id == thread.client_id))
    client = result.scalar_one_or_none()
    if client is not None and client.user_id == user.id:
        return thread

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")


async def _other_party_user_id(db: AsyncSession, thread: Thread, sender_id: uuid.UUID) -> uuid.UUID:
    if sender_id == thread.coach_id:
        result = await db.execute(select(Client).where(Client.id == thread.client_id))
        client = result.scalar_one()
        return client.user_id
    return thread.coach_id


async def _counterpart_user_ids(db: AsyncSession, user: User) -> list[uuid.UUID]:
    """Everyone this user has a thread with — a coach's clients, or a client's coach."""
    coach_threads = await db.execute(select(Thread.client_id).where(Thread.coach_id == user.id))
    client_ids = list(coach_threads.scalars().all())
    if client_ids:
        result = await db.execute(select(Client.user_id).where(Client.id.in_(client_ids)))
        return [uid for uid in result.scalars().all() if uid is not None]

    client_thread = await db.execute(select(Thread.coach_id).where(Thread.client_id == user.id))
    return list(client_thread.scalars().all())


@router.get("/threads", response_model=list[ThreadOut])
async def list_threads(
    limit: int = 100,
    offset: int = 0,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[ThreadOut]:
    result = await db.execute(
        select(Thread, Client, User)
        .join(Client, Client.id == Thread.client_id)
        .join(User, User.id == Client.user_id)
        .where(Thread.coach_id == coach.id)
        .order_by(Thread.last_message_at.desc().nulls_last())
        .limit(min(limit, 500))
        .offset(offset)
    )
    rows = result.all()
    thread_ids = [thread.id for thread, _client, _user in rows]

    # Batched instead of per-thread (was N+1: two extra queries per thread).
    last_message_by_thread: dict[uuid.UUID, str | None] = {}
    unread_by_thread: dict[uuid.UUID, int] = {}
    if thread_ids:
        last_msgs_result = await db.execute(
            select(Message.thread_id, Message.body)
            .where(Message.thread_id.in_(thread_ids))
            .order_by(Message.thread_id, Message.created_at.desc())
            .distinct(Message.thread_id)
        )
        last_message_by_thread = dict(last_msgs_result.all())

        unread_result = await db.execute(
            select(Message.thread_id, func.count(Message.id))
            .where(
                Message.thread_id.in_(thread_ids),
                Message.sender_id != coach.id,
                Message.read_at.is_(None),
            )
            .group_by(Message.thread_id)
        )
        unread_by_thread = dict(unread_result.all())

    out = []
    for thread, _client, user in rows:
        out.append(
            ThreadOut(
                id=thread.id,
                client_id=thread.client_id,
                client_name=user.name,
                last_message_at=thread.last_message_at,
                last_message_preview=last_message_by_thread.get(thread.id),
                unread_count=unread_by_thread.get(thread.id, 0),
                timezone=user.timezone,
            )
        )
    return out


@router.get("/threads/me", response_model=ThreadOut)
async def get_my_thread(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> ThreadOut:
    result = await db.execute(select(Thread).where(Thread.client_id == client.id))
    thread = result.scalar_one_or_none()
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")
    coach = await db.get(User, thread.coach_id)
    assert coach is not None
    unread_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.thread_id == thread.id,
            Message.sender_id != client.user_id,
            Message.read_at.is_(None),
        )
    )
    return ThreadOut(
        id=thread.id,
        client_id=thread.client_id,
        client_name=coach.name,
        last_message_at=thread.last_message_at,
        last_message_preview=None,
        unread_count=unread_result.scalar_one() or 0,
        timezone=coach.timezone,
    )


@router.get("/threads/{thread_id}/messages", response_model=list[MessageOut])
async def list_messages(
    thread_id: uuid.UUID,
    limit: int = 200,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    await _get_authorized_thread(db, user, thread_id)
    # Fetch the most recent `limit` messages, then re-sort ascending — a plain
    # ascending-order LIMIT would truncate the newest messages instead of the oldest.
    result = await db.execute(
        select(Message)
        .where(Message.thread_id == thread_id)
        .order_by(Message.created_at.desc())
        .limit(min(limit, 1000))
    )
    return list(reversed(result.scalars().all()))


@router.get("/threads/{thread_id}/presence", response_model=PresenceOut)
async def get_thread_presence(
    thread_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PresenceOut:
    thread = await _get_authorized_thread(db, user, thread_id)
    other_id = await _other_party_user_id(db, thread, user.id)
    other = await db.get(User, other_id)
    assert other is not None
    return PresenceOut(
        user_id=other_id, online=manager.is_online(other_id), last_seen_at=other.last_seen_at
    )


@router.post("/threads/{thread_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_thread_read(
    thread_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    thread = await _get_authorized_thread(db, user, thread_id)
    result = await db.execute(
        select(Message).where(
            Message.thread_id == thread.id,
            Message.sender_id != user.id,
            Message.read_at.is_(None),
        )
    )
    now = utcnow()
    for message in result.scalars().all():
        message.read_at = now
    await db.commit()


async def _create_and_broadcast(
    db: AsyncSession,
    thread: Thread,
    sender: User,
    *,
    type_: MessageType,
    body: str | None,
    media_url: str | None,
) -> Message:
    message = Message(
        thread_id=thread.id, sender_id=sender.id, type=type_, body=body, media_url=media_url
    )
    db.add(message)
    thread.last_message_at = utcnow()

    other_user_id = await _other_party_user_id(db, thread, sender.id)
    db.add(
        Notification(
            user_id=other_user_id,
            type="new_message",
            payload_json={"message": f"New message from {sender.name}", "thread_id": str(thread.id)},
        )
    )

    await db.commit()
    await db.refresh(message)

    payload = {
        "event": "message",
        "message": {
            "id": str(message.id),
            "thread_id": str(message.thread_id),
            "sender_id": str(message.sender_id),
            "type": message.type.value,
            "body": message.body,
            "media_url": message.media_url,
            "created_at": message.created_at.isoformat(),
            "read_at": None,
        },
    }
    await manager.send_to_user(other_user_id, payload)
    await manager.send_to_user(sender.id, payload)
    return message


@router.post(
    "/threads/{thread_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED
)
async def send_message(
    thread_id: uuid.UUID,
    body: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Message:
    thread = await _get_authorized_thread(db, user, thread_id)
    return await _create_and_broadcast(
        db, thread, user, type_=MessageType.text, body=body.body, media_url=None
    )


@router.post(
    "/threads/{thread_id}/messages/media",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def send_media_message(
    thread_id: uuid.UUID,
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Message:
    thread = await _get_authorized_thread(db, user, thread_id)
    key, file_type = await save_upload(file)
    type_map = {
        "image": MessageType.image,
        "pdf": MessageType.pdf,
        "video": MessageType.video,
        "voice": MessageType.voice,
        "file": MessageType.pdf,
    }
    return await _create_and_broadcast(
        db,
        thread,
        user,
        type_=type_map.get(file_type, MessageType.pdf),
        body=file.filename,
        media_url=key,
    )


@router.get("/threads/messages/{message_id}/media")
async def get_message_media(
    message_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    message = await db.get(Message, message_id)
    if message is None or not message.media_url:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    await _get_authorized_thread(db, user, message.thread_id)

    disposition = "inline" if message.type in (MessageType.image, MessageType.video) else "attachment"
    presigned = get_presigned_url(
        message.media_url,
        content_disposition=f'{disposition}; filename="{message.body or "attachment"}"',
    )
    if presigned:
        return RedirectResponse(presigned)

    content = await read_file(message.media_url)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    content_type, _ = mimetypes.guess_type(message.media_url)
    content_type = content_type or "application/octet-stream"
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{message.body or "attachment"}"'
        },
    )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("wrong token type")
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        await websocket.close(code=4401)
        return

    await manager.connect(user_id, websocket)
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        counterparts = await _counterpart_user_ids(db, user) if user else []
    for counterpart_id in counterparts:
        await manager.send_to_user(
            counterpart_id, {"event": "presence", "user_id": str(user_id), "online": True}
        )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except ValueError:
                continue
            if data.get("event") == "typing":
                thread_id = data.get("thread_id")
                if not thread_id:
                    continue
                async with async_session() as db:
                    thread = await db.get(Thread, uuid.UUID(thread_id))
                    if thread is None:
                        continue
                    other_id = await _other_party_user_id(db, thread, user_id)
                await manager.send_to_user(
                    other_id,
                    {"event": "typing", "thread_id": thread_id, "user_id": str(user_id)},
                )
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id, websocket)
        async with async_session() as db:
            db_user = await db.get(User, user_id)
            last_seen = utcnow()
            if db_user is not None:
                db_user.last_seen_at = last_seen
                await db.commit()
        for counterpart_id in counterparts:
            await manager.send_to_user(
                counterpart_id,
                {
                    "event": "presence",
                    "user_id": str(user_id),
                    "online": False,
                    "last_seen_at": last_seen.isoformat(),
                },
            )
