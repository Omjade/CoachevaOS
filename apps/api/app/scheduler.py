import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.ai.client import generate_text
from app.ai.context import build_briefing_context
from app.ai.prompts import daily_briefing_prompt
from app.db import async_session
from app.models.ai import AIInsight
from app.models.enums import AIInsightType
from app.models.users import CoachProfile, User
from app.notifications import generate_coach_notifications

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def generate_nightly_briefings() -> None:
    """Runs once nightly: pre-generates each coach's AI daily briefing so it's
    ready and cached (not called live) when they open the dashboard in the morning."""
    async with async_session() as db:
        result = await db.execute(select(CoachProfile.user_id))
        coach_ids = [row[0] for row in result.all()]

        for coach_id in coach_ids:
            try:
                coach = await db.get(User, coach_id)
                if coach is None:
                    continue
                context = await build_briefing_context(db, coach_id)
                system, user_prompt = daily_briefing_prompt(coach.name, context)
                text = await generate_text(system, user_prompt)
                bullets = [line.lstrip("- ").strip() for line in text.splitlines() if line.strip()]

                db.add(
                    AIInsight(
                        coach_id=coach_id,
                        client_id=None,
                        type=AIInsightType.briefing,
                        payload_json={"bullets": bullets},
                    )
                )
                await db.commit()
            except Exception:
                logger.exception("Nightly briefing generation failed for coach %s", coach_id)
                await db.rollback()


async def generate_all_coach_notifications() -> None:
    """Runs hourly: scans every coach's data for the trigger conditions in
    docs/PRD.md §11 and writes any new (deduped) notification rows."""
    async with async_session() as db:
        result = await db.execute(select(CoachProfile.user_id))
        coach_ids = [row[0] for row in result.all()]
        for coach_id in coach_ids:
            try:
                await generate_coach_notifications(db, coach_id)
            except Exception:
                logger.exception("Notification generation failed for coach %s", coach_id)
                await db.rollback()


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.add_job(
            generate_nightly_briefings,
            "cron",
            hour=5,
            minute=0,
            id="nightly_briefings",
            replace_existing=True,
        )
        scheduler.add_job(
            generate_all_coach_notifications,
            "interval",
            hours=1,
            id="hourly_notifications",
            replace_existing=True,
        )
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
