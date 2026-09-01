import json
import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_platform_subscription, require_coach
from app.models.billing import PaymentWebhookEvent, PlatformSubscription, RegionSignalLog
from app.models.enums import PaymentProvider, SubscriptionStatus, SubscriptionTier
from app.models.users import User
from app.payments import paddle_client
from app.payments.geo import client_ip
from app.payments.paddle_ips import get_allowed_cidrs, is_ip_allowed
from app.payments.paddle_webhooks import verify_signature
from app.payments.pricing import price_id_for, tier_and_cycle_for_price_id
from app.payments.region import resolve_region
from app.rate_limit import limiter
from app.routers.billing import TIER_CLIENT_LIMITS, _active_client_count
from app.schemas.payments import ChangePlanRequest, CheckoutTokenOut, CheckoutTokenRequest, PortalSessionOut
from app.utils.time import utcnow

logger = logging.getLogger(__name__)

# Paddle-specific endpoints (checkout token, webhook).
router = APIRouter(prefix="/billing/paddle", tags=["payments"])

# Provider-agnostic endpoints — dispatch on PlatformSubscription.provider.
# Razorpay's branch of each lands in Phase 31.
subscription_router = APIRouter(prefix="/billing/subscription", tags=["payments"])

# Paddle's own subscription/transaction statuses mapped onto ours.
_PADDLE_STATUS_MAP = {
    "trialing": SubscriptionStatus.trialing,
    "active": SubscriptionStatus.active,
    "past_due": SubscriptionStatus.past_due,
    "paused": SubscriptionStatus.canceled,
    "canceled": SubscriptionStatus.canceled,
}


@router.post("/checkout-token", response_model=CheckoutTokenOut)
async def get_checkout_token(
    body: CheckoutTokenRequest,
    request: Request,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CheckoutTokenOut:
    if not settings.paddle_api_key:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Paddle isn't configured yet")
    if body.tier == SubscriptionTier.enterprise:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enterprise is a manual sales process — contact us.")

    price_id = price_id_for(body.tier, body.cycle)
    if price_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That plan isn't available yet")

    resolution = await resolve_region(db, coach.id, request)
    db.add(
        RegionSignalLog(
            coach_id=coach.id,
            context="checkout_token",
            declared_country_code=resolution.country_code if resolution.source == "declared" else None,
            ip_country_code=resolution.ip_country_code,
            mismatch=resolution.mismatch,
        )
    )

    # Real, server-enforced friction (not just a frontend confirm dialog that a
    # determined caller could skip): requesting India pricing with no signal
    # supporting it requires one explicit confirm-and-retry. This doesn't and
    # can't guarantee the coach is actually in India — Paddle's own checkout
    # still requires a real India address for the INR price override to apply
    # at all — it only deters a casual "let me just try India pricing" click.
    region_disagrees = body.region == "india" and resolution.country_code != "IN"
    if region_disagrees and not body.confirm_region_mismatch:
        await db.commit()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Your account isn't set up as India-based. India pricing is for India-based coaches — "
            "confirm to continue anyway.",
        )

    await db.commit()
    existing_sub = await get_platform_subscription(db, coach.id)
    return CheckoutTokenOut(
        price_id=price_id,
        client_side_token=settings.paddle_client_side_token,
        environment=settings.paddle_environment,
        customer_email=coach.email,
        custom_data={"coach_id": str(coach.id)},
        resolved_country_code=resolution.country_code,
        region_mismatch=region_disagrees,
        processor_customer_id=existing_sub.processor_customer_id if existing_sub else None,
    )


async def _dedupe_or_none(db: AsyncSession, event_id: str, event_type: str, payload: dict) -> bool:
    """Returns True if this event was already processed (caller should stop),
    False if it's new (row is now inserted and caller should proceed)."""
    try:
        db.add(
            PaymentWebhookEvent(
                provider=PaymentProvider.paddle, event_id=event_id, event_type=event_type, payload_json=payload
            )
        )
        await db.flush()
        return False
    except IntegrityError:
        await db.rollback()
        return True


async def _find_subscription_by_coach(db: AsyncSession, coach_id: str) -> PlatformSubscription | None:
    try:
        return await get_platform_subscription(db, uuid.UUID(coach_id))
    except ValueError:
        return None


