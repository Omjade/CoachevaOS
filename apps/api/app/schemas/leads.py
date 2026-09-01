import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import LeadStage


class LeadCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    interested_in: str | None = None
    notes: str | None = None
    source: str | None = None


class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    interested_in: str | None = None
    notes: str | None = None


class LeadStageUpdate(BaseModel):
    stage: LeadStage


class LeadOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None
    email: str | None
    interested_in: str | None
    stage: LeadStage
    notes: str | None
    created_at: datetime
    last_contacted_at: datetime | None
    source: str
    form_submission_id: uuid.UUID | None

    model_config = {"from_attributes": True}
