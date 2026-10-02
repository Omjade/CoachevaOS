import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
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


class AgentAction(Base, UUIDPk, TimestampMixin):
    """One row per AI-drafted action waiting on (or resolved by) a coach —
    the single queue every "Your AI Team" agent's draft output flows through
    (Drift Detector nudges today; Session Wrap recaps, Companion sends, etc.
    join later — see kind). Deliberately a separate, mutable-status table
    rather than another AIInsight row — AIInsight is an append-only log (the
    churn-score trend depends on that), but this needs a real workflow state
    (pending -> approved/skipped) a coach actively moves through in the
    unified Approvals inbox. Started life as "RetentionNudge," generalized
    once a second agent (Session Wrap) needed the same approval workflow."""

    __tablename__ = "agent_actions"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    # "retention_nudge" | "session_recap" | "companion_send" | ... — the
    # Approvals/Activity UI branches on this to know how to render the card
    # and what "approve" actually does with it.
    kind: Mapped[str] = mapped_column(String(32))
    draft_message: Mapped[str] = mapped_column(Text)
    # Kind-specific extra data (e.g. session_recap's commitments-with-due-dates
    # list) that doesn't fit the plain draft_message string — optional, most
    # kinds (retention_nudge) don't need it.
    payload_json: Mapped[dict | None] = mapped_column(JSONB)
    # "pending" | "approved" | "skipped" — "approved" covers both as-drafted
    # and coach-edited sends (the edited text, if any, overwrites
    # draft_message at approval time rather than needing a second column).
    status: Mapped[str] = mapped_column(String(16), default="pending")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


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
