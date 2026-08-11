import json
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.enums import LeadStage, MeetingStatus
from app.models.leads import Lead
from app.models.meetings import Meeting
from app.models.messaging import Message, Thread
from app.models.tasks import Task
from app.models.users import User
from app.utils.time import utcnow


async def build_briefing_context(db: AsyncSession, coach_id: uuid.UUID) -> str:
    now = utcnow()
    today_end = now.replace(hour=23, minute=59, second=59)

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
        {"client": u.name, "time": m.starts_at.strftime("%H:%M")} for m, u in meetings_result.all()
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


async def build_thread_context(db: AsyncSession, thread_id: uuid.UUID, limit: int = 10) -> str:
    result = await db.execute(
        select(Message).where(Message.thread_id == thread_id).order_by(Message.created_at.desc()).limit(limit)
    )
    messages = list(reversed(result.scalars().all()))
    return json.dumps(
        [{"body": m.body, "type": m.type.value, "created_at": m.created_at.isoformat()} for m in messages]
    )
