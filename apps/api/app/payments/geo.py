import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def client_ip(forwarded_for: str | None, direct_ip: str | None) -> str | None:
    """Prefer X-Forwarded-For's first hop (the real client, behind any proxy)
    over the raw connection IP, which is a proxy's address in production."""
    if forwarded_for:
        first = forwarded_for.split(",")[0].strip()
        if first:
            return first
    return direct_ip


async def lookup_country(ip: str | None) -> str | None:
    """Best-effort ISO-2 country lookup. Never raises, never blocks the caller —
    on any failure (missing IP, network error, rate limit, malformed response)
    this returns None, and callers default to non-India/Paddle/USD."""
    if not settings.geo_lookup_enabled or not ip:
        return None
    try:
        async with httpx.AsyncClient(timeout=2.0) as http:
            resp = await http.get(f"https://ipapi.co/{ip}/country/")
        if resp.status_code != 200:
            return None
        code = resp.text.strip().upper()
        return code if len(code) == 2 else None
    except Exception:
        logger.warning("Geo lookup failed for ip=%s", ip, exc_info=True)
        return None
