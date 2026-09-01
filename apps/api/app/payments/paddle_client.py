"""Thin wrapper around the Paddle Billing REST API — raw httpx calls, no SDK
dependency (matches this codebase's existing convention, see integrations.py's
four OAuth providers). Server-side operations only: subscriptions can't be
created directly via Paddle's API (only via a completed checkout or a manually
issued invoice), so there's deliberately no create_subscription here."""

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return "https://sandbox-api.paddle.com" if settings.paddle_environment == "sandbox" else "https://api.paddle.com"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.paddle_api_key}",
        "Content-Type": "application/json",
    }


async def _request(method: str, path: str, json: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as http:
        resp = await http.request(method, f"{_base_url()}{path}", headers=_headers(), json=json)
    if resp.status_code >= 400:
        logger.error("Paddle API %s %s failed: %s %s", method, path, resp.status_code, resp.text)
        resp.raise_for_status()
    return resp.json()


async def create_product(name: str, description: str) -> dict[str, Any]:
    body = await _request(
        "POST", "/products", json={"name": name, "tax_category": "saas", "description": description}
    )
    return body["data"]


async def create_price(
    product_id: str,
    description: str,
    amount: str,
    currency_code: str,
    interval: str,
    trial_days: int | None = None,
) -> dict[str, Any]:
    """amount is a string in the currency's lowest denomination — "1900" for
    $19.00, never "19" or "19.00"."""
    payload: dict[str, Any] = {
        "product_id": product_id,
        "description": description,
        "unit_price": {"amount": amount, "currency_code": currency_code},
        "billing_cycle": {"interval": interval, "frequency": 1},
    }
    if trial_days:
        payload["trial_period"] = {"interval": "day", "frequency": trial_days}
    body = await _request("POST", "/prices", json=payload)
    return body["data"]


async def get_price(price_id: str) -> dict[str, Any]:
    body = await _request("GET", f"/prices/{price_id}")
    return body["data"]


async def set_price_country_overrides(price_id: str, overrides: list[dict[str, Any]]) -> dict[str, Any]:
    """Paddle only shows UPI as a checkout payment method for a price whose
    unit_price_overrides includes an India/INR entry AND the buyer's checkout
    address is India — this is how that's configured. Pass the COMPLETE list
    of overrides you want to keep — Paddle replaces the whole list on each
    call, it doesn't merge, so any entry left out here is removed."""
    body = await _request("PATCH", f"/prices/{price_id}", json={"unit_price_overrides": overrides})
    return body["data"]


async def get_subscription(subscription_id: str) -> dict[str, Any]:
    body = await _request("GET", f"/subscriptions/{subscription_id}")
    return body["data"]


async def update_subscription_items(
    subscription_id: str, price_id: str, proration_billing_mode: str = "prorated_immediately"
) -> dict[str, Any]:
    body = await _request(
        "PATCH",
        f"/subscriptions/{subscription_id}",
        json={
            "items": [{"price_id": price_id, "quantity": 1}],
            "proration_billing_mode": proration_billing_mode,
        },
    )
    return body["data"]


async def cancel_subscription(subscription_id: str, effective_from: str = "next_billing_period") -> dict[str, Any]:
    body = await _request(
        "POST", f"/subscriptions/{subscription_id}/cancel", json={"effective_from": effective_from}
    )
    return body["data"]


async def create_portal_session(customer_id: str, subscription_ids: list[str] | None = None) -> dict[str, Any]:
    """Real Paddle-hosted self-service billing — lets a customer update their
    payment method or cancel without us building custom billing screens.
    Response shape confirmed against Paddle's real API docs (not guessed):
    data.urls.general.overview is the general entry point; when
    subscription_ids is given, data.urls.subscriptions[] also carries
    per-subscription update_subscription_payment_method / cancel_subscription
    deep links. Sessions are single-use/short-lived — never cache the URL."""
    payload: dict[str, Any] = {}
    if subscription_ids:
        payload["subscription_ids"] = subscription_ids
    body = await _request("POST", f"/customers/{customer_id}/portal-sessions", json=payload)
    return body["data"]
