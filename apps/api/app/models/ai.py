import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import AIInsightType
from app.models.mixins import TimestampMixin, UUIDPk


class AIInsight(Base, UUIDPk, TimestampMixin):
    __tablename__ = "ai_insights"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    type: Mapped[AIInsightType] = mapped_column(Enum(AIInsightType, name="ai_insight_type"))
    payload_json: Mapped[dict] = mapped_column(JSONB)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AIUsageLog(Base, UUIDPk, TimestampMixin):
    """Cost/usage trail — one row per real OpenAI call (never on cache hits or the
    no-key placeholder path). Also the source of truth for per-coach daily quota
    checks in app/ai/limits.py."""

    __tablename__ = "ai_usage_logs"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    feature: Mapped[str] = mapped_column(String(64))
    tokens_used: Mapped[int] = mapped_column(Integer)
