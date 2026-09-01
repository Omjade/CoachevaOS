import json
import uuid
from datetime import timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AIInsight
from app.models.checkins import Checkin
from app.models.clients import Client, IntakeResponse
from app.models.enums import AIInsightType, LeadStage, MeetingStatus
from app.models.goals import ClientGoal
from app.models.leads import Lead
from app.models.meetings import Meeting
from app.models.messaging import Message, Thread
from app.models.metrics import MetricDefinition, MetricEntry
from app.models.sessions import SessionNote
from app.models.tasks import Task
from app.models.users import User
from app.utils.time import utcnow


async def build_briefing_context(db: AsyncSession, coach_id: uuid.UUID) -> str:
    now = utcnow()
    today_end = now.replace(hour=23, minute=59, second=59)

    # Same fix as build_prep_my_day_context below: format in the coach's own
    # timezone, not raw UTC, since this string goes straight into the
    # briefing bullet text a coach reads first thing in the morning.
    coach = await db.get(User, coach_id)
    try:
        coach_tz = ZoneInfo(coach.timezone) if coach and coach.timezone else timezone.utc
    except ZoneInfoNotFoundError:
        coach_tz = timezone.utc

    meetings_result = await db.execute(
        select(Meeting, User)
        .join(Client, Client.id == Meeting.client_id)
        .join(User, User.id == Client.user_id)
        .where(
            Meeting.coach_id == coach_id,
            Meeting.starts_at >= now.replace(hour=0, minute=0, second=0),
            Meeting.starts_at <= today_end,
            Meeting.status == MeetingStatus.scheduled,
        )
    )
    todays_meetings = [
        {"client": u.name, "time": m.starts_at.astimezone(coach_tz).strftime("%H:%M")}
        for m, u in meetings_result.all()
    ]

    threads_result = await db.execute(
        select(Thread, Client, User)
        .join(Client, Client.id == Thread.client_id)
        .join(User, User.id == Client.user_id)
        .where(Thread.coach_id == coach_id)
    )
    thread_rows = threads_result.all()
    quiet_candidates = [
        (thread, user)
        for thread, _client, user in thread_rows
        if thread.last_message_at and (now - thread.last_message_at) >= timedelta(days=5)
    ]
    quiet_clients = []
    if quiet_candidates:
        quiet_thread_ids = [thread.id for thread, _user in quiet_candidates]
        last_msgs_result = await db.execute(
            select(Message.thread_id, Message.sender_id)
            .where(Message.thread_id.in_(quiet_thread_ids))
            .order_by(Message.thread_id, Message.created_at.desc())
            .distinct(Message.thread_id)
        )
        last_sender_by_thread = dict(last_msgs_result.all())
        for thread, user in quiet_candidates:
            if last_sender_by_thread.get(thread.id) == user.id:
                days_quiet = (now - thread.last_message_at).days
                quiet_clients.append({"client": user.name, "days_since_reply": days_quiet})

    clients_result = await db.execute(
        select(Client, User).join(User, User.id == Client.user_id).where(Client.coach_id == coach_id)
    )
    all_clients = clients_result.all()

    expiring_soon = [
        {"client": u.name, "valid_until": c.subscription_valid_until.isoformat()}
        for c, u in all_clients
        if c.subscription_valid_until
        and 0 <= (c.subscription_valid_until - now.date()).days <= 3
    ]

    leads_result = await db.execute(
        select(Lead).where(
            Lead.coach_id == coach_id,
            Lead.stage.in_([LeadStage.new, LeadStage.contacted, LeadStage.follow_up]),
        )
    )
    waiting_leads = [
        {"name": lead.name, "stage": lead.stage.value} for lead in leads_result.scalars().all()
    ]

    completed_all_tasks = []
    if all_clients:
        client_ids = [client.id for client, _user in all_clients]
        all_tasks_result = await db.execute(select(Task).where(Task.client_id.in_(client_ids)))
        tasks_by_client: dict[uuid.UUID, list[Task]] = {}
        for task in all_tasks_result.scalars().all():
            tasks_by_client.setdefault(task.client_id, []).append(task)
        for client, user in all_clients:
            client_tasks = tasks_by_client.get(client.id, [])
            if client_tasks and all(t.done for t in client_tasks):
                completed_all_tasks.append({"client": user.name})

    return json.dumps(
        {
            "todays_meetings": todays_meetings,
            "quiet_clients_5plus_days": quiet_clients,
            "subscriptions_expiring_soon": expiring_soon,
            "leads_awaiting_followup": waiting_leads,
            "clients_completed_all_tasks": completed_all_tasks,
        }
    )


