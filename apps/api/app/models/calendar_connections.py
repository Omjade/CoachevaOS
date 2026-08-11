import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import CalendarProvider
from app.models.mixins import TimestampMixin, UUIDPk


class CalendarConnection(Base, UUIDPk, TimestampMixin):
    __tablename__ = "calendar_connections"
    __table_args__ = (
        UniqueConstraint("coach_id", "provider", name="uq_calendar_connections_coach_provider"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    provider: Mapped[CalendarProvider] = mapped_column(Enum(CalendarProvider, name="calendar_provider"))
    access_token: Mapped[str] = mapped_column(Text)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    account_label: Mapped[str | None] = mapped_column(String(255))
    extra_json: Mapped[dict] = mapped_column(JSONB, default=dict)
