import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import MeetingStatus


class AvailabilityDays(BaseModel):
    mon: bool = False
    tue: bool = False
    wed: bool = False
    thu: bool = False
    fri: bool = False
    sat: bool = False
    sun: bool = False


class AvailabilityRules(BaseModel):
    session_length: int = 45
    buffer: int = 10
    days: AvailabilityDays = AvailabilityDays()
    slots: list[str] = []


class MeetingCreate(BaseModel):
    client_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime


class MeetingBookRequest(BaseModel):
    starts_at: datetime


class SchedulingLinksOut(BaseModel):
    calendly_url: str | None = None
    cal_com_url: str | None = None


class MeetingOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    starts_at: datetime
    ends_at: datetime
    status: MeetingStatus
    meeting_url: str | None

    model_config = {"from_attributes": True}
