import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import TaskPriority, UserRole


class TaskCreate(BaseModel):
    title: str
    due_date: date | None = None
    priority: TaskPriority = TaskPriority.medium


class TaskUpdate(BaseModel):
    title: str | None = None
    due_date: date | None = None
    priority: TaskPriority | None = None


class TaskOut(BaseModel):
    id: uuid.UUID
    title: str
    due_date: date | None
    done: bool
    priority: TaskPriority
    is_recurring: bool
    added_by_user_id: uuid.UUID
    added_by_name: str
    added_by_role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}
