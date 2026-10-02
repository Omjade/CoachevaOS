import html
import json
import logging
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import func, select

from app.ai.churn import compute_churn_score
from app.ai.client import generate_json, generate_text
from app.ai.context import build_briefing_context, build_client_memory, build_client_risk_context
from app.ai.safety import check_escalation
from app.ai.limits import check_daily_quota
from app.ai.prompts import (
    churn_explanation_prompt,
    companion_message_prompt,
    daily_briefing_prompt,
    retention_nudge_prompt,
)
from app.db import async_session
from app.email import send_email
from app.models.ai import AgentAction, AIInsight
from app.models.ai_assistant import CoachAIAssistantSettings
from app.models.automation import CoachAutomationSettings
from app.models.billing import PlatformSubscription
from app.models.clients import Client
from app.models.enums import AIInsightType, ClientStatus, MeetingStatus, MessageType, SubscriptionStatus
from app.models.meetings import Meeting
from app.models.messaging import Thread
from app.models.pending_imports import PendingImportRow
from app.models.users import CoachProfile, User
from app.notifications import _create_if_new, generate_coach_notifications
from app.routers.threads import _create_and_broadcast
from app.utils.time import utcnow

NO_SHOW_AT_RISK_THRESHOLD = 2
NO_SHOW_AT_RISK_WINDOW_DAYS = 30

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

CHURN_AT_RISK_THRESHOLD = 60
CHURN_EXPLANATION_DAILY_LIMIT = 50
# Same backstop pattern as churn_explanation — bounds worst-case LLM spend
# per coach per night even if every client happens to cross threshold the
# same day. The 7-day cooldown and 1/day cap already bound steady-state
# usage; this bounds the pathological case.
RETENTION_NUDGE_DAILY_LIMIT = 50
COMPANION_SEND_GENERATION_DAILY_LIMIT = 100


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

                automation = await db.get(CoachAutomationSettings, coach_id)
                if automation is not None and automation.email_daily_briefing and bullets:
                    items_html = "".join(f"<li>{html.escape(b)}</li>" for b in bullets)
                    await send_email(
                        coach.email,
                        "Your CoachevaOS morning briefing",
                        f"<p>Good morning, {html.escape(coach.name)}.</p><ul>{items_html}</ul>",
                    )
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

        # Second, independent trigger: 2+ no-shows in the trailing 30 days —
        # reuses the same self-limiting pattern (only ever selects clients
        # still `active`, so a client already flipped above or on a prior
        # night isn't re-processed or re-notified).
        cutoff = utcnow() - timedelta(days=NO_SHOW_AT_RISK_WINDOW_DAYS)
        no_show_result = await db.execute(
            select(Meeting.client_id, func.count())
            .join(Client, Client.id == Meeting.client_id)
            .where(
                Client.status == ClientStatus.active,
                Meeting.status == MeetingStatus.no_show,
                Meeting.starts_at >= cutoff,
            )
            .group_by(Meeting.client_id)
            .having(func.count() >= NO_SHOW_AT_RISK_THRESHOLD)
        )
        for client_id, no_show_count in no_show_result.all():
            client = await db.get(Client, client_id)
            if client is None or client.status != ClientStatus.active:
                continue
            try:
                client.status = ClientStatus.at_risk
                client_user = await db.get(User, client.user_id) if client.user_id else None
                name = client_user.name if client_user else "A client"
                await _create_if_new(
                    db,
                    client.coach_id,
                    "client_no_show_pattern",
                    str(client.id),
                    {
                        "message": f"{name} has {no_show_count} no-shows in the last {NO_SHOW_AT_RISK_WINDOW_DAYS} days. Worth a check-in.",
                        "client_id": str(client.id),
                    },
                )
                await db.commit()
            except Exception:
                logger.exception("No-show at-risk transition failed for client %s", client.id)
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


RETENTION_NUDGE_COOLDOWN_DAYS = 7


