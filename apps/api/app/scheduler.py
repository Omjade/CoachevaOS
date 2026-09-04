import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import func, select

from app.ai.churn import compute_churn_score
from app.ai.client import generate_text
from app.ai.context import build_briefing_context, build_client_risk_context
from app.ai.limits import check_daily_quota
from app.ai.prompts import churn_explanation_prompt, daily_briefing_prompt
from app.db import async_session
from app.models.ai import AIInsight
from app.models.billing import PlatformSubscription
from app.models.clients import Client
from app.models.enums import AIInsightType, ClientStatus, SubscriptionStatus
from app.models.pending_imports import PendingImportRow
from app.models.users import CoachProfile, User
from app.notifications import _create_if_new, generate_coach_notifications
from app.utils.time import utcnow

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

CHURN_AT_RISK_THRESHOLD = 60
CHURN_EXPLANATION_DAILY_LIMIT = 50


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


async def generate_nightly_churn_scores() -> None:
    """Runs once nightly: computes a deterministic 0-100 churn score per client (no
    LLM call — see app/ai/churn.py) and stores it as an AIInsight row. Accumulating
    one row per client per night is what turns this into a trend, not a snapshot.
    For clients whose score crosses the at-risk threshold, also generates one short,
    token-capped explanation — bounded by a daily per-coach quota so this can't
    silently run away through a coach's OpenAI budget on a bad night."""
    async with async_session() as db:
        result = await db.execute(select(Client))
        clients = list(result.scalars().all())

        for client in clients:
            try:
                score = await compute_churn_score(db, client)
                payload = {"score": score}

                if score >= CHURN_AT_RISK_THRESHOLD and await check_daily_quota(
                    db, client.coach_id, "churn_explanation", CHURN_EXPLANATION_DAILY_LIMIT
                ):
                    coach = await db.get(User, client.coach_id)
                    client_user = await db.get(User, client.user_id) if client.user_id else None
                    if coach is not None and client_user is not None:
                        context = await build_client_risk_context(db, client)
                        system, user_prompt = churn_explanation_prompt(client_user.name, score, context)
                        payload["explanation"] = await generate_text(
                            system,
                            user_prompt,
                            max_tokens=80,
                            db=db,
                            coach_id=client.coach_id,
                            feature="churn_explanation",
                        )

                db.add(
                    AIInsight(
                        coach_id=client.coach_id,
                        client_id=client.id,
                        type=AIInsightType.churn_score,
                        payload_json=payload,
                    )
                )
                await db.commit()
            except Exception:
                logger.exception("Nightly churn score generation failed for client %s", client.id)
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


async def auto_transition_client_status() -> None:
    """Runs nightly: flips an active client to at_risk once their
    subscription_valid_until OR coaching_end_date has passed. A lapsed date
    is a signal to check in, not an automatic assumption the relationship
    ended, so this never jumps straight to paused/churned. Self-limiting:
    once flipped, the client is no longer `active` so the WHERE clause
    won't re-select them the next night. A coach extending the date and
    manually setting status back to active is the only way back, no
    silent auto-reactivation."""
    async with async_session() as db:
        today = utcnow().date()
        result = await db.execute(
            select(Client).where(
                Client.status == ClientStatus.active,
                (
                    (Client.subscription_valid_until.is_not(None))
                    & (Client.subscription_valid_until < today)
                )
                | (
                    (Client.coaching_end_date.is_not(None))
                    & (Client.coaching_end_date < today)
                ),
            )
        )
        clients = list(result.scalars().all())

        for client in clients:
            try:
                client.status = ClientStatus.at_risk
                client_user = await db.get(User, client.user_id) if client.user_id else None
                name = client_user.name if client_user else "A client"
                lapsed_subscription = (
                    client.subscription_valid_until is not None and client.subscription_valid_until < today
                )
                reason = "subscription date" if lapsed_subscription else "coaching end date"
                await _create_if_new(
                    db,
                    client.coach_id,
                    "client_subscription_lapsed",
                    str(client.id),
                    {
                        "message": f"{name}'s {reason} passed. Check in or extend it.",
                        "client_id": str(client.id),
                    },
                )
                await db.commit()
            except Exception:
                logger.exception("Auto status transition failed for client %s", client.id)
                await db.rollback()


SUBSCRIPTION_REMINDER_THRESHOLDS = {12, 9, 6, 3, 1}


