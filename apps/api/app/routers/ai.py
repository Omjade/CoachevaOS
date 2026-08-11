import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_json, generate_text
from app.ai.context import (
    build_briefing_context,
    build_client_history_context,
    build_client_risk_context,
    build_thread_context,
)
from app.ai.prompts import (
    client_risk_prompt,
    daily_briefing_prompt,
    progress_insight_prompt,
    session_note_to_followup_prompt,
    smart_reply_prompt,
)
from app.db import get_db
from app.deps import get_current_client, get_current_user, require_coach
from app.models.ai import AIInsight
from app.models.clients import Client
from app.models.enums import AIInsightType, MessageType
from app.models.messaging import Thread
from app.models.tasks import Task
from app.models.users import User
from app.routers.threads import _create_and_broadcast, _get_authorized_thread, _other_party_user_id
from app.schemas.ai import (
    BriefingOut,
    ProgressInsightOut,
    RiskFlagOut,
    SendFollowupRequest,
    SessionNoteOut,
    SessionNoteRequest,
    SuggestReplyOut,
    SuggestReplyRequest,
)
from app.utils.time import utcnow

router = APIRouter(prefix="/ai", tags=["ai"])


def _today_start():
    now = utcnow()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


async def _get_cached(
    db: AsyncSession, coach_id: uuid.UUID, client_id: uuid.UUID | None, type_: AIInsightType
) -> AIInsight | None:
    result = await db.execute(
        select(AIInsight)
        .where(
            AIInsight.coach_id == coach_id,
            AIInsight.client_id == client_id,
            AIInsight.type == type_,
            AIInsight.created_at >= _today_start(),
        )
        .order_by(AIInsight.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/briefing", response_model=BriefingOut)
async def get_briefing(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> BriefingOut:
    cached = await _get_cached(db, coach.id, None, AIInsightType.briefing)
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


async def _get_or_generate_risk(db: AsyncSession, coach_id: uuid.UUID, client: Client, name: str) -> dict:
    cached = await _get_cached(db, coach_id, client.id, AIInsightType.risk)
    if cached:
        return cached.payload_json

    context = await build_client_risk_context(db, client)
    system, user_prompt = client_risk_prompt(name, context)
    payload = await generate_json(system, user_prompt, {"level": "unknown", "reason": "AI unavailable"})

    insight = AIInsight(coach_id=coach_id, client_id=client.id, type=AIInsightType.risk, payload_json=payload)
    db.add(insight)
    await db.commit()
    return payload


@router.get("/risk-flags", response_model=list[RiskFlagOut])
async def get_risk_flags(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[RiskFlagOut]:
    result = await db.execute(
        select(Client, User).join(User, User.id == Client.user_id).where(Client.coach_id == coach.id)
    )
    flags = []
    for client, user in result.all():
        payload = await _get_or_generate_risk(db, coach.id, client, user.name)
        flags.append(
            RiskFlagOut(
                client_id=client.id,
                client_name=user.name,
                level=payload.get("level", "unknown"),
                reason=payload.get("reason", ""),
            )
        )
    return flags


@router.get("/clients/{client_id}/summary", response_model=RiskFlagOut)
async def get_client_summary(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> RiskFlagOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    user = await db.get(User, client.user_id)
    assert user is not None
    payload = await _get_or_generate_risk(db, coach.id, client, user.name)
    return RiskFlagOut(
        client_id=client.id,
        client_name=user.name,
        level=payload.get("level", "unknown"),
        reason=payload.get("reason", ""),
    )


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
        user.name, f'{{"session_note": {body.text!r}, "client_history": {history}}}'
    )
    fallback = {
        "summary": body.text,
        "action_items": [],
        "draft_message": "AI unavailable — draft this follow-up manually.",
    }
    payload = await generate_json(system, user_prompt, fallback)

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
    system, user_prompt = smart_reply_prompt(other_user.name, history)
    payload = await generate_json(system, user_prompt, {"draft": ""})
    return SuggestReplyOut(draft=payload.get("draft", ""))


async def _progress_insight_for(db: AsyncSession, coach_id: uuid.UUID | None, client: Client) -> ProgressInsightOut:
    user = await db.get(User, client.user_id)
    assert user is not None

    tasks_result = await db.execute(select(Task).where(Task.client_id == client.id))
    tasks = list(tasks_result.scalars().all())
    done = sum(1 for t in tasks if t.done)

    cached = None
    if coach_id is not None:
        cached = await _get_cached(db, coach_id, client.id, AIInsightType.progress)
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
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> ProgressInsightOut:
    return await _progress_insight_for(db, client.coach_id, client)


@router.get("/clients/{client_id}/progress-insight", response_model=ProgressInsightOut)
async def get_client_progress_insight(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgressInsightOut:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return await _progress_insight_for(db, coach.id, client)
