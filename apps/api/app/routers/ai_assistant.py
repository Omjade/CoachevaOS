import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_json
from app.ai.context import build_client_history_context
from app.ai.prompts import client_assistant_prompt
from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.ai_assistant import AIAssistantMessage, CoachAIAssistantSettings
from app.models.clients import Client
from app.models.notifications import Notification
from app.notifications import broadcast_notification
from app.models.users import CoachProfile, User
from app.rate_limit import limiter
from app.routers.clients import _get_owned_client
from app.schemas.ai_assistant import (
    AssistantMessageCreate,
    AssistantMessageOut,
    AssistantMessageSendOut,
    AssistantSettingsOut,
    AssistantSettingsUpdate,
)
from app.utils.time import utcnow

router = APIRouter(tags=["ai-assistant"])

PLATFORM_QUERY_CEILING = 25
HISTORY_MESSAGES_INCLUDED = 6


async def _get_or_create_settings(db: AsyncSession, coach_id: uuid.UUID) -> CoachAIAssistantSettings:
    settings = await db.get(CoachAIAssistantSettings, coach_id)
    if settings is None:
        settings = CoachAIAssistantSettings(coach_id=coach_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


def _settings_out(settings: CoachAIAssistantSettings) -> AssistantSettingsOut:
    return AssistantSettingsOut(
        enabled=settings.enabled,
        tone=settings.tone,
        style_notes=settings.style_notes,
        custom_instructions=settings.custom_instructions,
        daily_query_limit=settings.daily_query_limit,
        platform_query_ceiling=PLATFORM_QUERY_CEILING,
    )


@router.get("/coach/ai-assistant-settings", response_model=AssistantSettingsOut)
async def get_assistant_settings(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> AssistantSettingsOut:
    settings = await _get_or_create_settings(db, coach.id)
    return _settings_out(settings)


@router.patch("/coach/ai-assistant-settings", response_model=AssistantSettingsOut)
async def update_assistant_settings(
    body: AssistantSettingsUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> AssistantSettingsOut:
    settings = await _get_or_create_settings(db, coach.id)
    if body.enabled is not None:
        settings.enabled = body.enabled
    if body.tone is not None:
        settings.tone = body.tone
    if body.style_notes is not None:
        settings.style_notes = body.style_notes
    if body.custom_instructions is not None:
        settings.custom_instructions = body.custom_instructions
    if body.daily_query_limit is not None:
        # The coach's number can only ever lower the effective limit, never raise
        # it past the platform ceiling — protects against a misconfigured cost blowup.
        settings.daily_query_limit = max(1, min(body.daily_query_limit, PLATFORM_QUERY_CEILING))
    await db.commit()
    await db.refresh(settings)
    return _settings_out(settings)


async def _today_message_count(db: AsyncSession, client_id: uuid.UUID) -> int:
    today_start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.scalar(
        select(func.count())
        .select_from(AIAssistantMessage)
        .where(
            AIAssistantMessage.client_id == client_id,
            AIAssistantMessage.role == "user",
            AIAssistantMessage.created_at >= today_start,
        )
    )
    return count or 0


# NOTE: /clients/me/assistant/messages must be declared before
# /clients/{client_id}/assistant/messages — same route-ordering reason
# documented in goals.py.


@router.get("/clients/me/assistant/messages", response_model=list[AssistantMessageOut])
async def list_my_assistant_messages(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[AIAssistantMessage]:
    settings = await db.get(CoachAIAssistantSettings, client.coach_id)
    if settings is None or not settings.enabled:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Assistant is not enabled")
    result = await db.execute(
        select(AIAssistantMessage)
        .where(AIAssistantMessage.client_id == client.id)
        .order_by(AIAssistantMessage.created_at)
        .limit(200)
    )
    return list(result.scalars().all())


@router.post("/clients/me/assistant/messages", response_model=AssistantMessageSendOut)
@limiter.limit("10/minute")
async def send_assistant_message(
    request: Request,
    body: AssistantMessageCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> AssistantMessageSendOut:
    settings = await db.get(CoachAIAssistantSettings, client.coach_id)
    if settings is None or not settings.enabled:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Assistant is not enabled")

    effective_limit = min(settings.daily_query_limit, PLATFORM_QUERY_CEILING)
    used_today = await _today_message_count(db, client.id)
    if used_today >= effective_limit:
        # Not persisted: this is a quota rejection, not a real AI exchange — no
        # OpenAI call was made, and storing it would inflate history for no reason.
        return AssistantMessageSendOut(
            reply=AssistantMessageOut(
                id=uuid.uuid4(),
                role="assistant",
                content="You've reached today's question limit — message your coach directly for anything urgent.",
                escalated=False,
                created_at=utcnow(),
            ),
            remaining_today=0,
        )

    coach = await db.get(User, client.coach_id)
    client_user = await db.get(User, client.user_id) if client.user_id else None
    profile = await db.get(CoachProfile, client.coach_id)
    if coach is None or client_user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    niche = (profile.niche if profile else None) or "general coaching"

    user_message = AIAssistantMessage(client_id=client.id, role="user", content=body.content)
    db.add(user_message)
    await db.flush()

    history_result = await db.execute(
        select(AIAssistantMessage)
        .where(AIAssistantMessage.client_id == client.id)
        .order_by(AIAssistantMessage.created_at.desc())
        .limit(HISTORY_MESSAGES_INCLUDED)
    )
    recent = list(reversed(history_result.scalars().all()))
    client_context = await build_client_history_context(db, client)

    context = json.dumps(
        {
            "client_context": json.loads(client_context),
            "recent_history": [{"role": m.role, "content": m.content} for m in recent],
            "question": body.content,
        }
    )
    system, user_prompt = client_assistant_prompt(
        client_user.name,
        coach.name,
        niche,
        settings.tone,
        settings.style_notes,
        settings.custom_instructions,
        context,
    )
    fallback = {
        "reply": "I'm having trouble responding right now — please try again shortly.",
        "escalate": False,
    }
    payload = await generate_json(
        system,
        user_prompt,
        fallback,
        max_tokens=350,
        db=db,
        coach_id=client.coach_id,
        feature="client_assistant",
    )

    escalate = bool(payload.get("escalate", False))
    assistant_message = AIAssistantMessage(
        client_id=client.id,
        role="assistant",
        content=payload.get("reply", fallback["reply"]),
        escalated=escalate,
    )
    db.add(assistant_message)

    escalation_notification = None
    if escalate:
        escalation_notification = Notification(
            user_id=client.coach_id,
            type="ai_assistant_escalation",
            payload_json={
                "message": f"{client_user.name}'s question was escalated to you",
                "client_id": str(client.id),
                "client_name": client_user.name,
                "question": body.content,
            },
        )
        db.add(escalation_notification)

    await db.commit()
    await db.refresh(assistant_message)
    if escalation_notification is not None:
        await db.refresh(escalation_notification)
        await broadcast_notification(escalation_notification)

    return AssistantMessageSendOut(
        reply=AssistantMessageOut.model_validate(assistant_message),
        remaining_today=max(0, effective_limit - used_today - 1),
    )


@router.get("/clients/{client_id}/assistant/messages", response_model=list[AssistantMessageOut])
async def list_client_assistant_messages(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[AIAssistantMessage]:
    await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(AIAssistantMessage)
        .where(AIAssistantMessage.client_id == client_id)
        .order_by(AIAssistantMessage.created_at)
        .limit(200)
    )
    return list(result.scalars().all())
