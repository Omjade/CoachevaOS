from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class LandingInterest(Base, UUIDPk, TimestampMixin):
    """Anonymous, pre-signup lead capture from the public landing page's
    'Start your workspace' form — deliberately not tied to a User/coach
    account, unlike Lead which belongs to an existing coach's own pipeline."""

    __tablename__ = "landing_interests"

    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True)
    niche: Mapped[str | None] = mapped_column(String(64))
    note: Mapped[str | None] = mapped_column(Text)
