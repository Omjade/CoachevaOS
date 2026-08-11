import uuid
from datetime import datetime

from pydantic import BaseModel


class IntakeCreate(BaseModel):
    goals: str | None = None
    experience: str | None = None
    availability: str | None = None
    notes: str | None = None


class IntakeOut(BaseModel):
    id: uuid.UUID
    goals: str | None
    experience: str | None
    availability: str | None
    notes: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}
