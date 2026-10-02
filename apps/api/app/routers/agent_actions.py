import html
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_coach
from app.email import send_email
from app.models.ai import AgentAction
from app.models.automation import CoachAutomationSettings
from app.models.clients import Client
from app.models.enums import MessageType
from app.models.messaging import Thread
from app.models.users import User
from app.routers.threads import _create_and_broadcast
from app.schemas.agent_actions import AgentActionApproveRequest, AgentActionOut
from app.utils.time import utcnow

router = APIRouter(prefix="/agent-actions", tags=["agent-actions"])


def _to_out(action: AgentAction, client_name: str) -> AgentActionOut:
    return AgentActionOut(
        id=action.id,
        client_id=action.client_id,
        client_name=client_name,
        kind=action.kind,
        draft_message=action.draft_message,
        status=action.status,
        created_at=action.created_at,
        sent_at=action.sent_at,
    )


async def _get_owned_action(db: AsyncSession, coach: User, action_id: uuid.UUID) -> AgentAction:
    action = await db.get(AgentAction, action_id)
    if action is None or action.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action not found")
    return action


@router.get("/pending", response_model=list[AgentActionOut])
async def list_pending_actions(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[AgentActionOut]:
    """The unified Approvals inbox — every agent's drafted action waiting on
    a one-tap decision, regardless of which agent produced it (kind)."""
    result = await db.execute(
        select(AgentAction, User)
        .join(Client, Client.id == AgentAction.client_id)
        .join(User, User.id == Client.user_id)
        .where(AgentAction.coach_id == coach.id, AgentAction.status == "pending")
        .order_by(AgentAction.created_at.desc())
    )
    return [_to_out(action, user.name) for action, user in result.all()]


@router.get("/activity", response_model=list[AgentActionOut])
async def list_activity(
    limit: int = 100,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[AgentActionOut]:
    """Everything an agent has done or proposed, any status, newest first —
    the "Your AI Team" tab's Activity section."""
    result = await db.execute(
        select(AgentAction, User)
        .join(Client, Client.id == AgentAction.client_id)
        .join(User, User.id == Client.user_id)
        .where(AgentAction.coach_id == coach.id)
        .order_by(AgentAction.created_at.desc())
        .limit(min(limit, 500))
    )
    return [_to_out(action, user.name) for action, user in result.all()]


@router.post("/{action_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_action(
    action_id: uuid.UUID,
    body: AgentActionApproveRequest,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    action = await _get_owned_action(db, coach, action_id)
    if action.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This action has already been handled")

    final_message = body.edited_message if body.edited_message else action.draft_message

    client = await db.get(Client, action.client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    thread_result = await db.execute(select(Thread).where(Thread.client_id == client.id))
    thread = thread_result.scalar_one_or_none()
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No chat thread for this client yet")

    await _create_and_broadcast(
        db, thread, coach, type_=MessageType.text, body=final_message, media_url=None, is_agent_sent=True
    )

    automation = await db.get(CoachAutomationSettings, coach.id)
    client_user = await db.get(User, client.user_id) if client.user_id else None
    if automation is not None and automation.retention_agent_enabled and client_user is not None:
        await send_email(
            client_user.email,
            f"A note from {html.escape(coach.name)}",
            f"<p>{html.escape(final_message)}</p>",
        )

    action.draft_message = final_message
    action.status = "approved"
    action.sent_at = utcnow()
    await db.commit()


@router.post("/{action_id}/skip", status_code=status.HTTP_204_NO_CONTENT)
async def skip_action(
    action_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    action = await _get_owned_action(db, coach, action_id)
    if action.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This action has already been handled")
    action.status = "skipped"
    await db.commit()