async def build_client_risk_context(db: AsyncSession, client: Client) -> str:
    now = utcnow()
    thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
    thread = thread_result.scalar_one_or_none()
    days_since_last_message = None
    if thread and thread.last_message_at:
        days_since_last_message = (now - thread.last_message_at).days

    meetings_result = await db.execute(
        select(Meeting).where(Meeting.client_id == client.id).order_by(Meeting.starts_at.desc()).limit(5)
    )
    recent_meetings = list(meetings_result.scalars().all())
    attended = sum(1 for m in recent_meetings if m.status == MeetingStatus.completed)
    canceled = sum(1 for m in recent_meetings if m.status == MeetingStatus.canceled)

    checkin_result = await db.execute(
        select(Checkin).where(Checkin.client_id == client.id).order_by(Checkin.submitted_at.desc()).limit(1)
    )
    latest_checkin = checkin_result.scalar_one_or_none()

    return json.dumps(
        {
            "days_since_last_message": days_since_last_message,
            "recent_meetings_attended": attended,
            "recent_meetings_canceled": canceled,
            "latest_checkin_mood": latest_checkin.mood if latest_checkin else None,
            "latest_checkin_notes": latest_checkin.progress_notes if latest_checkin else None,
        }
    )


async def build_client_history_context(db: AsyncSession, client: Client) -> str:
    tasks_result = await db.execute(select(Task).where(Task.client_id == client.id))
    tasks = list(tasks_result.scalars().all())
    done_count = sum(1 for t in tasks if t.done)

    checkins_result = await db.execute(
        select(Checkin).where(Checkin.client_id == client.id).order_by(Checkin.submitted_at.desc()).limit(3)
    )
    recent_checkins = [
        {"type": c.type.value, "mood": c.mood, "period": c.period_key}
        for c in checkins_result.scalars().all()
    ]

    return json.dumps(
        {
            "program": client.program,
            "goals": client.goals,
            "status": client.status.value,
            "tasks_done": done_count,
            "tasks_total": len(tasks),
            "recent_checkins": recent_checkins,
        }
    )


async def build_client_snapshot_context(db: AsyncSession, client: Client) -> str:
    """Richer, on-demand context for the AI Client Snapshot — recent metric
    trends, goal/task completion, and recent session-note highlights, so the
    narrative reads like a coach who's actually been paying attention."""
    tasks_result = await db.execute(select(Task).where(Task.client_id == client.id))
    tasks = list(tasks_result.scalars().all())
    done_tasks = sum(1 for t in tasks if t.done)

    goals_result = await db.execute(select(ClientGoal).where(ClientGoal.client_id == client.id))
    goals = list(goals_result.scalars().all())
    done_goals = sum(1 for g in goals if g.done)

    checkins_result = await db.execute(
        select(Checkin).where(Checkin.client_id == client.id).order_by(Checkin.submitted_at.desc()).limit(5)
    )
    recent_checkins = [
        {"type": c.type.value, "mood": c.mood, "notes": c.progress_notes}
        for c in checkins_result.scalars().all()
    ]

    metric_trends = []
    definitions_result = await db.execute(
        select(MetricDefinition).where(MetricDefinition.coach_id == client.coach_id)
    )
    for definition in definitions_result.scalars().all():
        entries_result = await db.execute(
            select(MetricEntry)
            .where(MetricEntry.definition_id == definition.id, MetricEntry.client_id == client.id)
            .order_by(MetricEntry.recorded_at.desc())
            .limit(5)
        )
        entries = list(entries_result.scalars().all())
        if entries:
            metric_trends.append(
                {
                    "metric": definition.name,
                    "unit": definition.unit,
                    "recent_values": [float(e.value) for e in reversed(entries)],
                }
            )

    sessions_result = await db.execute(
        select(SessionNote)
        .where(SessionNote.client_id == client.id)
        .order_by(SessionNote.session_date.desc())
        .limit(3)
    )
    recent_sessions = [
        {
            "date": s.session_date.isoformat(),
            "discussion_notes": s.discussion_notes,
            "wins": s.wins,
            "challenges": s.challenges,
        }
        for s in sessions_result.scalars().all()
    ]

    return json.dumps(
        {
            "program": client.program,
            "goals_text": client.goals,
            "status": client.status.value,
            "tasks_done": done_tasks,
            "tasks_total": len(tasks),
            "structured_goals_done": done_goals,
            "structured_goals_total": len(goals),
            "recent_checkins": recent_checkins,
            "metric_trends": metric_trends,
            "recent_sessions": recent_sessions,
        }
    )


