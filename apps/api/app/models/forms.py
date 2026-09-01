import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class Form(Base, UUIDPk, TimestampMixin):
    __tablename__ = "forms"
    __table_args__ = (UniqueConstraint("coach_id", "slug", name="uq_forms_coach_slug"),)

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(96), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    fields_json: Mapped[list] = mapped_column(JSONB, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_key: Mapped[str | None] = mapped_column(String(512))


class FormSubmission(Base, UUIDPk):
    __tablename__ = "form_submissions"

    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id"), index=True
    )
    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    answers_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
