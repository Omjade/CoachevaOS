from app.config import settings
from app.models.enums import BillingCycle, SubscriptionTier

# Enterprise is manual-sales-only — deliberately has no price ID, self-serve
# checkout must never be offered for it (guarded explicitly in
# payments_paddle.py's checkout-token and change-plan endpoints).
PADDLE_PRICE_IDS: dict[tuple[SubscriptionTier, BillingCycle], str] = {
    (SubscriptionTier.starter, BillingCycle.monthly): settings.paddle_price_starter_monthly,
    (SubscriptionTier.starter, BillingCycle.annual): settings.paddle_price_starter_annual,
    (SubscriptionTier.growth, BillingCycle.monthly): settings.paddle_price_growth_monthly,
    (SubscriptionTier.growth, BillingCycle.annual): settings.paddle_price_growth_annual,
    (SubscriptionTier.scale, BillingCycle.monthly): settings.paddle_price_scale_monthly,
    (SubscriptionTier.scale, BillingCycle.annual): settings.paddle_price_scale_annual,
    (SubscriptionTier.pro, BillingCycle.monthly): settings.paddle_price_pro_monthly,
    (SubscriptionTier.pro, BillingCycle.annual): settings.paddle_price_pro_annual,
}


def price_id_for(tier: SubscriptionTier, cycle: BillingCycle) -> str | None:
    return PADDLE_PRICE_IDS.get((tier, cycle)) or None


def tier_and_cycle_for_price_id(price_id: str) -> tuple[SubscriptionTier, BillingCycle] | None:
    for key, value in PADDLE_PRICE_IDS.items():
        if value and value == price_id:
            return key
    return None
