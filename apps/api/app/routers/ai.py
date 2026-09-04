import json
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_json, generate_text
from app.ai.context import (
    build_briefing_context,
    build_client_history_context,
    build_client_snapshot_context,
    build_prep_my_day_context,
    build_thread_context,
)
from app.ai.embeddings import embed_text
from app.ai.onboarding import draft_onboarding
from app.ai.prompts import (
    client_snapshot_prompt,
    daily_briefing_prompt,
    document_qa_prompt,
    invoice_reminder_prompt,
    prep_my_day_prompt,
    program_draft_prompt,
    program_template_draft_prompt,
    progress_insight_prompt,
    session_note_to_followup_prompt,
    smart_reply_prompt,
    weekly_digest_prompt,
)
from app.custom_field_templates import resolve_niche
from app.db import get_db
from app.deps import get_current_client, get_current_user, require_active_coach, require_coach
from app.models.ai import AIInsight
from app.models.billing import Invoice
from app.models.clients import Client
from app.models.document_chunks import DocumentChunk
from app.models.documents import Document
from app.models.enums import AIInsightType, MessageType
from app.models.goals import ClientGoal
from app.models.messaging import Thread
from app.models.sessions import SessionNote
from app.models.tasks import Task
from app.models.users import CoachProfile, User
from app.rate_limit import limiter
from app.routers.goals import _next_order
from app.routers.threads import _create_and_broadcast, _get_authorized_thread, _other_party_user_id
from app.schemas.ai import (
    AskOut,
    AskRequest,
    AskSource,
    BriefingOut,
    ChurnScorePoint,
    ChurnTrendOut,
    ClientSnapshotOut,
    InvoiceReminderOut,
    OnboardingDraftOut,
    PrepMyDayItem,
    PrepMyDayOut,
    ProgramDraftOut,
    ProgramDraftRequest,
    ProgramTemplateDraftOut,
    ProgramTemplateDraftRequest,
    ProgressInsightOut,
    SendFollowupRequest,
    SessionNoteOut,
    SessionNoteRequest,
    SuggestReplyOut,
    SuggestReplyRequest,
    WeeklyDigestOut,
)
from app.utils.time import utcnow

router = APIRouter(prefix="/ai", tags=["ai"])


def _today_start():
    now = utcnow()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


