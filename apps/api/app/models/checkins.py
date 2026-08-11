import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import CheckinType
from app.models.mixins import UUIDPk


class Checkin(Base, UUIDPk):
    __tablename__ = "checkins"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    type: Mapped[CheckinType] = mapped_column(Enum(CheckinType, name="checkin_type"))
    period_key: Mapped[str] = mapped_column(String(16))  # e.g. "2026-08-01" or "2026-W31"
    mood: Mapped[str | None] = mapped_column(String(32))
    one_liner: Mapped[str | None] = mapped_column(Text)
    progress_notes: Mapped[str | None] = mapped_column(Text)
    challenges: Mapped[str | None] = mapped_column(Text)
    wins: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
