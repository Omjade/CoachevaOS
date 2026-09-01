import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class CoachAIAssistantSettings(Base):
    """One row per coach, like CoachProfile. `daily_query_limit` is the coach's
    own configured cap — always clamped against a platform-side hard ceiling in
    code (see PLATFORM_QUERY_CEILING in app/routers/ai_assistant.py) so a
    misconfigured coach can't blow up API cost."""

    __tablename__ = "coach_ai_assistant_settings"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    tone: Mapped[str | None] = mapped_column(String(255))
    style_notes: Mapped[str | None] = mapped_column(Text)
    custom_instructions: Mapped[str | None] = mapped_column(Text)
    daily_query_limit: Mapped[int] = mapped_column(Integer, default=10)


class AIAssistantMessage(Base, UUIDPk, TimestampMixin):
    """Deliberately separate from Thread/Message (the real coach<->client chat) —
    keeps a coach's actual inbox from ever being polluted with bot exchanges, and
    keeps escalation/quota/audit logic isolated. The daily quota is derived
    directly from this table (count of role='user' rows today), no separate
    counter table needed."""

    __tablename__ = "ai_assistant_messages"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
