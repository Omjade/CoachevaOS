import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_coach
from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.enums import ClientStatus, LeadStage
from app.models.leads import Lead
from app.models.tasks import Task
from app.models.users import User
from app.schemas.analytics import (
    AnalyticsSummary,
    AnalyticsTimeseries,
    CheckinWeekPoint,
    FunnelPoint,
    WeekPoint,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

WEEKS_BACK = 12
CACHE_TTL_SECONDS = 60

# In-process TTL cache — analytics were recomputed from scratch on every request;
# a coach's dashboard reloading/tab-switching repeatedly doesn't need fresh
# aggregates every time. No Redis needed at this scale (consistent with the
# rate limiter and AI-insight cache, both also in-process/DB-backed, not Redis).
_cache: dict[tuple[str, uuid.UUID], tuple[datetime, Any]] = {}


def _cache_get(key: tuple[str, uuid.UUID]) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if datetime.now(timezone.utc) >= expires_at:
        del _cache[key]
        return None
    return value


def _cache_set(key: tuple[str, uuid.UUID], value: Any) -> None:
    _cache[key] = (datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS), value)


def _week_start(dt: datetime) -> datetime:
    d = dt.astimezone(timezone.utc)
    return (d - timedelta(days=d.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)


def _week_buckets(weeks: int = WEEKS_BACK) -> list[datetime]:
    current = _week_start(datetime.now(timezone.utc))
    return [current - timedelta(weeks=i) for i in range(weeks - 1, -1, -1)]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> AnalyticsSummary:
    cache_key = ("summary", coach.id)
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    clients_result = await db.execute(select(Client.status).where(Client.coach_id == coach.id))
    statuses = [row[0] for row in clients_result.all()]

    leads_result = await db.execute(select(Lead.stage).where(Lead.coach_id == coach.id))
    lead_stages = [row[0] for row in leads_result.all()]
    leads_total = len(lead_stages)
    leads_converted = sum(1 for s in lead_stages if s == LeadStage.converted)
    leads_lost = sum(1 for s in lead_stages if s == LeadStage.lost)

    tasks_result = await db.execute(
        select(Task.done)
        .join(Client, Client.id == Task.client_id)
        .where(Client.coach_id == coach.id, Client.status != ClientStatus.deleted)
    )
    task_done_flags = [row[0] for row in tasks_result.all()]
    tasks_total = len(task_done_flags)
    tasks_done = sum(1 for d in task_done_flags if d)

    summary = AnalyticsSummary(
        active_clients=sum(1 for s in statuses if s == ClientStatus.active),
        at_risk_clients=sum(1 for s in statuses if s == ClientStatus.at_risk),
        paused_clients=sum(1 for s in statuses if s == ClientStatus.paused),
        churned_clients=sum(1 for s in statuses if s == ClientStatus.churned),
        lead_conversion_rate=round(leads_converted / leads_total, 3) if leads_total else 0.0,
        task_completion_rate=round(tasks_done / tasks_total, 3) if tasks_total else 0.0,
        leads_total=leads_total,
        leads_converted=leads_converted,
        leads_lost=leads_lost,
        tasks_total=tasks_total,
        tasks_done=tasks_done,
    )
    _cache_set(cache_key, summary)
    return summary


@router.get("/timeseries", response_model=AnalyticsTimeseries)
async def get_analytics_timeseries(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> AnalyticsTimeseries:
    cache_key = ("timeseries", coach.id)
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    buckets = _week_buckets()

    joined_result = await db.execute(select(Client.joined_at).where(Client.coach_id == coach.id))
    joined_dates = [row[0] for row in joined_result.all() if row[0] is not None]

    client_growth: list[WeekPoint] = []
    running_total = sum(1 for d in joined_dates if d < buckets[0])
    for i, week in enumerate(buckets):
        next_week = week + timedelta(weeks=1)
        running_total += sum(1 for d in joined_dates if week <= d.astimezone(timezone.utc) < next_week)
        client_growth.append(WeekPoint(week=week.strftime("%Y-%m-%d"), count=running_total))

    leads_result = await db.execute(select(Lead.stage).where(Lead.coach_id == coach.id))
    lead_stages = [row[0] for row in leads_result.all()]
    stage_order = [LeadStage.new, LeadStage.contacted, LeadStage.follow_up, LeadStage.booked, LeadStage.converted]
    lead_funnel = [
        FunnelPoint(stage=stage.value, count=sum(1 for s in lead_stages if s == stage))
        for stage in stage_order
    ]

    active_clients_count = await db.scalar(
        select(func.count())
        .select_from(Client)
        .where(Client.coach_id == coach.id, Client.status == ClientStatus.active)
    ) or 0

    checkins_result = await db.execute(
        select(Checkin.submitted_at)
        .join(Client, Client.id == Checkin.client_id)
        .where(Client.coach_id == coach.id, Checkin.submitted_at >= buckets[0])
    )
    checkin_dates = [row[0] for row in checkins_result.all()]

    checkin_rate: list[CheckinWeekPoint] = []
    for week in buckets:
        next_week = week + timedelta(weeks=1)
        count = sum(1 for d in checkin_dates if week <= d.astimezone(timezone.utc) < next_week)
        rate = round(count / active_clients_count, 3) if active_clients_count else 0.0
        checkin_rate.append(
            CheckinWeekPoint(
                week=week.strftime("%Y-%m-%d"),
                checkins=count,
                active_clients=active_clients_count,
                rate=rate,
            )
        )

    timeseries = AnalyticsTimeseries(
        client_growth=client_growth, lead_funnel=lead_funnel, checkin_rate=checkin_rate
    )
    _cache_set(cache_key, timeseries)
    return timeseries
