import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class SessionNote(Base, UUIDPk, TimestampMixin):
    """A manually-loggable, structured session record — distinct from the
    AI-generated AIInsight(session_summary), which stays a one-off draft that
    gets turned into a follow-up message. This is real, browsable history."""

    __tablename__ = "session_notes"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    meeting_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meetings.id")
    )
    session_date: Mapped[date] = mapped_column(Date)
    objective: Mapped[str | None] = mapped_column(Text)
    discussion_notes: Mapped[str | None] = mapped_column(Text)
    key_insights: Mapped[str | None] = mapped_column(Text)
    action_items: Mapped[list | None] = mapped_column(JSONB)
    wins: Mapped[str | None] = mapped_column(Text)
    challenges: Mapped[str | None] = mapped_column(Text)
    follow_up_date: Mapped[date | None] = mapped_column(Date)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
