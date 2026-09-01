import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
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
    country_code: Mapped[str | None] = mapped_column(String(2))

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
    # The coach's own declared/confirmed billing country — separate from
    # User.country_code (a one-time registration-IP snapshot). This is the
    # value region resolution treats as authoritative once set, since it's
    # closest to what the coach will actually enter at Paddle's own checkout.
    billing_country_code: Mapped[str | None] = mapped_column(String(2))
    brand_color: Mapped[str | None] = mapped_column(String(16))
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    cal_com_url: Mapped[str | None] = mapped_column(String(1024))
    availability_rules_json: Mapped[dict | None] = mapped_column(JSONB)
    # "Know your coach" — client-visible public identity, distinct from the
    # operational fields above. bio length is capped at the Pydantic layer,
    # not here; the URL fields are validated for an http(s) prefix when set.
    bio: Mapped[str | None] = mapped_column(Text)
    website_url: Mapped[str | None] = mapped_column(String(1024))
    instagram_url: Mapped[str | None] = mapped_column(String(1024))
    linkedin_url: Mapped[str | None] = mapped_column(String(1024))
    # A small set of storage keys (reuses storage.py's existing upload
    # pattern, same as avatar_url/logo_url) shown on the public portfolio
    # page (Phase 52) — a handful of images, not a full media library.
    gallery_image_urls: Mapped[list[str] | None] = mapped_column(JSONB)

    user: Mapped["User"] = relationship(back_populates="coach_profile")
