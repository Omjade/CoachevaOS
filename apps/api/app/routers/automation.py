import logging
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.onboarding import draft_onboarding
from app.db import get_db
from app.deps import require_active_coach
from app.models.automation import CoachAutomationSettings
from app.models.clients import Client
from app.models.enums import MessageType
from app.models.goals import ClientGoal
from app.models.messaging import Thread
from app.models.notifications import Notification
from app.notifications import broadcast_notification
from app.models.programs import Program
from app.models.tasks import Task
from app.models.users import User
from app.routers.programs import _assign_template_to_client
from app.routers.threads import _create_and_broadcast
from app.schemas.automation import AutomationSettingsOut, AutomationSettingsUpdate
from app.utils.time import utcnow

router = APIRouter(tags=["automation"])

logger = logging.getLogger(__name__)


async def _get_or_create_settings(db: AsyncSession, coach_id: uuid.UUID) -> CoachAutomationSettings:
    settings = await db.get(CoachAutomationSettings, coach_id)
    if settings is None:
        settings = CoachAutomationSettings(coach_id=coach_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/coach/automation-settings", response_model=AutomationSettingsOut)
async def get_automation_settings(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> CoachAutomationSettings:
    return await _get_or_create_settings(db, coach.id)


@router.patch("/coach/automation-settings", response_model=AutomationSettingsOut)
async def update_automation_settings(
    body: AutomationSettingsUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachAutomationSettings:
    settings = await _get_or_create_settings(db, coach.id)
    if body.auto_onboarding_enabled is not None:
        settings.auto_onboarding_enabled = body.auto_onboarding_enabled
    if body.clear_template:
        settings.auto_assign_template_id = None
    elif body.auto_assign_template_id is not None:
        settings.auto_assign_template_id = body.auto_assign_template_id
    await db.commit()
    await db.refresh(settings)
    return settings


async def run_auto_onboarding(db: AsyncSession, coach: User, client: Client, user: User) -> None:
    """Best-effort automation chain, fired from submit_my_intake once the
    client's own intake row is already committed. Never raises — a failure
    here must never fail the client's own intake submission."""
    settings = await db.get(CoachAutomationSettings, coach.id)
    if settings is None or not settings.auto_onboarding_enabled:
        return

    try:
        draft = await draft_onboarding(db, coach, client, user)

        for goal in draft.suggested_goals:
            target_date = None
            if goal.target_date:
                try:
                    target_date = date.fromisoformat(goal.target_date)
                except ValueError:
                    target_date = None
            db.add(
                ClientGoal(
                    client_id=client.id, created_by=coach.id, title=goal.title, target_date=target_date
                )
            )

        if settings.auto_assign_template_id is not None:
            template = await db.get(Program, settings.auto_assign_template_id)
            if template is not None and template.coach_id == coach.id and template.is_template:
                await _assign_template_to_client(db, template, client, coach.id)

        db.add(
            Task(
                coach_id=coach.id,
                client_id=client.id,
                title="Complete your first check-in",
                due_date=(utcnow() + timedelta(days=7)).date(),
                added_by_user_id=coach.id,
            )
        )

        thread_result = await db.execute(
            select(Thread).where(Thread.client_id == client.id, Thread.coach_id == coach.id)
        )
        thread = thread_result.scalar_one_or_none()
        if thread is not None:
            await _create_and_broadcast(
                db, thread, coach, type_=MessageType.text, body=draft.welcome_message, media_url=None
            )

        onboarded_notification = Notification(
            user_id=coach.id,
            type="client_onboarded",
            payload_json={"message": f"{user.name} finished onboarding", "client_id": str(client.id)},
        )
        db.add(onboarded_notification)

        await db.commit()
        await db.refresh(onboarded_notification)
        await broadcast_notification(onboarded_notification)
    except Exception:
        logger.exception("Auto-onboarding automation failed for client %s", client.id)
        await db.rollback()
