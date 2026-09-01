import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import BillingCycle, PaymentProvider, SubscriptionStatus, SubscriptionTier
from app.models.mixins import TimestampMixin, UUIDPk


class Invoice(Base, UUIDPk, TimestampMixin):
    """Coach <-> their own client billing tracker. No payment processor — manual entry only."""

    __tablename__ = "invoices"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    # Defaults to the client's own billing_currency at creation time (see
    # billing.py's create_invoice) — stored per-invoice rather than only
    # derived from the client so a currency change later never rewrites the
    # meaning of an already-issued invoice.
    currency: Mapped[str] = mapped_column(String(3), default="USD", server_default="USD")
    due_date: Mapped[date] = mapped_column(Date)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


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

    # Payment provider fields — unset until the coach's first checkout.
    provider: Mapped[PaymentProvider | None] = mapped_column(Enum(PaymentProvider, name="payment_provider"))
    currency: Mapped[str | None] = mapped_column(String(3))
    billing_cycle: Mapped[BillingCycle | None] = mapped_column(Enum(BillingCycle, name="billing_cycle"))
    processor_customer_id: Mapped[str | None] = mapped_column(String(128))
    processor_subscription_id: Mapped[str | None] = mapped_column(String(128), index=True)
    processor_price_id: Mapped[str | None] = mapped_column(String(128))
    payment_method_label: Mapped[str | None] = mapped_column(String(64))
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    grace_period_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Tracks the highest 1/3/6/9/12-day trial-reminder threshold already
    # notified, so the nightly reminder pass never double-sends for the same
    # threshold (see scheduler.py's send_subscription_reminders).
    last_reminder_day_sent: Mapped[int | None] = mapped_column(Integer)


class PaymentWebhookEvent(Base, UUIDPk, TimestampMixin):
    """Idempotency log for Paddle/Razorpay webhook deliveries — both providers retry
    on failure, so every handler dedupes on (provider, event_id) before doing anything
    else. payload_json keeps the full raw event for replay/debugging."""

    __tablename__ = "payment_webhook_events"
    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_webhook_event_provider_id"),)

    provider: Mapped[PaymentProvider] = mapped_column(Enum(PaymentProvider, name="payment_provider"))
    event_id: Mapped[str] = mapped_column(String(191))
    event_type: Mapped[str] = mapped_column(String(64))
    coach_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSONB)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RegionSignalLog(Base, UUIDPk, TimestampMixin):
    """Append-only observability trail for region/currency signal reconciliation
    (see app/payments/region.py) — never read at request time to make a
    decision, only written, so it can't become a new source of latency or a
    new bug surface in the payment hot path. Lets a mismatch pattern (e.g. a
    coach repeatedly selecting a region that disagrees with every other
    signal) be reviewed after the fact without pretending to be real-time
    fraud detection."""

    __tablename__ = "region_signal_logs"

    coach_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    context: Mapped[str] = mapped_column(String(32))
    declared_country_code: Mapped[str | None] = mapped_column(String(2))
    ip_country_code: Mapped[str | None] = mapped_column(String(2))
    mismatch: Mapped[bool] = mapped_column(Boolean, default=False)
