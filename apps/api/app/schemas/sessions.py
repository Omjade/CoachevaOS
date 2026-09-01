import uuid
from datetime import date, datetime

from pydantic import BaseModel


class SessionNoteCreate(BaseModel):
    meeting_id: uuid.UUID | None = None
    session_date: date
    objective: str | None = None
    discussion_notes: str | None = None
    key_insights: str | None = None
    action_items: list[str] | None = None
    wins: str | None = None
    challenges: str | None = None
    follow_up_date: date | None = None


class SessionNoteUpdate(BaseModel):
    session_date: date | None = None
    objective: str | None = None
    discussion_notes: str | None = None
    key_insights: str | None = None
    action_items: list[str] | None = None
    wins: str | None = None
    challenges: str | None = None
    follow_up_date: date | None = None


class SessionNoteOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    meeting_id: uuid.UUID | None
    session_date: date
    objective: str | None
    discussion_notes: str | None
    key_insights: str | None
    action_items: list[str] | None
    wins: str | None
    challenges: str | None
    follow_up_date: date | None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
