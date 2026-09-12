import uuid
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import TaskPriority, TodoCreatedVia
from app.models.mixins import TimestampMixin, UUIDPk


class Todo(Base, UUIDPk, TimestampMixin):
    """The coach's own personal daily to-do list — distinct from `Task`
    (per-client tasks assigned to/tracked with a client). No client_id here;
    this is the coach's own dashboard checklist for a given day."""

    __tablename__ = "todos"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    date: Mapped[date] = mapped_column(Date, index=True)
    text: Mapped[str] = mapped_column(String(500))
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[TaskPriority | None] = mapped_column(Enum(TaskPriority, name="task_priority"))
    time: Mapped[time | None] = mapped_column(Time)
    created_via: Mapped[TodoCreatedVia] = mapped_column(
        Enum(TodoCreatedVia, name="todo_created_via"), default=TodoCreatedVia.manual
    )
    # Set when this row was copied forward from an earlier incomplete todo
    # (the "carry forward incomplete tasks" setting) — points at the
    # original date, not a foreign key to the source row, since the source
    # stays untouched (this is a copy, not a move).
    carried_forward_from: Mapped[date | None] = mapped_column(Date)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
