import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import CheckinType


class CheckinCreate(BaseModel):
    type: CheckinType
    mood: str
    one_liner: str | None = None
    progress_notes: str | None = None
    challenges: str | None = None
    wins: str | None = None


class CheckinOut(BaseModel):
    id: uuid.UUID
    type: CheckinType
    period_key: str
    mood: str | None
    one_liner: str | None
    progress_notes: str | None
    challenges: str | None
    wins: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}
