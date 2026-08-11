import logging
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import Invoice
from app.models.clients import Client
from app.models.leads import Lead
from app.models.meetings import Meeting
from app.models.messaging import Thread
from app.models.ai import AIInsight  # noqa: F401  (kept for future insight-triggered notifications)
from app.models.enums import LeadStage, MeetingStatus
from app.models.notifications import Notification
from app.models.tasks import Task
from app.models.users import User
from app.utils.time import utcnow

logger = logging.getLogger(__name__)


async def _create_if_new(
    db: AsyncSession, user_id: uuid.UUID, type_: str, key: str, payload: dict
) -> None:
    today_start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.type == type_,
            Notification.payload_json["key"].as_string() == key,
            Notification.created_at >= today_start,
        )
    )
    if result.scalar_one_or_none() is not None:
        return
    db.add(Notification(user_id=user_id, type=type_, payload_json={**payload, "key": key}))


async def generate_coach_notifications(db: AsyncSession, coach_id: uuid.UUID) -> None:
    """Scans a coach's data for the trigger conditions in docs/PRD.md §11 and writes
    a Notification row for any new condition (deduped per entity per day)."""
    now = utcnow()

    # Meeting starting within the next hour
    soon = now + timedelta(hours=1)
    meetings = await db.execute(
        select(Meeting, User)
        .join(Client, Client.id == Meeting.client_id)
        .join(User, User.id == Client.user_id)
        .where(
            Meeting.coach_id == coach_id,
            Meeting.status == MeetingStatus.scheduled,
            Meeting.starts_at >= now,
            Meeting.starts_at <= soon,
        )
    )
    for meeting, user in meetings.all():
        await _create_if_new(
            db,
            coach_id,
            "meeting_soon",
            str(meeting.id),
            {"message": f"Meeting with {user.name} starting soon", "client_name": user.name},
        )

    # Tasks due today or overdue, not done
    clients_result = await db.execute(
        select(Client, User).join(User, User.id == Client.user_id).where(Client.coach_id == coach_id)
    )
    all_clients = clients_result.all()
    for client, user in all_clients:
        tasks_result = await db.execute(
            select(Task).where(
                Task.client_id == client.id, Task.done.is_(False), Task.due_date.is_not(None)
            )
        )
        for task in tasks_result.scalars().all():
            if task.due_date <= now.date():
                await _create_if_new(
                    db,
                    coach_id,
                    "task_due",
                    str(task.id),
                    {"message": f'"{task.title}" for {user.name} is due', "client_name": user.name},
                )

    # Subscriptions expiring within 3 days
    for client, user in all_clients:
        if client.subscription_valid_until:
            days_left = (client.subscription_valid_until - now.date()).days
            if 0 <= days_left <= 3:
                await _create_if_new(
                    db,
                    coach_id,
                    "subscription_expiring",
                    str(client.id),
                    {
                        "message": f"{user.name}'s subscription expires in {days_left}d",
                        "client_name": user.name,
                    },
                )

    # Unread 24h+: last message in thread sent by client, coach hasn't replied
    for client, user in all_clients:
        thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
        thread = thread_result.scalar_one_or_none()
        if thread and thread.last_message_at and (now - thread.last_message_at) >= timedelta(hours=24):
            await _create_if_new(
                db,
                coach_id,
                "unread_message",
                str(thread.id),
                {"message": f"{user.name} hasn't heard back in 24h+", "client_name": user.name},
            )

    # Leads awaiting follow-up (no contact in 5+ days, or never contacted)
    leads_result = await db.execute(
        select(Lead).where(
            Lead.coach_id == coach_id,
            Lead.stage.in_([LeadStage.new, LeadStage.contacted, LeadStage.follow_up]),
        )
    )
    for lead in leads_result.scalars().all():
        stale = lead.last_contacted_at is None or (now - lead.last_contacted_at) >= timedelta(days=5)
        if stale:
            await _create_if_new(
                db,
                coach_id,
                "lead_followup",
                str(lead.id),
                {"message": f"{lead.name} is awaiting follow-up", "client_name": lead.name},
            )

    # Overdue invoices
    for client, user in all_clients:
        invoices_result = await db.execute(
            select(Invoice).where(Invoice.client_id == client.id, Invoice.paid.is_(False))
        )
        for invoice in invoices_result.scalars().all():
            if invoice.due_date < now.date():
                await _create_if_new(
                    db,
                    coach_id,
                    "invoice_overdue",
                    str(invoice.id),
                    {
                        "message": f"Invoice for {user.name} (${invoice.amount}) is overdue",
                        "client_name": user.name,
                    },
                )

    await db.commit()
