import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"  # cheap embedding model — deliberate cost choice

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def embed_text(text: str) -> list[float] | None:
    """Returns None (graceful skip) if no API key is set, matching app/ai/client.py's
    no-key posture — callers should skip ingestion/retrieval entirely rather than
    fail loudly."""
    client = _get_client()
    if client is None:
        return None
    try:
        response = await client.embeddings.create(model=EMBEDDING_MODEL, input=text)
        return response.data[0].embedding
    except Exception:
        logger.exception("OpenAI embedding generation failed")
        return None


def chunk_text(text: str, chunk_chars: int = 2000) -> list[str]:
    """Simple fixed-size splitter (~500 tokens/chunk at ~4 chars/token) — no heavy
    NLP dependency needed for this. Splits on paragraph boundaries where possible
    to avoid cutting sentences mid-word."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 > chunk_chars and current:
            chunks.append(current.strip())
            current = para
        else:
            current = f"{current}\n\n{para}" if current else para
    if current.strip():
        chunks.append(current.strip())

    # A single paragraph longer than chunk_chars still needs hard-splitting.
    final: list[str] = []
    for c in chunks:
        if len(c) <= chunk_chars:
            final.append(c)
        else:
            for i in range(0, len(c), chunk_chars):
                final.append(c[i : i + chunk_chars])
    return final
