import json
import logging
import uuid

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None

DEFAULT_MAX_TOKENS = 500


def _get_client() -> AsyncOpenAI | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


PLACEHOLDER_NOTICE = (
    "AI features aren't active yet — add OPENAI_API_KEY in apps/api/.env to enable this."
)


async def _log_usage(
    db: AsyncSession | None, coach_id: uuid.UUID | None, feature: str | None, tokens_used: int
) -> None:
    """Best-effort usage logging for cost visibility and per-feature quota checks
    (see app/ai/limits.py). Only called after a real API call, never on cache/placeholder
    paths. Silently skipped when the caller doesn't pass db/coach_id/feature — most
    existing single-shot features don't need per-call logging, only the newer
    quota-sensitive ones (program drafts, onboarding drafts, etc.) opt in."""
    if db is None or coach_id is None or feature is None:
        return
    from app.models.ai import AIUsageLog

    db.add(AIUsageLog(coach_id=coach_id, feature=feature, tokens_used=tokens_used))
    await db.commit()


async def generate_text(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    *,
    db: AsyncSession | None = None,
    coach_id: uuid.UUID | None = None,
    feature: str | None = None,
) -> str:
    """Plain-text completion. Returns a clearly-labeled placeholder if no API key is set,
    rather than failing, so the rest of the app stays usable while a key is pending."""
    client = _get_client()
    if client is None:
        return PLACEHOLDER_NOTICE

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        if response.usage:
            await _log_usage(db, coach_id, feature, response.usage.total_tokens)
        return response.choices[0].message.content or ""
    except Exception:
        logger.exception("OpenAI text generation failed")
        return "AI is temporarily unavailable — please try again shortly."


async def generate_json(
    system_prompt: str,
    user_prompt: str,
    fallback: dict,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    *,
    db: AsyncSession | None = None,
    coach_id: uuid.UUID | None = None,
    feature: str | None = None,
) -> dict:
    """JSON-mode completion for structured outputs (session notes, risk flags, etc).
    Returns `fallback` (clearly labeled as unavailable) on missing key or any failure."""
    client = _get_client()
    if client is None:
        return fallback

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        if response.usage:
            await _log_usage(db, coach_id, feature, response.usage.total_tokens)
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        logger.exception("OpenAI JSON generation failed")
        return fallback
