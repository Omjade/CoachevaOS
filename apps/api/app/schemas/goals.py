import uuid
from datetime import date, datetime

from pydantic import BaseModel


class GoalCreate(BaseModel):
    title: str
    target_date: date | None = None


class GoalUpdate(BaseModel):
    title: str | None = None
    target_date: date | None = None
    done: bool | None = None
    order: int | None = None


class GoalOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    title: str
    target_date: date | None
    done: bool
    order: int
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