@router.post("/webhook", status_code=status.HTTP_200_OK)
@limiter.exempt
async def paddle_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.paddle_webhook_ip_allowlist_enabled:
        ip = (
            client_ip(request.headers.get("x-forwarded-for"), request.client.host if request.client else None)
            if settings.paddle_webhook_trust_proxy_header
            else (request.client.host if request.client else None)
        )
        cidrs = await get_allowed_cidrs()
        # cidrs is None only when the allowlist has never been fetched
        # successfully — signature verification below still guards the
        # endpoint, so this never blocks solely on a fetch failure.
        if cidrs is not None and not is_ip_allowed(ip, cidrs):
            logger.warning("Rejected Paddle webhook from disallowed IP %s", ip)
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Source not allowed")

    raw_body = await request.body()
    if not verify_signature(raw_body, request.headers.get("Paddle-Signature"), settings.paddle_webhook_secret):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid signature")

    event = json.loads(raw_body)
    event_id = event.get("event_id", "")
    event_type = event.get("event_type", "")
    data = event.get("data", {})

    if await _dedupe_or_none(db, event_id, event_type, event):
        return {"ok": True}

    if event_type in ("subscription.created", "subscription.updated"):
        coach_id = (data.get("custom_data") or {}).get("coach_id")
        if coach_id:
            sub = await _find_subscription_by_coach(db, coach_id)
            if sub is not None:
                items = data.get("items") or []
                price_id = items[0]["price"]["id"] if items else None
                tier_cycle = tier_and_cycle_for_price_id(price_id) if price_id else None

                sub.provider = PaymentProvider.paddle
                sub.processor_customer_id = data.get("customer_id")
                sub.processor_subscription_id = data.get("id")
                sub.processor_price_id = price_id
                sub.status = _PADDLE_STATUS_MAP.get(data.get("status", ""), sub.status)
                currency_code = data.get("currency_code") or (items[0].get("price", {}).get("unit_price", {}).get("currency_code") if items else None)
                if currency_code:
                    sub.currency = currency_code.lower()
                if tier_cycle:
                    sub.tier, sub.billing_cycle = tier_cycle
                    sub.client_limit = TIER_CLIENT_LIMITS.get(sub.tier)
                if data.get("current_billing_period"):
                    ends_at = data["current_billing_period"].get("ends_at")
                    if ends_at:
                        sub.current_period_end = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
                # A scheduled cancellation is not a terminal state — the
                # subscription stays active/trialing until Paddle actually
                # sends subscription.canceled once the period ends.
                sub.cancel_at_period_end = bool(data.get("scheduled_change"))
                if sub.status != SubscriptionStatus.past_due:
                    sub.grace_period_ends_at = None

    elif event_type == "subscription.canceled":
        coach_id = (data.get("custom_data") or {}).get("coach_id")
        if coach_id:
            sub = await _find_subscription_by_coach(db, coach_id)
            if sub is not None:
                sub.status = SubscriptionStatus.canceled

    elif event_type == "transaction.payment_failed":
        coach_id = (data.get("custom_data") or {}).get("coach_id")
        if coach_id:
            sub = await _find_subscription_by_coach(db, coach_id)
            if sub is not None:
                sub.status = SubscriptionStatus.past_due
                sub.grace_period_ends_at = utcnow() + timedelta(days=settings.payment_grace_period_days)

    elif event_type == "transaction.completed":
        coach_id = (data.get("custom_data") or {}).get("coach_id")
        if coach_id:
            sub = await _find_subscription_by_coach(db, coach_id)
            if sub is not None and sub.status == SubscriptionStatus.past_due:
                sub.status = SubscriptionStatus.active
                sub.grace_period_ends_at = None

    await db.commit()
    return {"ok": True}


@router.get("/portal-session", response_model=PortalSessionOut)
async def get_portal_session(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> PortalSessionOut:
    """Real Paddle-hosted self-service billing (update payment method, view
    invoices, cancel) — a genuine gap this app had zero UI for otherwise.
    Sessions are single-use/short-lived per Paddle's own docs, so this is
    generated fresh on every click, never cached or stored."""
    sub = await get_platform_subscription(db, coach.id)
    if sub is None or sub.processor_customer_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No billing account yet")
    if sub.provider != PaymentProvider.paddle:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "This provider isn't supported yet")

    subscription_ids = [sub.processor_subscription_id] if sub.processor_subscription_id else None
    data = await paddle_client.create_portal_session(sub.processor_customer_id, subscription_ids)
    url = data.get("urls", {}).get("general", {}).get("overview")
    if not url:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Couldn't open billing management right now")
    return PortalSessionOut(url=url)


@subscription_router.post("/cancel", status_code=status.HTTP_200_OK)
async def cancel_subscription(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> dict:
    """Provider-agnostic entrypoint — Razorpay branch lands in Phase 31. Sets
    cancel-at-period-end rather than canceling immediately; the subscription
    stays active until Paddle's own subscription.canceled webhook confirms
    the period has actually ended."""
    sub = await get_platform_subscription(db, coach.id)
    if sub is None or sub.processor_subscription_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription to cancel")
    if sub.provider != PaymentProvider.paddle:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "This provider isn't supported yet")

    await paddle_client.cancel_subscription(sub.processor_subscription_id, effective_from="next_billing_period")
    sub.cancel_at_period_end = True
    await db.commit()
    return {"ok": True}


@subscription_router.patch("/plan", status_code=status.HTTP_200_OK)
async def change_plan(
    body: ChangePlanRequest, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> dict:
    sub = await get_platform_subscription(db, coach.id)
    if sub is None or sub.processor_subscription_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription")
    if sub.provider != PaymentProvider.paddle:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "This provider isn't supported yet")
    if body.tier == SubscriptionTier.enterprise:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enterprise is a manual sales process — contact us.")

    new_limit = TIER_CLIENT_LIMITS.get(body.tier)
    if new_limit is not None:
        active_count = await _active_client_count(db, coach.id)
        if active_count > new_limit:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"You have {active_count} active clients; that plan allows {new_limit} — "
                "pause or offboard clients first.",
            )

    price_id = price_id_for(body.tier, body.cycle)
    if price_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That plan isn't available yet")

    await paddle_client.update_subscription_items(
        sub.processor_subscription_id, price_id, proration_billing_mode="prorated_immediately"
    )
    sub.tier = body.tier
    sub.billing_cycle = body.cycle
    sub.processor_price_id = price_id
    sub.client_limit = new_limit
    await db.commit()
    return {"ok": True}
