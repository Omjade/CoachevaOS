import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import LeadStage
from app.models.mixins import TimestampMixin, UUIDPk


class Lead(Base, UUIDPk, TimestampMixin):
    __tablename__ = "leads"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(32))
    email: Mapped[str | None] = mapped_column(String(255))
    interested_in: Mapped[str | None] = mapped_column(String(255))
    stage: Mapped[LeadStage] = mapped_column(
        Enum(LeadStage, name="lead_stage"), default=LeadStage.new
    )
    notes: Mapped[str | None] = mapped_column(Text)
    last_contacted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String(32), default="manual")
    form_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("form_submissions.id"), index=True
    )
    # Set when this lead is converted to a client; lets a mistaken conversion
    # be undone (see POST /leads/{id}/restore) without losing the link.
    converted_client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id")
    )
