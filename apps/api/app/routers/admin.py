import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_platform_owner
from app.models.analytics_admin import DailyPageView
from app.models.billing import PlatformSubscription
from app.models.clients import Client
from app.models.enums import ClientStatus, SubscriptionStatus, UserRole
from app.models.users import CoachProfile, User
from app.schemas.admin import (
    AdminBreakdownItem,
    AdminBreakdowns,
    AdminCoachDetail,
    AdminCoachList,
    AdminCoachRow,
    AdminDayPoint,
    AdminOverview,
    AdminTimeseries,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_platform_owner)])

DAYS_BACK_DEFAULT = 30
CACHE_TTL_SECONDS = 60

# Same in-process TTL cache idiom as analytics.py — one admin, low request
# volume, no case for Redis here either.
_cache: dict[str, tuple[datetime, Any]] = {}


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if datetime.now(timezone.utc) >= expires_at:
        del _cache[key]
        return None
    return value


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS), value)


# Mirrors apps/web/lib/pricing.ts GLOBAL_PRICING_TIERS / INDIA_PRICING_TIERS
# monthly prices — no shared source of truth across the two languages, so
# this must be kept in sync by hand if pricing changes. A coach's real
# PlatformSubscription.currency picks which table prices their row, so an
# INR-billed coach's MRR is never silently zeroed out just because it isn't
# USD (a real bug the first version of this file had). Enterprise has no
# self-serve price (manual sales), excluded from MRR either way.
_MONTHLY_PRICE: dict[str, dict[str, float]] = {
    "usd": {"starter": 22.0, "growth": 34.0, "scale": 58.0, "pro": 92.0},
    "inr": {"starter": 649.0, "growth": 999.0, "scale": 1799.0, "pro": 2699.0},
}

_PAID_STATUSES = {SubscriptionStatus.active, SubscriptionStatus.past_due}


def _tier_price(tier_value: str, currency: str = "usd") -> float:
    table = _MONTHLY_PRICE.get(currency.lower(), _MONTHLY_PRICE["usd"])
    return table.get(tier_value, 0.0)


@router.get("/overview", response_model=AdminOverview)
async def get_overview(db: AsyncSession = Depends(get_db)) -> AdminOverview:
    cached = _cache_get("overview")
    if cached is not None:
        return cached

    today = datetime.now(timezone.utc).date()
    month_start = today.replace(day=1)

    visits_row = await db.execute(
        select(func.coalesce(func.sum(DailyPageView.visit_count), 0), func.coalesce(func.sum(DailyPageView.unique_count), 0))
        .where(DailyPageView.date == today)
    )
    visits_today, unique_visits_today = visits_row.one()

    signups_today = await db.scalar(
        select(func.count()).select_from(User).where(func.date(User.created_at) == today)
    ) or 0

    subs_result = await db.execute(
        select(PlatformSubscription.tier, PlatformSubscription.status, PlatformSubscription.currency)
    )
    subs = subs_result.all()

    total_coaches = await db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.coach)) or 0
    trialing_count = sum(1 for _, status, _ in subs if status == SubscriptionStatus.trialing)
    active_paid_count = sum(1 for _, status, _ in subs if status == SubscriptionStatus.active)
    past_due_count = sum(1 for _, status, _ in subs if status == SubscriptionStatus.past_due)
    canceled_count = sum(1 for _, status, _ in subs if status == SubscriptionStatus.canceled)

    mrr = sum(
        _tier_price(tier.value, currency or "usd")
        for tier, status, currency in subs
        if status in _PAID_STATUSES and (currency or "usd").lower() == "usd"
    )
    mrr_inr = sum(
        _tier_price(tier.value, currency or "usd")
        for tier, status, currency in subs
        if status in _PAID_STATUSES and (currency or "usd").lower() == "inr"
    )

    churned_this_month = await db.scalar(
        select(func.count())
        .select_from(PlatformSubscription)
        .where(
            PlatformSubscription.status == SubscriptionStatus.canceled,
            PlatformSubscription.updated_at >= month_start,
        )
    ) or 0

    overview = AdminOverview(
        visits_today=int(visits_today),
        unique_visits_today=int(unique_visits_today),
        signups_today=signups_today,
        total_coaches=total_coaches,
        trialing_count=trialing_count,
        active_paid_count=active_paid_count,
        past_due_count=past_due_count,
        canceled_count=canceled_count,
        mrr=round(mrr, 2),
        mrr_currency="usd",
        mrr_inr=round(mrr_inr, 2),
        churned_this_month=churned_this_month,
    )
    _cache_set("overview", overview)
    return overview


