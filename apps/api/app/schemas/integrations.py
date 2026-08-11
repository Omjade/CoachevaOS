from datetime import datetime

from pydantic import BaseModel

from app.models.enums import CalendarProvider


class IntegrationStatusOut(BaseModel):
    provider: CalendarProvider
    connected: bool
    account_label: str | None = None
    connected_at: datetime | None = None
