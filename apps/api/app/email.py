import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str) -> bool:
    """Best-effort transactional email via Resend's REST API — no SDK
    dependency, same raw-httpx pattern this codebase already uses for every
    other third-party integration (Zoom, Calendly, Cal.com). Returns False
    and no-ops (doesn't raise) when RESEND_API_KEY is unset, so every call
    site works identically before the key is configured, matching
    app/ai/client.py's truthiness-gated _get_client() pattern. A failed send
    never blocks or rolls back the caller's own transaction — email is
    always a side effect, never the primary outcome of the action that
    triggered it."""
    if not settings.resend_api_key:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            res = await http.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": settings.resend_from_email,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
        if res.status_code not in (200, 201):
            logger.warning("Resend send failed: %s %s", res.status_code, res.text[:500])
            return False
        return True
    except httpx.HTTPError:
        logger.exception("Resend send raised")
        return False
