import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

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


class AvailabilityRulesForClient(AvailabilityRules):
    # Computed fresh from the coach's own User.timezone at request time, never
    # persisted into availability_rules_json — slots are wall-clock strings
    # ("09:00") with no timezone of their own, so this is what makes a
    # client's date/time picker (and the backend's booking validation)
    # interpret them the same way, instead of silently assuming UTC or the
    # client's own browser zone.
    coach_timezone: str = "UTC"


class MeetingCreate(BaseModel):
    client_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime


class MeetingBookRequest(BaseModel):
    # Wall-clock date/time as shown to the client, already in the coach's own
    # timezone (copied straight from AvailabilityRulesForClient.slots) — never
    # a pre-computed UTC instant, which is what used to silently double-apply
    # a timezone conversion (once via the browser's Date/setHours, once again
    # via the backend's naive .strftime on a UTC value) and made booking fail
    # or land on the wrong slot for any coach/client pair in different zones.
    date: str  # "YYYY-MM-DD"
    time: str  # "HH:MM"


class MeetingRescheduleRequest(BaseModel):
    # Coach-initiated reschedule sends an explicit instant (their own
    # datetime-local input, their own browser). Client-initiated reschedule
    # sends date+time the same coach-local wall-clock way booking does.
    # Exactly one style must be present.
    starts_at: datetime | None = None
    date: str | None = None
    time: str | None = None

    @model_validator(mode="after")
    def _one_style(self) -> "MeetingRescheduleRequest":
        has_instant = self.starts_at is not None
        has_wall_clock = self.date is not None and self.time is not None
        if has_instant == has_wall_clock:
            raise ValueError("Provide either starts_at, or both date and time")
        return self


class SchedulingLinksOut(BaseModel):
    calendly_url: str | None = None
    cal_com_url: str | None = None
    # Whichever of google/zoom the coach has connected and would actually be
    # used for a new booking (same preference order as create_video_call_link)
    # — lets the client see up front what they'll be joining, not just find
    # out after booking.
    video_provider: str | None = None


class MeetingOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    client_timezone: str | None = None
    starts_at: datetime
    ends_at: datetime
    status: MeetingStatus
    meeting_url: str | None
    meeting_provider: str | None = None
    booking_source: str = "internal"

    model_config = {"from_attributes": True}
