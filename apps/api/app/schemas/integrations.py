from datetime import datetime

from pydantic import BaseModel

from app.models.enums import CalendarProvider


class IntegrationStatusOut(BaseModel):
    provider: CalendarProvider
    connected: bool
    account_label: str | None = None
    connected_at: datetime | None = None


class GoogleCalendarEventOut(BaseModel):
    id: str
    summary: str
    start: datetime | None = None
    end: datetime | None = None
    # Whole-day events carry start/end as plain dates rather than dateTimes —
    # surfaced as-is (e.g. "2026-08-25") rather than forced through a
    # datetime parse that would silently misrepresent the timezone.
    all_day_date: str | None = None
    hangout_link: str | None = None
    html_link: str | None = None
