import uuid
from datetime import date as date_type, datetime, time, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.ai import AIInsight
from app.models.billing import Invoice
from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.documents import Document
from app.models.enums import AIInsightType
from app.models.goals import ClientGoal
from app.models.metrics import MetricDefinition, MetricEntry
from app.models.progress import ProgressEntry
from app.models.sessions import SessionNote
from app.models.tasks import Task
from app.models.users import User
from app.routers.clients import _get_owned_client
from app.schemas.timeline import TimelineEvent, TimelineOut

router = APIRouter(tags=["timeline"])

# A jump of this many points between two consecutive nightly churn scores is
# treated as a real, timeline-worthy "engagement drop" — small day-to-day
# noise in the deterministic score shouldn't spam the client's timeline.
RISK_JUMP_THRESHOLD = 15


def _as_datetime(d: date_type) -> datetime:
    return datetime.combine(d, time.min, tzinfo=timezone.utc)


async def _collect_events(db: AsyncSession, client_id: uuid.UUID, cap: int) -> list[TimelineEvent]:
    """Read-time aggregation only, no new table — merges the client's already-
    existing records into one feed. Each source is capped independently before
    the merge-sort, which is an acceptable tradeoff for a browsable timeline
    rather than an exhaustive audit log."""
    events: list[TimelineEvent] = []

    goals_result = await db.execute(
        select(ClientGoal).where(ClientGoal.client_id == client_id).order_by(ClientGoal.created_at.desc()).limit(cap)
    )
    for g in goals_result.scalars().all():
        events.append(
            TimelineEvent(
                type="goal", date=g.created_at, title=g.title, summary="Marked done" if g.done else "Goal added"
            )
        )

    tasks_result = await db.execute(
        select(Task).where(Task.client_id == client_id).order_by(Task.created_at.desc()).limit(cap)
    )
    for t in tasks_result.scalars().all():
        events.append(
            TimelineEvent(
                type="task", date=t.created_at, title=t.title, summary="Done" if t.done else "Task added"
            )
        )

    progress_result = await db.execute(
        select(ProgressEntry)
        .where(ProgressEntry.client_id == client_id)
        .order_by(ProgressEntry.created_at.desc())
        .limit(cap)
    )
    for p in progress_result.scalars().all():
        events.append(
            TimelineEvent(type="progress", date=_as_datetime(p.entry_date), title="Progress entry", summary=p.note)
        )

    checkins_result = await db.execute(
        select(Checkin).where(Checkin.client_id == client_id).order_by(Checkin.submitted_at.desc()).limit(cap)
    )
    for c in checkins_result.scalars().all():
        events.append(
            TimelineEvent(
                type="checkin",
                date=c.submitted_at,
                title=f"{c.type.value.capitalize()} check-in",
                summary=c.one_liner or c.progress_notes,
            )
        )

    sessions_result = await db.execute(
        select(SessionNote)
        .where(SessionNote.client_id == client_id)
        .order_by(SessionNote.session_date.desc())
        .limit(cap)
    )
    for s in sessions_result.scalars().all():
        events.append(
            TimelineEvent(
                type="session",
                date=_as_datetime(s.session_date),
                title="Session note",
                summary=s.discussion_notes,
            )
        )

    documents_result = await db.execute(
        select(Document).where(Document.client_id == client_id).order_by(Document.created_at.desc()).limit(cap)
    )
    for d in documents_result.scalars().all():
        events.append(TimelineEvent(type="document", date=d.created_at, title=d.name, summary=None))

    metrics_result = await db.execute(
        select(MetricEntry, MetricDefinition.name, MetricDefinition.unit)
        .join(MetricDefinition, MetricDefinition.id == MetricEntry.definition_id)
        .where(MetricEntry.client_id == client_id)
        .order_by(MetricEntry.recorded_at.desc())
        .limit(cap)
    )
    for entry, name, unit in metrics_result.all():
        summary = f"{entry.value} {unit}".strip() if unit else str(entry.value)
        events.append(TimelineEvent(type="metric", date=_as_datetime(entry.recorded_at), title=name, summary=summary))

    invoices_result = await db.execute(
        select(Invoice)
        .where(Invoice.client_id == client_id, Invoice.paid.is_(True), Invoice.paid_at.is_not(None))
        .order_by(Invoice.paid_at.desc())
        .limit(cap)
    )
    for inv in invoices_result.scalars().all():
        events.append(
            TimelineEvent(
                type="payment", date=inv.paid_at, title="Payment received", summary=f"${inv.amount:.2f}"
            )
        )

    # "AI detected engagement drop" — not a raw table read like the other
    # event types above: derived by diffing consecutive nightly churn scores
    # (apps/api/app/scheduler.py::generate_nightly_churn_scores) and
    # synthesizing an event only when the jump crosses RISK_JUMP_THRESHOLD.
    churn_result = await db.execute(
        select(AIInsight)
        .where(AIInsight.client_id == client_id, AIInsight.type == AIInsightType.churn_score)
        .order_by(AIInsight.created_at.desc())
        .limit(30)
    )
    churn_insights = list(churn_result.scalars().all())
    risk_events: list[TimelineEvent] = []
    for newer, older in zip(churn_insights, churn_insights[1:]):
        new_score = newer.payload_json.get("score", 0)
        old_score = older.payload_json.get("score", 0)
        if new_score - old_score >= RISK_JUMP_THRESHOLD:
            risk_events.append(
                TimelineEvent(
                    type="risk",
                    date=newer.created_at,
                    title="AI detected engagement drop",
                    summary=f"Churn risk jumped from {old_score} to {new_score}",
                )
            )
    events.extend(risk_events[: min(cap, 10)])

    events.sort(key=lambda e: e.date, reverse=True)
    return events


# NOTE: /clients/me/timeline must be declared before /clients/{client_id}/timeline —
# same route-ordering reason documented in goals.py.


@router.get("/clients/me/timeline", response_model=TimelineOut)
async def get_my_timeline(
    limit: int = 50,
    offset: int = 0,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> TimelineOut:
    events = await _collect_events(db, client.id, cap=limit + offset)
    return TimelineOut(events=events[offset : offset + limit])


@router.get("/clients/{client_id}/timeline", response_model=TimelineOut)
async def get_client_timeline(
    client_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> TimelineOut:
    await _get_owned_client(db, coach, client_id)
    events = await _collect_events(db, client_id, cap=limit + offset)
    return TimelineOut(events=events[offset : offset + limit])
