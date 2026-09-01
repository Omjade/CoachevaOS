import uuid
from datetime import datetime

from pydantic import BaseModel


class AssistantSettingsOut(BaseModel):
    enabled: bool
    tone: str | None
    style_notes: str | None
    custom_instructions: str | None
    daily_query_limit: int
    platform_query_ceiling: int

    model_config = {"from_attributes": True}


class AssistantSettingsUpdate(BaseModel):
    enabled: bool | None = None
    tone: str | None = None
    style_notes: str | None = None
    custom_instructions: str | None = None
    daily_query_limit: int | None = None


class AssistantMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    escalated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AssistantMessageCreate(BaseModel):
    content: str


class AssistantMessageSendOut(BaseModel):
    reply: AssistantMessageOut
    remaining_today: int