async def build_thread_context(db: AsyncSession, thread_id: uuid.UUID, limit: int = 10) -> str:
    result = await db.execute(
        select(Message).where(Message.thread_id == thread_id).order_by(Message.created_at.desc()).limit(limit)
    )
    messages = list(reversed(result.scalars().all()))
    return json.dumps(
        [{"body": m.body, "type": m.type.value, "created_at": m.created_at.isoformat()} for m in messages]
    )


async def build_prep_my_day_context(db: AsyncSession, coach_id: uuid.UUID) -> tuple[str, bool]:
    """Returns (context_json, has_meetings). Reuses the same today's-meetings query
    shape as build_briefing_context, then attaches each client's most recent
    session-note summary (the real output the AI Session Assistant already
    produces) as their 'last session note' — one LLM call for the whole day."""
    now = utcnow()
    today_end = now.replace(hour=23, minute=59, second=59)

    # meeting_time is rendered straight into the dashboard by the LLM's own
    # output — format it in the coach's own stored timezone, not raw UTC, or
    # every coach outside UTC sees the wrong time for their own meetings.
    coach = await db.get(User, coach_id)
    try:
        coach_tz = ZoneInfo(coach.timezone) if coach and coach.timezone else timezone.utc
    except ZoneInfoNotFoundError:
        coach_tz = timezone.utc

    meetings_result = await db.execute(
        select(Meeting, Client, User)
        .join(Client, Client.id == Meeting.client_id)
        .join(User, User.id == Client.user_id)
        .where(
            Meeting.coach_id == coach_id,
            Meeting.starts_at >= now.replace(hour=0, minute=0, second=0),
            Meeting.starts_at <= today_end,
            Meeting.status == MeetingStatus.scheduled,
        )
        .order_by(Meeting.starts_at)
    )
    rows = meetings_result.all()
    if not rows:
        return json.dumps({"todays_meetings": []}), False

    meetings = []
    for meeting, client, user in rows:
        note_result = await db.execute(
            select(AIInsight)
            .where(
                AIInsight.client_id == client.id,
                AIInsight.type == AIInsightType.session_summary,
            )
            .order_by(AIInsight.created_at.desc())
            .limit(1)
        )
        note = note_result.scalar_one_or_none()
        meetings.append(
            {
                "client_name": user.name,
                "meeting_time": meeting.starts_at.astimezone(coach_tz).strftime("%H:%M"),
                "last_session_summary": note.payload_json.get("summary") if note else None,
            }
        )

    return json.dumps({"todays_meetings": meetings}), True


async def build_onboarding_context(db: AsyncSession, client: Client) -> str:
    intake_result = await db.execute(
        select(IntakeResponse).where(IntakeResponse.client_id == client.id)
    )
    intake = intake_result.scalar_one_or_none()
    return json.dumps(
        {
            # Ungrounded date hallucination was a confirmed real bug — the
            # model has no other way to know what "today" is, so any
            # suggested target_date came back arbitrary (including past
            # years). Every date in the response must be computed relative
            # to this.
            "todays_date": utcnow().date().isoformat(),
            "goals": client.goals,
            "intake_goals": intake.goals if intake else None,
            "experience": intake.experience if intake else None,
            "availability": intake.availability if intake else None,
            "intake_notes": intake.notes if intake else None,
        }
    )
