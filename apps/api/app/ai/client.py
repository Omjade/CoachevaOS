import json
import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


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


async def generate_text(system_prompt: str, user_prompt: str) -> str:
    """Plain-text completion. Returns a clearly-labeled placeholder if no API key is set,
    rather than failing, so the rest of the app stays usable while a key is pending."""
    client = _get_client()
    if client is None:
        return PLACEHOLDER_NOTICE

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""
    except Exception:
        logger.exception("OpenAI text generation failed")
        return "AI is temporarily unavailable — please try again shortly."


async def generate_json(system_prompt: str, user_prompt: str, fallback: dict) -> dict:
    """JSON-mode completion for structured outputs (session notes, risk flags, etc).
    Returns `fallback` (clearly labeled as unavailable) on missing key or any failure."""
    client = _get_client()
    if client is None:
        return fallback

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        logger.exception("OpenAI JSON generation failed")
        return fallback
