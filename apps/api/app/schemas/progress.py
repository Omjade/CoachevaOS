import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ProgressEntryOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    created_by: uuid.UUID
    created_by_name: str
    note: str | None
    media_type: str | None
    entry_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
