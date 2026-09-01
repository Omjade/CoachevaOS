from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.enums import MeetingStatus
from app.models.meetings import Meeting
from app.models.messaging import Thread
from app.models.tasks import Task
from app.utils.time import utcnow


async def compute_churn_score(db: AsyncSession, client: Client) -> int:
    """Deterministic 0-100 churn-risk score from signals already tracked elsewhere
    in the app — no LLM call for the score itself, so it's free, instant, and
    reproducible (a trend needs a stable, comparable number night over night, not
    something an LLM might phrase slightly differently each time). Higher = more
    at risk. Called nightly per client; history across nights is what makes this a
    trend rather than the single daily snapshot the old risk-flag endpoint gave."""
    now = utcnow()
    score = 0

    thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
    thread = thread_result.scalar_one_or_none()
    if thread and thread.last_message_at:
        days_quiet = (now - thread.last_message_at).days
        score += min(35, max(0, days_quiet - 2) * 3)
    else:
        score += 15

    tasks_result = await db.execute(select(Task.done).where(Task.client_id == client.id))
    task_flags = [row[0] for row in tasks_result.all()]
    if task_flags:
        completion = sum(1 for d in task_flags if d) / len(task_flags)
        score += round((1 - completion) * 25)

    recent_checkins = await db.scalar(
        select(func.count())
        .select_from(Checkin)
        .where(Checkin.client_id == client.id, Checkin.submitted_at >= now - timedelta(days=14))
    )
    if (recent_checkins or 0) == 0 and (now - client.joined_at).days >= 14:
        score += 20

    meetings_result = await db.execute(
        select(Meeting.status)
        .where(Meeting.client_id == client.id)
        .order_by(Meeting.starts_at.desc())
        .limit(5)
    )
    recent_statuses = [row[0] for row in meetings_result.all()]
    if recent_statuses:
        canceled = sum(1 for s in recent_statuses if s == MeetingStatus.canceled)
        score += round((canceled / len(recent_statuses)) * 20)

    return min(100, score)
