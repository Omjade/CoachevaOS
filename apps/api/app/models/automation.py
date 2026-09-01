import uuid

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CoachAutomationSettings(Base):
    """One row per coach, like CoachAIAssistantSettings. `auto_assign_template_id`
    of None means "don't auto-assign a program" — a valid, common configuration,
    not an error state."""

    __tablename__ = "coach_automation_settings"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    auto_onboarding_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_assign_template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL")
    )
