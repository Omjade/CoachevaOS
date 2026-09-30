from datetime import datetime

from pydantic import BaseModel


class AdminOverview(BaseModel):
    visits_today: int
    unique_visits_today: int
    signups_today: int
    total_coaches: int
    trialing_count: int
    active_paid_count: int
    past_due_count: int
    canceled_count: int
    mrr: float
    mrr_currency: str
    # INR-billed MRR is real revenue that can't be added to the USD figure
    # above without an FX conversion this app doesn't do anywhere else —
    # shown as its own total rather than silently dropped or force-converted.
    mrr_inr: float = 0.0
    churned_this_month: int


class AdminDayPoint(BaseModel):
    date: str
    visits: int
    unique_visits: int
    signups: int
    trialing: int
    active_paid: int
    mrr: float


class AdminTimeseries(BaseModel):
    points: list[AdminDayPoint]


class AdminBreakdownItem(BaseModel):
    label: str
    count: int


class AdminBreakdowns(BaseModel):
    by_country: list[AdminBreakdownItem]
    by_timezone: list[AdminBreakdownItem]
    by_niche: list[AdminBreakdownItem]
    by_tier: list[AdminBreakdownItem]


class AdminCoachRow(BaseModel):
    id: str
    name: str
    email: str
    business_name: str | None
    niche: str | None
    country: str | None
    tier: str
    status: str
    trial_ends_at: datetime | None
    current_period_end: datetime | None
    signed_up_at: datetime
    active_client_count: int
    mrr: float
    mrr_currency: str


class AdminCoachList(BaseModel):
    coaches: list[AdminCoachRow]
    total: int


class AdminCoachDetail(BaseModel):
    coach: AdminCoachRow
    timezone: str
    portal_slug: str | None
    provider: str | None
    processor_customer_id: str | None
