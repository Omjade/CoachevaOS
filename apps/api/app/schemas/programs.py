import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ProgramItemCreate(BaseModel):
    title: str
    description: str | None = None
    target_metric: str | None = None
    week_number: int | None = None
    item_kind: str = "milestone"
    linked_form_id: uuid.UUID | None = None


class ProgramCreate(BaseModel):
    title: str
    items: list[ProgramItemCreate]


class ProgramItemOut(BaseModel):
    id: uuid.UUID
    order: int
    title: str
    description: str | None
    target_metric: str | None
    week_number: int | None = None
    item_kind: str = "milestone"
    linked_form_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class ProgramOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID | None
    title: str
    niche: str | None
    created_at: datetime
    items: list[ProgramItemOut]

    # Client-facing display fields, populated whenever the source program
    # carries them (real per-client programs assigned from a template inherit
    # these; hand-built ones may leave them unset) — kept on the same
    # ProgramOut rather than a template-only schema so both the coach's
    # client-detail view and the client's own pages render consistent info
    # everywhere a program is rendered, not just on the templates workspace.
    assigned_from_template_id: uuid.UUID | None = None
    duration_weeks: int | None = None
    started_at: date | None = None
    description: str | None = None
    checkin_cadence: str | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    billing_cadence: str | None = None

    model_config = {"from_attributes": True}


class ProgramDatesUpdate(BaseModel):
    started_at: date | None = None
    duration_weeks: int | None = None


class ProgramTemplateCreate(BaseModel):
    title: str
    niche: str | None = None
    duration_weeks: int | None = None
    description: str | None = None
    checkin_cadence: str | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    billing_cadence: str | None = None
    client_selectable: bool = False
    items: list[ProgramItemCreate] = []


class ProgramTemplateUpdate(BaseModel):
    title: str | None = None
    niche: str | None = None
    duration_weeks: int | None = None
    description: str | None = None
    checkin_cadence: str | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    billing_cadence: str | None = None
    client_selectable: bool | None = None
    items: list[ProgramItemCreate] | None = None


class ProgramTemplateOut(BaseModel):
    id: uuid.UUID
    title: str
    niche: str | None
    duration_weeks: int | None
    description: str | None
    checkin_cadence: str | None
    price_amount: float | None
    price_currency: str | None
    billing_cadence: str | None
    client_selectable: bool
    created_at: datetime
    items: list[ProgramItemOut]
    assigned_count: int = 0

    model_config = {"from_attributes": True}


