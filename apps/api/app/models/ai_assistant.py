import uuid
from datetime import time as time_type

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class CoachAIAssistantSettings(Base):
    """One row per coach, like CoachProfile. `daily_query_limit` is the coach's
    own configured cap — always clamped against a platform-side hard ceiling in
    code (see PLATFORM_QUERY_CEILING in app/routers/ai_assistant.py) so a
    misconfigured coach can't blow up API cost.

    Doubles as "Your Voice & Rules" (the shared config every agent in Your AI
    Team reads — Briefing, Client Agent, Companion) rather than a fourth
    settings table, matching this app's existing one-row-per-coach pattern."""

    __tablename__ = "coach_ai_assistant_settings"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    tone: Mapped[str | None] = mapped_column(String(255))
    style_notes: Mapped[str | None] = mapped_column(Text)
    custom_instructions: Mapped[str | None] = mapped_column(Text)
    daily_query_limit: Mapped[int] = mapped_column(Integer, default=10)

    # --- Your Voice & Rules (shared across all three agents) ---
    languages: Mapped[str | None] = mapped_column(String(255))
    sample_messages: Mapped[list[str] | None] = mapped_column(JSONB)
    sign_off: Mapped[str | None] = mapped_column(String(100))
    say_phrases: Mapped[list[str] | None] = mapped_column(JSONB)
    never_say_phrases: Mapped[list[str] | None] = mapped_column(JSONB)
    # [{"key": "mood", "label": "...", ...}] — coach-editable check-in
    # question set, consumed by the client-side check-in form.
    checkin_questions_json: Mapped[list[dict] | None] = mapped_column(JSONB)
    quiet_hours_start: Mapped[time_type | None] = mapped_column(Time)
    quiet_hours_end: Mapped[time_type | None] = mapped_column(Time)
    # One switch stops every agent's proactive/automatic action at once —
    # read-only features (e.g. on-demand "ask about a client") still work.
    agents_paused: Mapped[bool] = mapped_column(Boolean, default=False)
    # "suggest" | "ask_first" | "run_alone" per agent. Client-facing agents
    # default to "ask_first" per the product decision that nothing AI-authored
    # reaches a real client unsupervised in phase 1.
    briefing_freedom: Mapped[str] = mapped_column(String(16), default="run_alone")
    client_agent_freedom: Mapped[str] = mapped_column(String(16), default="ask_first")
    companion_freedom: Mapped[str] = mapped_column(String(16), default="ask_first")
    # "gentle" | "normal" | "strict" — scales the Drift Detector's churn-score
    # threshold (app/scheduler.py CHURN_AT_RISK_THRESHOLD) per coach instead
    # of one hardcoded value for everyone.
    drift_sensitivity: Mapped[str] = mapped_column(String(16), default="normal")


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