@router.get("/timeseries", response_model=AdminTimeseries)
async def get_timeseries(days: int = DAYS_BACK_DEFAULT, db: AsyncSession = Depends(get_db)) -> AdminTimeseries:
    cache_key = f"timeseries:{days}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days - 1)

    pv_result = await db.execute(
        select(DailyPageView.date, DailyPageView.visit_count, DailyPageView.unique_count)
        .where(DailyPageView.date >= start)
    )
    pv_by_date: dict[date, tuple[int, int]] = {}
    for d, visits, uniques in pv_result.all():
        v, u = pv_by_date.get(d, (0, 0))
        pv_by_date[d] = (v + visits, u + uniques)

    users_result = await db.execute(
        select(User.created_at, User.role).where(func.date(User.created_at) >= start)
    )
    signups_by_date: dict[date, int] = {}
    for created_at, role in users_result.all():
        if role != UserRole.coach:
            continue
        d = created_at.astimezone(timezone.utc).date()
        signups_by_date[d] = signups_by_date.get(d, 0) + 1

    subs_result = await db.execute(
        select(PlatformSubscription.tier, PlatformSubscription.status, PlatformSubscription.currency, PlatformSubscription.updated_at)
    )
    subs = subs_result.all()

    points: list[AdminDayPoint] = []
    for i in range(days):
        d = start + timedelta(days=i)
        visits, uniques = pv_by_date.get(d, (0, 0))
        # Trialing/active-paid counts are a same-day snapshot proxy (current
        # state, not reconstructed historical state) since PlatformSubscription
        # doesn't keep a status-history log — accurate for "today", an
        # approximation further back. MRR for past days uses the same proxy.
        is_today = d == today
        trialing = sum(1 for t, s, c, u in subs if s == SubscriptionStatus.trialing) if is_today else 0
        active_paid = sum(1 for t, s, c, u in subs if s == SubscriptionStatus.active) if is_today else 0
        mrr = (
            sum(_tier_price(t.value) for t, s, c, u in subs if s in _PAID_STATUSES and (c or "usd").lower() == "usd")
            if is_today
            else 0.0
        )
        points.append(
            AdminDayPoint(
                date=d.isoformat(),
                visits=visits,
                unique_visits=uniques,
                signups=signups_by_date.get(d, 0),
                trialing=trialing,
                active_paid=active_paid,
                mrr=round(mrr, 2),
            )
        )

    timeseries = AdminTimeseries(points=points)
    _cache_set(cache_key, timeseries)
    return timeseries


@router.get("/breakdowns", response_model=AdminBreakdowns)
async def get_breakdowns(db: AsyncSession = Depends(get_db)) -> AdminBreakdowns:
    cached = _cache_get("breakdowns")
    if cached is not None:
        return cached

    result = await db.execute(
        select(User.country_code, User.timezone, CoachProfile.niche, PlatformSubscription.tier)
        .outerjoin(CoachProfile, CoachProfile.user_id == User.id)
        .outerjoin(PlatformSubscription, PlatformSubscription.coach_id == User.id)
        .where(User.role == UserRole.coach)
    )
    rows = result.all()

    def _counted(values: list[str | None]) -> list[AdminBreakdownItem]:
        counts: dict[str, int] = {}
        for v in values:
            label = v or "Unknown"
            counts[label] = counts.get(label, 0) + 1
        return sorted(
            [AdminBreakdownItem(label=k, count=v) for k, v in counts.items()],
            key=lambda x: x.count,
            reverse=True,
        )

    breakdowns = AdminBreakdowns(
        by_country=_counted([r[0] for r in rows]),
        by_timezone=_counted([r[1] for r in rows]),
        by_niche=_counted([r[2] for r in rows]),
        by_tier=_counted([r[3].value if r[3] else None for r in rows]),
    )
    _cache_set("breakdowns", breakdowns)
    return breakdowns


async def _to_coach_row(db: AsyncSession, user: User, profile: CoachProfile | None, sub: PlatformSubscription | None) -> AdminCoachRow:
    active_clients = await db.scalar(
        select(func.count()).select_from(Client).where(Client.coach_id == user.id, Client.status == ClientStatus.active)
    ) or 0
    tier = sub.tier.value if sub else "trial"
    status_val = sub.status.value if sub else "trialing"
    currency = (sub.currency if sub and sub.currency else "usd").lower()
    mrr = _tier_price(tier, currency) if sub and sub.status in _PAID_STATUSES else 0.0
    return AdminCoachRow(
        id=str(user.id),
        name=user.name,
        email=user.email,
        business_name=profile.business_name if profile else None,
        niche=profile.niche if profile else None,
        country=user.country_code,
        tier=tier,
        status=status_val,
        trial_ends_at=sub.trial_ends_at if sub else None,
        current_period_end=sub.current_period_end if sub else None,
        signed_up_at=user.created_at,
        active_client_count=active_clients,
        mrr=round(mrr, 2),
        mrr_currency=currency,
    )


@router.get("/coaches", response_model=AdminCoachList)
async def list_coaches(
    search: str | None = None,
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> AdminCoachList:
    query = (
        select(User, CoachProfile, PlatformSubscription)
        .outerjoin(CoachProfile, CoachProfile.user_id == User.id)
        .outerjoin(PlatformSubscription, PlatformSubscription.coach_id == User.id)
        .where(User.role == UserRole.coach)
        .order_by(User.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    coaches = [await _to_coach_row(db, user, profile, sub) for user, profile, sub in rows]

    if search:
        needle = search.lower()
        coaches = [
            c for c in coaches
            if needle in c.name.lower() or needle in c.email.lower() or (c.business_name and needle in c.business_name.lower())
        ]
    if status_filter:
        coaches = [c for c in coaches if c.status == status_filter]

    return AdminCoachList(coaches=coaches, total=len(coaches))


@router.get("/coaches/{coach_id}", response_model=AdminCoachDetail)
async def get_coach_detail(coach_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> AdminCoachDetail:
    user = await db.get(User, coach_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Coach not found")
    profile = await db.get(CoachProfile, coach_id)
    sub_result = await db.execute(select(PlatformSubscription).where(PlatformSubscription.coach_id == coach_id))
    sub = sub_result.scalar_one_or_none()

    row = await _to_coach_row(db, user, profile, sub)
    return AdminCoachDetail(
        coach=row,
        timezone=user.timezone,
        portal_slug=profile.portal_slug if profile else None,
        provider=sub.provider.value if sub and sub.provider else None,
        processor_customer_id=sub.processor_customer_id if sub else None,
    )
