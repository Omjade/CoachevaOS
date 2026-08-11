import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_platform_subscription as fetch_platform_subscription
from app.deps import require_active_coach, require_coach
from app.models.billing import Invoice
from app.models.clients import Client
from app.models.enums import SubscriptionStatus, SubscriptionTier
from app.models.users import User
from app.schemas.billing import (
    ClientBillingOut,
    InvoiceCreate,
    InvoiceOut,
    PlatformSubscriptionOut,
    SelectPlanRequest,
    SubscriptionUpdate,
)
from app.utils.time import utcnow

router = APIRouter(tags=["billing"])

TIER_CLIENT_LIMITS: dict[SubscriptionTier, int | None] = {
    SubscriptionTier.starter: 49,
    SubscriptionTier.growth: 100,
    SubscriptionTier.scale: 200,
    SubscriptionTier.enterprise: None,
}


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
        subscription_valid_until=client.subscription_valid_until,
        status=_compute_status(client.subscription_valid_until),
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
    await db.commit()

    result = await db.execute(
        select(Invoice).where(Invoice.client_id == client_id).order_by(Invoice.due_date.desc())
    )
    invoices = list(result.scalars().all())
    return ClientBillingOut(
        subscription_valid_until=client.subscription_valid_until,
        status=_compute_status(client.subscription_valid_until),
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
    await _get_owned_client(db, coach, client_id)
    invoice = Invoice(client_id=client_id, amount=body.amount, due_date=body.due_date, paid=False)
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

    count_result = await db.execute(
        select(func.count()).select_from(Client).where(Client.coach_id == coach.id)
    )
    active_count = count_result.scalar_one()

    return PlatformSubscriptionOut(
        tier=sub.tier,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at,
        current_period_end=sub.current_period_end,
        client_limit=sub.client_limit,
        active_client_count=active_count,
    )


@router.post("/coach/subscription/select-plan", response_model=PlatformSubscriptionOut)
async def select_plan(
    body: SelectPlanRequest,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> PlatformSubscriptionOut:
    sub = await fetch_platform_subscription(db, coach.id)
    if sub is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No subscription found")

    sub.tier = body.tier
    sub.status = SubscriptionStatus.active
    sub.client_limit = TIER_CLIENT_LIMITS[body.tier]
    sub.current_period_end = utcnow() + timedelta(days=30)
    await db.commit()

    count_result = await db.execute(
        select(func.count()).select_from(Client).where(Client.coach_id == coach.id)
    )
    active_count = count_result.scalar_one()

    return PlatformSubscriptionOut(
        tier=sub.tier,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at,
        current_period_end=sub.current_period_end,
        client_limit=sub.client_limit,
        active_client_count=active_count,
    )
