import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import MessageType


class MessageCreate(BaseModel):
    body: str


class MessageOut(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    sender_id: uuid.UUID
    type: MessageType
    body: str | None
    media_url: str | None
    created_at: datetime
    read_at: datetime | None

    model_config = {"from_attributes": True}


class ThreadOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    last_message_at: datetime | None
    last_message_preview: str | None
    unread_count: int = 0
    timezone: str = "UTC"


class PresenceOut(BaseModel):
    user_id: uuid.UUID
    online: bool
    last_seen_at: datetime | None
