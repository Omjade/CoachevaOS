import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import UserRole
from app.models.mixins import TimestampMixin, UUIDPk


class User(Base, UUIDPk, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"))
    name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(1024))
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mfa_secret: Mapped[str | None] = mapped_column(String(64))
    mfa_enabled: Mapped[bool] = mapped_column(default=False)
    mfa_backup_codes: Mapped[list[str] | None] = mapped_column(JSONB)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    coach_profile: Mapped["CoachProfile | None"] = relationship(
        back_populates="user", uselist=False
    )


class CoachProfile(Base):
    __tablename__ = "coach_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    portal_slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    business_name: Mapped[str | None] = mapped_column(String(255))
    niche: Mapped[str | None] = mapped_column(String(64))
    brand_color: Mapped[str | None] = mapped_column(String(16))
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    cal_com_url: Mapped[str | None] = mapped_column(String(1024))
    availability_rules_json: Mapped[dict | None] = mapped_column(JSONB)

    user: Mapped["User"] = relationship(back_populates="coach_profile")
