import uuid
from datetime import date
from datetime import time as dt_time

from pydantic import BaseModel

from app.models.enums import TaskPriority, TodoCreatedVia


class TodoCreate(BaseModel):
    date: date
    text: str
    priority: TaskPriority | None = None
    time: dt_time | None = None


class TodoUpdate(BaseModel):
    text: str | None = None
    is_complete: bool | None = None
    priority: TaskPriority | None = None
    time: dt_time | None = None


class TodoOut(BaseModel):
    id: uuid.UUID
    date: date
    text: str
    is_complete: bool
    priority: TaskPriority | None
    time: dt_time | None
    created_via: TodoCreatedVia
    carried_forward_from: date | None = None

    model_config = {"from_attributes": True}


class VoiceParseRequest(BaseModel):
    transcript: str
    date: date


class VoiceParseResult(BaseModel):
    created: list[TodoOut]
