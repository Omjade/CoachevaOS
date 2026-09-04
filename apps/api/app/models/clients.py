import uuid
from datetime import date, datetime

from sqlalchemy import ARRAY, Date, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ClientStatus
from app.models.mixins import UUIDPk


class Client(Base, UUIDPk):
    __tablename__ = "clients"
    # A single User (one login/email) can be a client of more than one coach
    # simultaneously (see Phase 48 — shared identity across coaches, e.g. a
    # person switching coaches or working with two at once) — user_id is no
    # longer globally unique, only unique per (user_id, coach_id) pair, so the
    # same person can't accidentally get two Client rows under the same coach.
    __table_args__ = (UniqueConstraint("user_id", "coach_id", name="uq_clients_user_id_coach_id"),)

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    goals: Mapped[str | None] = mapped_column(Text)
    program: Mapped[str | None] = mapped_column(String(255))
    # This client's own niche — nullable, falls back to the coach's own
    # CoachProfile.niche when unset (see resolve_niche()) so a coach with a
    # single practice type sees zero behavior change. Lets a coach running
    # multiple niches (e.g. fitness + nutrition) tag each client correctly
    # without making niche a multi-value field on the coach's own profile.
    niche: Mapped[str | None] = mapped_column(String(64))
    # Always accepted by ClientCreate/the CSV import mapping but was never
    # actually persisted anywhere until now — a real, confirmed data-loss bug
    # (a coach would type a phone number, submit, and it would silently
    # vanish with no column to hold it).
    phone: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[ClientStatus] = mapped_column(
        Enum(ClientStatus, name="client_status"), default=ClientStatus.active
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    subscription_valid_from: Mapped[date | None] = mapped_column(Date)
    subscription_valid_until: Mapped[date | None] = mapped_column(Date)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    notes: Mapped[str | None] = mapped_column(Text)
    # What this client is billed in (invoices, program pricing shown on their
    # pages) — distinct from the coach's own platform-subscription currency.
    # Nullable: unset means "not chosen yet," and every amount display falls
    # back to the coach's own CoachProfile.currency (see billing.py's
    # _effective_currency), not a hardcoded literal.
    billing_currency: Mapped[str | None] = mapped_column(String(3))
    # A flexible coaching-engagement window, separate from the billing-
    # subscription dates above — this is "when are we working together,"
    # editable anytime by the coach. The nightly status-sweep flips a client
    # to at_risk once coaching_end_date passes, same non-destructive pattern
    # already used for subscription expiry.
    coaching_start_date: Mapped[date | None] = mapped_column(Date)
    coaching_end_date: Mapped[date | None] = mapped_column(Date)
    # Short opaque invite code (e.g. "aB3dEfGh") replacing a self-contained
    # signed JWT as the /invite/{code} link's identifier — same 14-day expiry
    # semantics, just a DB lookup instead of a decode, and a much shorter URL
    # to share. Stable once generated; re-requesting the invite link extends
    # invite_expires_at rather than rotating the code.
    invite_code: Mapped[str | None] = mapped_column(String(16), unique=True, index=True)
    invite_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # The real "has this specific client's invite been accepted" flag — used
    # to replace the old user.password_hash-is-not-None proxy, which breaks
    # once a User can be reused across multiple Client rows (a person's first
    # coach sets their password; their second coach's invite must still work).
    invite_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # A separate, permanent (never-expiring) short code for an already-joined
    # client's personal bookmark link (/{slug}/c/{portal_code}) — distinct from
    # invite_code, which is only for the pre-signup invite and stops working
    # once a password is set. This one never rotates once generated.
    portal_code: Mapped[str | None] = mapped_column(String(16), unique=True, index=True)

    intake_response: Mapped["IntakeResponse | None"] = relationship(
        back_populates="client", uselist=False
    )


class IntakeResponse(Base, UUIDPk):
    __tablename__ = "intake_responses"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), unique=True
    )
    goals: Mapped[str | None] = mapped_column(Text)
    experience: Mapped[str | None] = mapped_column(String(64))
    availability: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    client: Mapped["Client"] = relationship(back_populates="intake_response")