async def nightly_retention_check() -> None:
    """Runs nightly, opt-in per coach (CoachAutomationSettings.retention_agent_enabled):
    finds active clients who look quiet (reusing the same deterministic
    compute_churn_score signal the nightly churn-score job already computes —
    no new detection logic) and drafts a warm, personal check-in via
    retention_nudge_prompt. Never sends anything itself — writes a pending
    AgentAction row (kind="retention_nudge") for the coach's unified
    approval inbox (see routers/agent_actions.py), except when the prompt's
    own escalate flag fires,
    in which case this alerts the coach directly instead of drafting a
    message a bot shouldn't be the one deciding how to word."""
    async with async_session() as db:
        automation_result = await db.execute(
            select(CoachAutomationSettings).where(CoachAutomationSettings.retention_agent_enabled.is_(True))
        )
        enabled_coach_ids = [row.coach_id for row in automation_result.scalars().all()]
        if not enabled_coach_ids:
            return

        # agents_paused is the one-switch-stops-everything control on Your AI
        # Team — a coach flipping it off must actually stop every proactive
        # job, not just hide the UI.
        voice_settings_result = await db.execute(
            select(CoachAIAssistantSettings).where(CoachAIAssistantSettings.coach_id.in_(enabled_coach_ids))
        )
        voice_settings_by_coach = {s.coach_id: s for s in voice_settings_result.scalars().all()}
        active_coach_ids = [
            cid for cid in enabled_coach_ids if not getattr(voice_settings_by_coach.get(cid), "agents_paused", False)
        ]
        if not active_coach_ids:
            return

        clients_result = await db.execute(
            select(Client).where(
                Client.coach_id.in_(active_coach_ids), Client.status == ClientStatus.active
            )
        )
        clients = list(clients_result.scalars().all())

        cooldown_cutoff = utcnow() - timedelta(days=RETENTION_NUDGE_COOLDOWN_DAYS)

        _SENSITIVITY_THRESHOLDS = {"gentle": 75, "normal": CHURN_AT_RISK_THRESHOLD, "strict": 45}

        for client in clients:
            try:
                recent_nudge = await db.scalar(
                    select(func.count())
                    .select_from(AgentAction)
                    .where(
                        AgentAction.client_id == client.id,
                        AgentAction.kind == "retention_nudge",
                        AgentAction.created_at >= cooldown_cutoff,
                    )
                )
                if (recent_nudge or 0) > 0:
                    continue

                score = await compute_churn_score(db, client)
                voice_settings = voice_settings_by_coach.get(client.coach_id)
                threshold = _SENSITIVITY_THRESHOLDS.get(
                    voice_settings.drift_sensitivity if voice_settings else "normal", CHURN_AT_RISK_THRESHOLD
                )
                if score < threshold:
                    continue
                if not await check_daily_quota(
                    db, client.coach_id, "retention_nudge", RETENTION_NUDGE_DAILY_LIMIT
                ):
                    continue

                coach = await db.get(User, client.coach_id)
                client_user = await db.get(User, client.user_id) if client.user_id else None
                if coach is None or client_user is None:
                    continue

                assistant_settings = await db.get(CoachAIAssistantSettings, client.coach_id)
                memory = await build_client_memory(db, client)
                system, user_prompt = retention_nudge_prompt(
                    client_user.name,
                    coach.name,
                    assistant_settings.tone if assistant_settings else None,
                    assistant_settings.style_notes if assistant_settings else None,
                    json.dumps(memory),
                )
                result = await generate_json(
                    system,
                    user_prompt,
                    fallback={"message": "", "escalate": False},
                    max_tokens=150,
                    db=db,
                    coach_id=client.coach_id,
                    feature="retention_nudge",
                )

                # Deterministic backstop alongside the model's own escalate flag — same
                # check_escalation() reused by checkin submission, so neither path
                # relies on the LLM alone to catch a real safety concern.
                if result.get("escalate") or check_escalation(result.get("message")):
                    await _create_if_new(
                        db,
                        client.coach_id,
                        "retention_escalation",
                        str(client.id),
                        {
                            "message": f"{client_user.name} may need a direct, personal check-in "
                            "— the retention agent flagged this rather than drafting a message.",
                            "client_id": str(client.id),
                        },
                    )
                elif result.get("message"):
                    db.add(
                        AgentAction(
                            coach_id=client.coach_id,
                            client_id=client.id,
                            kind="retention_nudge",
                            draft_message=result["message"],
                            status="pending",
                        )
                    )
                await db.commit()
            except Exception:
                logger.exception("Nightly retention check failed for client %s", client.id)
                await db.rollback()


COMPANION_SEND_DAILY_CAP = 1
COMPANION_IGNORED_PAUSE_THRESHOLD = 2
# "Tomorrow" window for a session reminder — centered on 24h out so this
# nightly job (once/day) reliably catches sessions scheduled roughly a day
# ahead regardless of exactly what time the job runs.
SESSION_REMINDER_WINDOW_HOURS = (20, 32)


def _in_quiet_hours(now_local: time, start: time | None, end: time | None) -> bool:
    if start is None or end is None:
        return False
    if start <= end:
        return start <= now_local <= end
    return now_local >= start or now_local <= end  # wraps past midnight


