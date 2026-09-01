from app.ai.client import generate_json
from app.ai.context import build_onboarding_context
from app.ai.prompts import onboarding_draft_prompt
from app.models.clients import Client
from app.models.users import User
from app.schemas.ai import OnboardingDraftOut
from sqlalchemy.ext.asyncio import AsyncSession


async def draft_onboarding(
    db: AsyncSession, coach: User, client: Client, user: User
) -> OnboardingDraftOut:
    """Shared by the coach-triggered POST /ai/clients/{id}/onboarding-draft
    endpoint and the auto-onboarding automation recipe (app/routers/clients.py's
    submit_my_intake) — one implementation, one prompt call site."""
    context = await build_onboarding_context(db, client)
    system, user_prompt = onboarding_draft_prompt(user.name, coach.name, context)
    fallback = {
        "welcome_message": f"Welcome, {user.name}! Looking forward to working together.",
        "suggested_goals": [],
        "suggested_cadence": "Check in weekly to start.",
    }
    payload = await generate_json(
        system, user_prompt, fallback, max_tokens=500, db=db, coach_id=coach.id, feature="onboarding_draft"
    )
    return OnboardingDraftOut(
        welcome_message=payload.get("welcome_message", fallback["welcome_message"]),
        suggested_goals=payload.get("suggested_goals", []),
        suggested_cadence=payload.get("suggested_cadence", fallback["suggested_cadence"]),
    )
