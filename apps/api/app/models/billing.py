import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import SubscriptionStatus, SubscriptionTier
from app.models.mixins import TimestampMixin, UUIDPk


class Invoice(Base, UUIDPk, TimestampMixin):
    """Coach <-> their own client billing tracker. No payment processor — manual entry only."""

    __tablename__ = "invoices"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    due_date: Mapped[date] = mapped_column(Date)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)


class PlatformSubscription(Base, UUIDPk, TimestampMixin):
    """CoachevaOS <-> coach platform billing. Tier/status tracked manually for MVP;
    no payment provider wired yet (see docs/PRD.md)."""

    __tablename__ = "platform_subscriptions"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, index=True
    )
    tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier, name="subscription_tier"), default=SubscriptionTier.trial
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status"),
        default=SubscriptionStatus.trialing,
    )
    trial_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    client_limit: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
