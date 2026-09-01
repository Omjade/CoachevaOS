import uuid
from datetime import datetime

from pydantic import BaseModel


class AttentionItem(BaseModel):
    client_id: uuid.UUID
    client_name: str
    bucket: str
    reason: str
    thread_id: uuid.UUID | None
    suggested_action: str


class NeedsAttentionOut(BaseModel):
    items: list[AttentionItem]
    generated_at: datetime