async def _get_cached(
    db: AsyncSession,
    coach_id: uuid.UUID,
    client_id: uuid.UUID | None,
    type_: AIInsightType,
    min_data_at=None,
) -> AIInsight | None:
    """A cached insight is stale (treated as a miss) once either the calendar day
    has rolled over, or — when `min_data_at` is given — once real new client data
    (e.g. a fresh check-in) exists that's newer than when the insight was generated.
    Without this, risk/progress insights would only ever refresh once per day
    regardless of whether anything actually changed for that client."""
    conditions = [
        AIInsight.coach_id == coach_id,
        AIInsight.client_id == client_id,
        AIInsight.type == type_,
        AIInsight.created_at >= _today_start(),
    ]
    if min_data_at is not None:
        conditions.append(AIInsight.created_at >= min_data_at)
    result = await db.execute(
        select(AIInsight).where(*conditions).order_by(AIInsight.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def _latest_checkin_at(db: AsyncSession, client_id: uuid.UUID):
    from app.models.checkins import Checkin

    return await db.scalar(
        select(func.max(Checkin.submitted_at)).where(Checkin.client_id == client_id)
    )


async def _latest_progress_signal_at(db: AsyncSession, client_id: uuid.UUID):
    """Latest of: check-in submission, task creation, goal creation — the
    cache-invalidation signal for progress-insight. Task/ClientGoal have no
    updated_at column today, so an edit to an existing one won't bust the
    cache, but a genuinely new task/goal (the common case) does."""
    from app.models.checkins import Checkin
    from app.models.goals import ClientGoal

    checkin_at = await _latest_checkin_at(db, client_id)
    task_at = await db.scalar(
        select(func.max(Task.created_at)).where(Task.client_id == client_id)
    )
    goal_at = await db.scalar(
        select(func.max(ClientGoal.created_at)).where(ClientGoal.client_id == client_id)
    )
    candidates = [t for t in (checkin_at, task_at, goal_at) if t is not None]
    return max(candidates) if candidates else None


@router.get("/briefing", response_model=BriefingOut)
async def get_briefing(
    force: bool = False, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> BriefingOut:
    cached = None if force else await _get_cached(db, coach.id, None, AIInsightType.briefing)
    if cached:
        return BriefingOut(bullets=cached.payload_json["bullets"], generated_at=cached.created_at)

    context = await build_briefing_context(db, coach.id)
    system, user_prompt = daily_briefing_prompt(coach.name, context)
    text = await generate_text(system, user_prompt)
    bullets = [line.lstrip("- ").strip() for line in text.splitlines() if line.strip()]

    insight = AIInsight(
        coach_id=coach.id, client_id=None, type=AIInsightType.briefing, payload_json={"bullets": bullets}
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return BriefingOut(bullets=bullets, generated_at=insight.created_at)


@router.post("/session-note", response_model=SessionNoteOut, status_code=status.HTTP_201_CREATED)
async def create_session_note(
    body: SessionNoteRequest,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> SessionNoteOut:
    client = await db.get(Client, body.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    user = await db.get(User, client.user_id)
    assert user is not None

    history = await build_client_history_context(db, client)
    system, user_prompt = session_note_to_followup_prompt(
        user.name, json.dumps({"session_note": body.text, "client_history": json.loads(history)})
    )
    fallback = {
        "summary": body.text,
        "action_items": [],
        "draft_message": "AI unavailable. Draft this follow-up manually.",
        "suggested_goal_updates": [],
        "suggested_tasks": [],
    }
    payload = await generate_json(
        system, user_prompt, fallback, max_tokens=700, db=db, coach_id=coach.id, feature="session_note"
    )

    insight = AIInsight(
        coach_id=coach.id,
        client_id=client.id,
        type=AIInsightType.session_summary,
        payload_json=payload,
    )
    db.add(insight)
    await db.commit()

    return SessionNoteOut(
        summary=payload.get("summary", ""),
        action_items=payload.get("action_items", []),
        draft_message=payload.get("draft_message", ""),
        suggested_goal_updates=payload.get("suggested_goal_updates", []),
        suggested_tasks=payload.get("suggested_tasks", []),
    )


@router.post("/session-note/send", status_code=status.HTTP_204_NO_CONTENT)
async def send_followup(
    body: SendFollowupRequest,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    client = await db.get(Client, body.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
    thread = thread_result.scalar_one_or_none()
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No chat thread for this client yet")

    await _create_and_broadcast(
        db, thread, coach, type_=MessageType.text, body=body.draft_message, media_url=None
    )

    if body.session_summary:
        db.add(
            SessionNote(
                coach_id=coach.id,
                client_id=client.id,
                session_date=date.today(),
                discussion_notes=body.session_summary,
                created_by=coach.id,
            )
        )

    for goal in body.accepted_goal_updates:
        db.add(
            ClientGoal(
                client_id=client.id,
                created_by=coach.id,
                title=goal.title,
                target_date=date.fromisoformat(goal.target_date) if goal.target_date else None,
                order=await _next_order(db, client.id),
            )
        )

    for task in body.accepted_tasks:
        db.add(
            Task(
                coach_id=coach.id,
                client_id=client.id,
                title=task.title,
                due_date=date.fromisoformat(task.due_date) if task.due_date else None,
                added_by_user_id=coach.id,
            )
        )

    pending_result = await db.execute(
        select(AIInsight).where(
            AIInsight.client_id == client.id,
            AIInsight.type == AIInsightType.session_summary,
            AIInsight.resolved_at.is_(None),
        )
    )
    for insight in pending_result.scalars().all():
        insight.resolved_at = utcnow()
    await db.commit()


@router.post("/suggest-reply", response_model=SuggestReplyOut)
async def suggest_reply(
    body: SuggestReplyRequest,
    viewer: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SuggestReplyOut:
    thread = await _get_authorized_thread(db, viewer, body.thread_id)
    other_user_id = await _other_party_user_id(db, thread, viewer.id)
    other_user = await db.get(User, other_user_id)
    assert other_user is not None

    history = await build_thread_context(db, thread.id)
    system, user_prompt = smart_reply_prompt(other_user.name, history, requester_role=viewer.role.value)
    payload = await generate_json(system, user_prompt, {"draft": ""})
    return SuggestReplyOut(draft=payload.get("draft", ""))


async def _progress_insight_for(
    db: AsyncSession, coach_id: uuid.UUID | None, client: Client, force: bool = False
) -> ProgressInsightOut:
    user = await db.get(User, client.user_id)
    assert user is not None

    tasks_result = await db.execute(select(Task).where(Task.client_id == client.id))
    tasks = list(tasks_result.scalars().all())
    done = sum(1 for t in tasks if t.done)

    cached = None
    if coach_id is not None and not force:
        min_data_at = await _latest_progress_signal_at(db, client.id)
        cached = await _get_cached(db, coach_id, client.id, AIInsightType.progress, min_data_at)
    if cached:
        return ProgressInsightOut(insight=cached.payload_json["insight"], tasks_done=done, tasks_total=len(tasks))

    context = await build_client_history_context(db, client)
    system, user_prompt = progress_insight_prompt(user.name, context)
    text = await generate_text(system, user_prompt)

    if coach_id is not None:
        insight = AIInsight(
            coach_id=coach_id, client_id=client.id, type=AIInsightType.progress, payload_json={"insight": text}
        )
        db.add(insight)
        await db.commit()

    return ProgressInsightOut(insight=text, tasks_done=done, tasks_total=len(tasks))


@router.get("/clients/me/progress-insight", response_model=ProgressInsightOut)
async def get_my_progress_insight(
    force: bool = False,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ProgressInsightOut:
    return await _progress_insight_for(db, client.coach_id, client, force=force)


@router.get("/clients/{client_id}/progress-insight", response_model=ProgressInsightOut)
async def get_client_progress_insight(
    client_id: uuid.UUID,
    force: bool = False,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgressInsightOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return await _progress_insight_for(db, coach.id, client, force=force)


@router.get("/clients/{client_id}/churn-trend", response_model=ChurnTrendOut)
async def get_churn_trend(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ChurnTrendOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    result = await db.execute(
        select(AIInsight)
        .where(AIInsight.client_id == client_id, AIInsight.type == AIInsightType.churn_score)
        .order_by(AIInsight.created_at)
        .limit(90)
    )
    points = [
        ChurnScorePoint(
            date=insight.created_at,
            score=insight.payload_json.get("score", 0),
            explanation=insight.payload_json.get("explanation"),
        )
        for insight in result.scalars().all()
    ]
    return ChurnTrendOut(client_id=client_id, points=points)


@router.get("/clients/{client_id}/snapshot", response_model=ClientSnapshotOut)
async def get_client_snapshot(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientSnapshotOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    cached = await _get_cached(db, coach.id, client.id, AIInsightType.client_snapshot)
    if cached:
        return ClientSnapshotOut(narrative=cached.payload_json["narrative"], generated_at=cached.created_at)

    user = await db.get(User, client.user_id)
    assert user is not None
    context = await build_client_snapshot_context(db, client)
    system, user_prompt = client_snapshot_prompt(user.name, context)
    narrative = await generate_text(
        system, user_prompt, max_tokens=400, db=db, coach_id=coach.id, feature="client_snapshot"
    )

    insight = AIInsight(
        coach_id=coach.id,
        client_id=client.id,
        type=AIInsightType.client_snapshot,
        payload_json={"narrative": narrative},
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return ClientSnapshotOut(narrative=narrative, generated_at=insight.created_at)


@router.get("/prep-my-day", response_model=PrepMyDayOut)
async def get_prep_my_day(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> PrepMyDayOut:
    cached = await _get_cached(db, coach.id, None, AIInsightType.prep_my_day)
    if cached:
        return PrepMyDayOut(
            items=[PrepMyDayItem(**item) for item in cached.payload_json["items"]],
            generated_at=cached.created_at,
        )

    context, has_meetings = await build_prep_my_day_context(db, coach.id)
    if not has_meetings:
        return PrepMyDayOut(items=[], generated_at=utcnow())

    system, user_prompt = prep_my_day_prompt(coach.name, context)
    payload = await generate_json(
        system, user_prompt, {"items": []}, max_tokens=600, db=db, coach_id=coach.id, feature="prep_my_day"
    )
    items = payload.get("items", [])

    insight = AIInsight(
        coach_id=coach.id, client_id=None, type=AIInsightType.prep_my_day, payload_json={"items": items}
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return PrepMyDayOut(items=[PrepMyDayItem(**item) for item in items], generated_at=insight.created_at)


@router.post("/clients/{client_id}/onboarding-draft", response_model=OnboardingDraftOut)
async def get_onboarding_draft(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> OnboardingDraftOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    user = await db.get(User, client.user_id)
    assert user is not None
    return await draft_onboarding(db, coach, client, user)


@router.get("/weekly-digest", response_model=WeeklyDigestOut)
async def get_weekly_digest(
    force: bool = False, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> WeeklyDigestOut:
    from app.routers.analytics import get_analytics_timeseries

    week_key = utcnow().strftime("%G-W%V")
    cached = None
    if not force:
        cached_result = await db.execute(
            select(AIInsight)
            .where(
                AIInsight.coach_id == coach.id,
                AIInsight.client_id.is_(None),
                AIInsight.type == AIInsightType.weekly_digest,
                AIInsight.payload_json["week_key"].astext == week_key,
            )
            .order_by(AIInsight.created_at.desc())
            .limit(1)
        )
        cached = cached_result.scalar_one_or_none()
    if cached:
        return WeeklyDigestOut(bullets=cached.payload_json["bullets"], generated_at=cached.created_at)

    timeseries = await get_analytics_timeseries(coach=coach, db=db)
    growth = timeseries.client_growth
    checkins = timeseries.checkin_rate
    diff = {
        "client_count_this_week": growth[-1].count if growth else 0,
        "client_count_last_week": growth[-2].count if len(growth) >= 2 else None,
        "checkin_rate_this_week": checkins[-1].rate if checkins else None,
        "checkin_rate_last_week": checkins[-2].rate if len(checkins) >= 2 else None,
        "lead_funnel": [{"stage": f.stage, "count": f.count} for f in timeseries.lead_funnel],
    }
    system, user_prompt = weekly_digest_prompt(coach.name, json.dumps(diff))
    text = await generate_text(
        system, user_prompt, max_tokens=400, db=db, coach_id=coach.id, feature="weekly_digest"
    )
    bullets = [line.lstrip("- ").strip() for line in text.splitlines() if line.strip()]

    insight = AIInsight(
        coach_id=coach.id,
        client_id=None,
        type=AIInsightType.weekly_digest,
        payload_json={"bullets": bullets, "week_key": week_key},
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return WeeklyDigestOut(bullets=bullets, generated_at=insight.created_at)


@router.post("/invoices/{invoice_id}/reminder-draft", response_model=InvoiceReminderOut)
async def get_invoice_reminder_draft(
    invoice_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> InvoiceReminderOut:
    invoice = await db.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    client = await db.get(Client, invoice.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    if invoice.paid or invoice.due_date >= utcnow().date():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This invoice isn't overdue")

    user = await db.get(User, client.user_id)
    assert user is not None
    system, user_prompt = invoice_reminder_prompt(
        user.name, f"${invoice.amount:.2f}", invoice.due_date.isoformat()
    )
    text = await generate_text(
        system, user_prompt, max_tokens=150, db=db, coach_id=coach.id, feature="invoice_reminder"
    )
    return InvoiceReminderOut(draft_message=text)


@router.post("/clients/{client_id}/program-draft", response_model=ProgramDraftOut)
async def get_program_draft(
    client_id: uuid.UUID,
    body: ProgramDraftRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramDraftOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    user = await db.get(User, client.user_id)
    assert user is not None
    profile = await db.get(CoachProfile, coach.id)
    niche = resolve_niche(client.niche, profile.niche if profile else None) or "general coaching"

    context = json.dumps({"goals": client.goals, "constraints": body.constraints})
    system, user_prompt = program_draft_prompt(user.name, niche, context)
    fallback = {"title": "Starting program", "items": []}
    payload = await generate_json(
        system, user_prompt, fallback, max_tokens=800, db=db, coach_id=coach.id, feature="program_draft"
    )
    return ProgramDraftOut(
        title=payload.get("title", fallback["title"]), items=payload.get("items", [])
    )


@router.post("/program-template-draft", response_model=ProgramTemplateDraftOut)
async def get_program_template_draft(
    body: ProgramTemplateDraftRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramTemplateDraftOut:
    """Client-agnostic sibling of program-draft above — no client to bind to,
    since this drafts a reusable template, not one client's program. Kept as
    a separate prompt/endpoint rather than overloading program_draft_prompt,
    which is inherently per-client (hardcodes the client's name/goals)."""
    context = json.dumps({"hint": body.hint})
    system, user_prompt = program_template_draft_prompt(body.niche, body.duration_weeks, context)
    fallback = {"title": "New program template", "description": "", "items": []}
    payload = await generate_json(
        system,
        user_prompt,
        fallback,
        max_tokens=900,
        db=db,
        coach_id=coach.id,
        feature="program_template_draft",
    )
    return ProgramTemplateDraftOut(
        title=payload.get("title", fallback["title"]),
        description=payload.get("description"),
        items=payload.get("items", []),
    )


@router.post("/ask", response_model=AskOut)
@limiter.limit("20/minute")
async def ask_documents(
    request: Request,
    body: AskRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> AskOut:
    query_embedding = await embed_text(body.question)
    if query_embedding is None:
        return AskOut(
            answer="AI features aren't active yet. Add OPENAI_API_KEY in apps/api/.env to enable this.",
            sources=[],
        )

    # Always filtered to this coach's own chunks — the one place in the codebase
    # where a missed tenant filter would leak one coach's document content into
    # another coach's AI answers, so this gets the same scrutiny as every
    # _get_owned_* helper elsewhere.
    result = await db.execute(
        select(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.coach_id == coach.id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(5)
    )
    rows = result.all()
    if not rows:
        return AskOut(
            answer="You haven't uploaded any documents yet. Upload one on the Documents page first.",
            sources=[],
        )

    excerpts = [{"document_name": doc.name, "content": chunk.content} for chunk, doc in rows]
    system, user_prompt = document_qa_prompt(body.question, excerpts)
    answer = await generate_text(
        system, user_prompt, max_tokens=400, db=db, coach_id=coach.id, feature="document_qa"
    )
    return AskOut(
        answer=answer,
        sources=[
            AskSource(document_id=doc.id, document_name=doc.name, snippet=chunk.content[:200])
            for chunk, doc in rows
        ],
    )
