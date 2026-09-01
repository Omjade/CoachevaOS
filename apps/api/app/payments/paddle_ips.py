"""Paddle's own published webhook-sender IP list (https://api.paddle.com/ips)
is the source of truth and can change without notice, so this never hard-codes
the addresses — it fetches them and keeps an in-process cache, refreshed on a
TTL. This is a defense-in-depth layer on top of paddle_webhooks.verify_signature
(the real security boundary): if the list can't be fetched yet and nothing is
cached, callers should fail open on the IP check alone (never reject solely for
"couldn't fetch the list") and rely on signature verification, since blocking
every webhook because Paddle's own IP-list endpoint had a blip would be a
self-inflicted outage, not a security win."""

import ipaddress
import logging
import time

import httpx

logger = logging.getLogger(__name__)

PADDLE_IPS_URL = "https://api.paddle.com/ips"
_CACHE_TTL_SECONDS = 6 * 60 * 60  # refresh a few times a day; the list rarely changes

_cache: list[str] | None = None
_cache_fetched_at: float = 0.0


async def _fetch_cidrs() -> list[str] | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            resp = await http.get(PADDLE_IPS_URL)
        resp.raise_for_status()
        cidrs = resp.json()["data"]["ipv4_cidrs"]
        if not isinstance(cidrs, list) or not cidrs:
            raise ValueError("empty or malformed ipv4_cidrs")
        return cidrs
    except Exception:
        logger.warning("Failed to fetch Paddle's webhook IP list from %s", PADDLE_IPS_URL, exc_info=True)
        return None


async def get_allowed_cidrs() -> list[str] | None:
    """Returns the current list of Paddle webhook-sender CIDRs, refreshing
    from api.paddle.com when the cache is missing or stale. Returns None only
    when nothing has ever been successfully fetched — callers must treat that
    as "can't evaluate the allowlist yet," not as "reject everything.\""""
    global _cache, _cache_fetched_at
    stale = (time.monotonic() - _cache_fetched_at) > _CACHE_TTL_SECONDS
    if _cache is None or stale:
        fresh = await _fetch_cidrs()
        if fresh is not None:
            _cache = fresh
            _cache_fetched_at = time.monotonic()
        elif _cache is None:
            return None
        # else: fetch failed but we still have a (stale) cached list — keep
        # using it rather than treat a transient fetch failure as "block
        # everything."
    return _cache


def is_ip_allowed(ip: str | None, cidrs: list[str]) -> bool:
    if not ip:
        return False
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    for cidr in cidrs:
        try:
            if addr in ipaddress.ip_network(cidr, strict=False):
                return True
        except ValueError:
            continue
    return False
