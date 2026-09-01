import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class Program(Base, UUIDPk, TimestampMixin):
    """Deliberately generic — not fitness-specific. `niche` records the coach's
    practice type at creation time so the same table serves every kind of coach.

    Doubles as both a real per-client program (client_id set, is_template=False)
    and a reusable coach-level template (client_id=None, is_template=True) —
    `is_template` is a real, explicit flag rather than inferring "template"
    from a null client_id, since that ambiguity was never actually load-bearing
    anywhere in the code before this."""

    __tablename__ = "programs"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    niche: Mapped[str | None] = mapped_column(String(64))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    # Only a client-selectable template is offered for client self-selection
    # (Phase 43) — a coach can have private templates they only assign
    # themselves.
    client_selectable: Mapped[bool] = mapped_column(Boolean, default=False)
    duration_weeks: Mapped[int | None] = mapped_column(Integer)
    # Real client programs only (never set on a template) — combined with
    # duration_weeks, lets the coach/client see an actual computed end date
    # instead of just a relative "N-week program" label. Set automatically
    # when a template is assigned, editable afterward.
    started_at: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    # Informational only — no scheduling engine exists. e.g. "Weekly".
    checkin_cadence: Mapped[str | None] = mapped_column(String(64))
    # Informational only — no payment is ever created from these. Reference
    # for the coach/client to see "what this package is worth", nothing more.
    price_amount: Mapped[float | None] = mapped_column(Numeric(10, 2))
    price_currency: Mapped[str | None] = mapped_column(String(3))
    billing_cadence: Mapped[str | None] = mapped_column(String(16))
    # Set on a real client program that was created by assigning a template —
    # SET NULL on template delete so removing a template never blocks or
    # cascades into a client's already-assigned program.
    assigned_from_template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL")
    )


class ProgramItem(Base, UUIDPk):
    __tablename__ = "program_items"

    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programs.id"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    target_metric: Mapped[str | None] = mapped_column(String(255))

    # Which week of the program this item belongs to — powers 4/8/12-week
    # grouping. Optional: a plain flat program can leave this unset.
    week_number: Mapped[int | None] = mapped_column(Integer)
    # "milestone" (default, purely descriptive — today's existing behavior,
    # zero change for every program that already exists) / "task" / "goal" /
    # "form" — the last two actually create/share a real Task/ClientGoal/Form
    # when a template with this item is assigned to a client.
    item_kind: Mapped[str] = mapped_column(String(16), default="milestone")
    linked_form_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="SET NULL")
    )
