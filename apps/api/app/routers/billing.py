import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_platform_subscription as fetch_platform_subscription
from app.deps import require_active_coach, require_coach
from app.models.billing import Invoice
from app.models.clients import Client
from app.models.enums import ClientStatus, SubscriptionStatus, SubscriptionTier
from app.models.users import User
from app.schemas.billing import (
    ClientBillingOut,
    InvoiceCreate,
    InvoiceOut,
    PlatformSubscriptionOut,
    SubscriptionUpdate,
)
from app.utils.time import utcnow

router = APIRouter(tags=["billing"])

TIER_CLIENT_LIMITS: dict[SubscriptionTier, int | None] = {
    SubscriptionTier.starter: 15,
    SubscriptionTier.growth: 30,
    SubscriptionTier.scale: 60,
    SubscriptionTier.pro: 100,
    SubscriptionTier.enterprise: None,
}


async def _active_client_count(db: AsyncSession, coach_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Client).where(
            Client.coach_id == coach_id, Client.status == ClientStatus.active
        )
    )
    return result.scalar_one()


def _compute_status(valid_until: date | None) -> str:
    if valid_until is None:
        return "not_set"
    days_left = (valid_until - utcnow().date()).days
    if days_left < 0:
        return "overdue"
    if days_left <= 3:
        return "renewal_due"
    return "active"


async def _get_owned_client(db: AsyncSession, coach: User, client_id: uuid.UUID) -> Client:
    client = await db.get(Client, client_id)
    if client is None or client.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return client


@router.get("/clients/{client_id}/billing", response_model=ClientBillingOut)
async def get_client_billing(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientBillingOut:
    client = await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(Invoice).where(Invoice.client_id == client_id).order_by(Invoice.due_date.desc())
    )
    invoices = list(result.scalars().all())
    return ClientBillingOut(
        subscription_valid_from=client.subscription_valid_from,
        subscription_valid_until=client.subscription_valid_until,
        status=_compute_status(client.subscription_valid_until),
        billing_currency=client.billing_currency,
        invoices=invoices,
    )


@router.patch("/clients/{client_id}/subscription", response_model=ClientBillingOut)
async def update_client_subscription(
    client_id: uuid.UUID,
    body: SubscriptionUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientBillingOut:
    client = await _get_owned_client(db, coach, client_id)
    client.subscription_valid_until = body.subscription_valid_until
    client.subscription_valid_from = body.subscription_valid_from
    await db.commit()

    result = await db.execute(
        select(Invoice).where(Invoice.client_id == client_id).order_by(Invoice.due_date.desc())
    )
    invoices = list(result.scalars().all())
    return ClientBillingOut(
        subscription_valid_from=client.subscription_valid_from,
        subscription_valid_until=client.subscription_valid_until,
        status=_compute_status(client.subscription_valid_until),
        billing_currency=client.billing_currency,
        invoices=invoices,
    )


@router.post(
    "/clients/{client_id}/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED
)
async def add_invoice(
    client_id: uuid.UUID,
    body: InvoiceCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Invoice:
    client = await _get_owned_client(db, coach, client_id)
    invoice = Invoice(
        client_id=client_id,
        amount=body.amount,
        currency=body.currency or client.billing_currency or "USD",
        due_date=body.due_date,
        paid=False,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}/paid", response_model=InvoiceOut)
async def toggle_invoice_paid(
    invoice_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> Invoice:
    invoice = await db.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    await _get_owned_client(db, coach, invoice.client_id)
    invoice.paid = not invoice.paid
    invoice.paid_at = utcnow() if invoice.paid else None
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/coach/subscription", response_model=PlatformSubscriptionOut)
async def get_platform_subscription(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> PlatformSubscriptionOut:
    sub = await fetch_platform_subscription(db, coach.id)
    if sub is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No subscription found")

    if sub.status == SubscriptionStatus.trialing and utcnow() > sub.trial_ends_at:
        sub.status = SubscriptionStatus.trial_expired
        await db.commit()

    active_count = await _active_client_count(db, coach.id)

    return PlatformSubscriptionOut(
        tier=sub.tier,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at,
        current_period_end=sub.current_period_end,
        client_limit=sub.client_limit,
        active_client_count=active_count,
        provider=sub.provider,
        currency=sub.currency,
        billing_cycle=sub.billing_cycle,
        cancel_at_period_end=sub.cancel_at_period_end,
        grace_period_ends_at=sub.grace_period_ends_at,
    )


# `select-plan` (free, no-payment activation) is retired — real checkout now
# happens via POST /billing/paddle/checkout-token (app/routers/payments_paddle.py),
# followed by a Paddle-hosted checkout that only ever activates a subscription
# through a verified webhook, never a direct client request.