async def nightly_companion_sends() -> None:
    """Runs nightly: the Client Companion's one proactive send per
    consenting client — a session reminder, a task nudge, or a check-in
    prompt, whichever is due (see build_client_memory for what "due" draws
    on). Tap-only per the phase 1 design: the drafted message itself is
    built to never invite a typed reply (see companion_message_prompt).
    Respects the coach's quiet hours (in the CLIENT's own timezone — a
    message landing at 11pm for the client is wrong even if it's 2pm for
    the coach), the 1/day cap, and companion_freedom (default "ask_first",
    so most sends land in the Approvals inbox exactly like Drift Detector
    nudges). After 2 consecutive skipped sends for the same client, stops
    and alerts the coach rather than continuing to draft into the void."""
    async with async_session() as db:
        clients_result = await db.execute(
            select(Client, User)
            .join(User, User.id == Client.user_id)
            .where(Client.status == ClientStatus.active, Client.companion_consent_at.is_not(None))
        )
        rows = clients_result.all()
        if not rows:
            return

        for client, client_user in rows:
            try:
                coach = await db.get(User, client.coach_id)
                voice_settings = await db.get(CoachAIAssistantSettings, client.coach_id)
                if coach is None or voice_settings is None or voice_settings.agents_paused:
                    continue

                recent_sends_result = await db.execute(
                    select(AgentAction.status)
                    .where(AgentAction.client_id == client.id, AgentAction.kind == "companion_send")
                    .order_by(AgentAction.created_at.desc())
                    .limit(COMPANION_IGNORED_PAUSE_THRESHOLD)
                )
                recent_statuses = [row[0] for row in recent_sends_result.all()]
                if len(recent_statuses) == COMPANION_IGNORED_PAUSE_THRESHOLD and all(
                    s == "skipped" for s in recent_statuses
                ):
                    continue  # paused — the 2nd skip already alerted the coach, see approve/skip wiring

                today_start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                today_count = await db.scalar(
                    select(func.count())
                    .select_from(AgentAction)
                    .where(
                        AgentAction.client_id == client.id,
                        AgentAction.kind == "companion_send",
                        AgentAction.created_at >= today_start,
                    )
                )
                if (today_count or 0) >= COMPANION_SEND_DAILY_CAP:
                    continue

                client_tz_name = client.timezone or client_user.timezone or "UTC"
                try:
                    client_tz = ZoneInfo(client_tz_name)
                except ZoneInfoNotFoundError:
                    client_tz = timezone.utc
                now_local_time = utcnow().astimezone(client_tz).time()
                if _in_quiet_hours(now_local_time, voice_settings.quiet_hours_start, voice_settings.quiet_hours_end):
                    continue

                memory = await build_client_memory(db, client)

                reason: str | None = None
                if memory["next_meeting_starts_at"]:
                    next_dt = datetime.fromisoformat(memory["next_meeting_starts_at"])
                    hours_until = (next_dt - utcnow()).total_seconds() / 3600
                    if SESSION_REMINDER_WINDOW_HOURS[0] <= hours_until <= SESSION_REMINDER_WINDOW_HOURS[1]:
                        reason = "session_reminder"
                if reason is None:
                    due_soon = [
                        t
                        for t in memory["open_tasks"]
                        if t["due_date"] and date.fromisoformat(t["due_date"]) <= utcnow().date() + timedelta(days=1)
                    ]
                    if due_soon:
                        reason = "task_nudge"
                if reason is None:
                    continue  # nothing due today — silence is correct, not a bug
                if not await check_daily_quota(
                    db, client.coach_id, "companion_send", COMPANION_SEND_GENERATION_DAILY_LIMIT
                ):
                    continue

                system, user_prompt = companion_message_prompt(
                    client_user.name,
                    coach.name,
                    reason,
                    voice_settings.tone,
                    voice_settings.style_notes,
                    voice_settings.sign_off,
                    json.dumps(memory),
                )
                result = await generate_json(
                    system,
                    user_prompt,
                    fallback={"message": "", "escalate": False},
                    max_tokens=150,
                    db=db,
                    coach_id=coach.id,
                    feature="companion_send",
                )

                if result.get("escalate") or check_escalation(result.get("message")):
                    await _create_if_new(
                        db,
                        coach.id,
                        "companion_escalation",
                        str(client.id),
                        {
                            "message": f"{client_user.name}'s Companion flagged something that "
                            "may need your attention — please check in directly.",
                            "client_id": str(client.id),
                        },
                    )
                    await db.commit()
                    continue
                if not result.get("message"):
                    continue

                if voice_settings.companion_freedom == "run_alone":
                    thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
                    thread = thread_result.scalar_one_or_none()
                    if thread is not None:
                        await _create_and_broadcast(
                            db,
                            thread,
                            coach,
                            type_=MessageType.text,
                            body=result["message"],
                            media_url=None,
                            is_agent_sent=True,
                        )
                    db.add(
                        AgentAction(
                            coach_id=coach.id,
                            client_id=client.id,
                            kind="companion_send",
                            draft_message=result["message"],
                            payload_json={"reason": reason},
                            status="approved",
                            sent_at=utcnow(),
                        )
                    )
                else:
                    db.add(
                        AgentAction(
                            coach_id=coach.id,
                            client_id=client.id,
                            kind="companion_send",
                            draft_message=result["message"],
                            payload_json={"reason": reason},
                            status="pending",
                        )
                    )
                await db.commit()
            except Exception:
                logger.exception("Nightly companion send failed for client %s", client.id)
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
        scheduler.add_job(
            nightly_retention_check,
            "cron",
            hour=5,
            minute=45,
            id="nightly_retention_check",
            replace_existing=True,
        )
        scheduler.add_job(
            nightly_companion_sends,
            "cron",
            hour=6,
            minute=0,
            id="nightly_companion_sends",
            replace_existing=True,
        )
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