async def send_subscription_reminders() -> None:
    """Runs nightly: notifies a trialing coach at 12/9/6/3/1 days before
    trial_ends_at. last_reminder_day_sent tracks the exact threshold already
    sent so a re-run the same day (or any future day) never double-notifies
    for the same value — each threshold is only ever hit once across a given
    trial anyway, since trial_ends_at never changes and days_until only
    counts down, but this is a cheap explicit guard rather than relying on
    that alone."""
    async with async_session() as db:
        result = await db.execute(
            select(PlatformSubscription).where(PlatformSubscription.status == SubscriptionStatus.trialing)
        )
        subs = list(result.scalars().all())

        for sub in subs:
            try:
                days_until = (sub.trial_ends_at.date() - utcnow().date()).days
                if days_until not in SUBSCRIPTION_REMINDER_THRESHOLDS:
                    continue
                if sub.last_reminder_day_sent == days_until:
                    continue
                await _create_if_new(
                    db,
                    sub.coach_id,
                    "trial_reminder",
                    str(days_until),
                    {
                        "message": (
                            f"Your trial ends in {days_until} day{'s' if days_until != 1 else ''}. "
                            "Choose a plan to keep your account active."
                        ),
                    },
                )
                sub.last_reminder_day_sent = days_until
                await db.commit()
            except Exception:
                logger.exception("Subscription reminder failed for coach %s", sub.coach_id)
                await db.rollback()


async def check_client_cap_overages() -> None:
    """Runs nightly: flags (never silently fixes) any coach currently over their
    plan's active-client limit — catches drift from a downgrade, a manual DB
    edit, or a plan-limit change, none of which retroactively touch existing
    client rows. The real-time check lives in app.deps.check_client_cap; this
    is the backstop for anything that slips past it."""
    async with async_session() as db:
        result = await db.execute(
            select(PlatformSubscription).where(PlatformSubscription.client_limit.is_not(None))
        )
        subs = list(result.scalars().all())

        for sub in subs:
            try:
                active_count = await db.scalar(
                    select(func.count()).select_from(Client).where(
                        Client.coach_id == sub.coach_id, Client.status == ClientStatus.active
                    )
                )
                if (active_count or 0) > sub.client_limit:
                    await _create_if_new(
                        db,
                        sub.coach_id,
                        "client_cap_exceeded",
                        f"{sub.tier.value}:{active_count}",
                        {
                            "message": f"You have {active_count} active clients, over your "
                            f"plan's limit of {sub.client_limit}. Upgrade to stay within your plan.",
                        },
                    )
                    await db.commit()
            except Exception:
                logger.exception("Client-cap check failed for coach %s", sub.coach_id)
                await db.rollback()


async def retry_pending_client_imports() -> None:
    """Runs nightly: for every coach with rows saved via the CSV/XLSX import
    cap-overflow path, re-attempts them once there's real room again -- a
    coach who upgrades their plan never has to manually click retry or
    re-upload the file. Deferred import to avoid a circular cycle
    (client_import.py imports app.routers.clients, which this module
    doesn't otherwise need)."""
    from app.routers.client_import import retry_pending_rows_for_coach

    async with async_session() as db:
        coach_ids_result = await db.execute(select(PendingImportRow.coach_id).distinct())
        coach_ids = [row[0] for row in coach_ids_result.all()]

        for coach_id in coach_ids:
            try:
                coach = await db.get(User, coach_id)
                if coach is None:
                    continue
                await retry_pending_rows_for_coach(db, coach)
            except Exception:
                logger.exception("Pending-import retry failed for coach %s", coach_id)
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
        scheduler.add_job(
            generate_nightly_churn_scores,
            "cron",
            hour=5,
            minute=30,
            id="nightly_churn_scores",
            replace_existing=True,
        )
        scheduler.add_job(
            check_client_cap_overages,
            "cron",
            hour=4,
            id="nightly_client_cap_check",
            replace_existing=True,
        )
        scheduler.add_job(
            auto_transition_client_status,
            "cron",
            hour=4,
            minute=15,
            id="auto_transition_client_status",
            replace_existing=True,
        )
        scheduler.add_job(
            send_subscription_reminders,
            "cron",
            hour=4,
            minute=30,
            id="send_subscription_reminders",
            replace_existing=True,
        )
        scheduler.add_job(
            retry_pending_client_imports,
            "cron",
            hour=4,
            minute=45,
            id="retry_pending_client_imports",
            replace_existing=True,
        )
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
