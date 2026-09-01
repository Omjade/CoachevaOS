from datetime import datetime

from pydantic import BaseModel


class TimelineEvent(BaseModel):
    type: str
    date: datetime
    title: str
    summary: str | None = None


class TimelineOut(BaseModel):
    events: list[TimelineEvent]
