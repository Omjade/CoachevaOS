"""One-off script — adds an India/INR unit_price_override to each of the 8
existing Paddle prices (created by seed_paddle_catalog.py). Paddle only shows
UPI as a checkout payment method when the price has an INR override for India
AND the buyer's checkout address is India — no separate Razorpay integration
needed, Paddle handles this natively once the override exists.

Usage (from apps/api, with the venv active):
    python scripts/apply_india_pricing.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.payments import paddle_client  # noqa: E402

# (env var suffix, monthly INR paise, annual INR paise) — matches
# apps/web/lib/pricing.ts's INDIA_PRICING_TIERS exactly.
TIERS = [
    ("STARTER", "49900", "449900"),   # ₹499/mo, ₹4,499/yr
    ("GROWTH", "79900", "719900"),    # ₹799/mo, ₹7,199/yr
    ("SCALE", "149900", "1349900"),   # ₹1,499/mo, ₹13,499/yr
    ("PRO", "299900", "2699900"),     # ₹2,999/mo, ₹26,999/yr
]


async def main() -> None:
    if not settings.paddle_api_key:
        print("PADDLE_API_KEY is not set — add it to .env first.")
        return

    print(f"Applying India/INR price overrides against {settings.paddle_environment} ...\n")

    for suffix, monthly_paise, annual_paise in TIERS:
        monthly_price_id = getattr(settings, f"paddle_price_{suffix.lower()}_monthly")
        annual_price_id = getattr(settings, f"paddle_price_{suffix.lower()}_annual")

        if not monthly_price_id or not annual_price_id:
            print(f"Skipping {suffix} — price IDs not configured yet (run seed_paddle_catalog.py first).")
            continue

        await paddle_client.set_price_country_overrides(
            monthly_price_id,
            [{"country_codes": ["IN"], "unit_price": {"amount": monthly_paise, "currency_code": "INR"}}],
        )
        print(f"{suffix} monthly ({monthly_price_id}): INR override set to {int(monthly_paise) / 100:.2f}")

        await paddle_client.set_price_country_overrides(
            annual_price_id,
            [{"country_codes": ["IN"], "unit_price": {"amount": annual_paise, "currency_code": "INR"}}],
        )
        print(f"{suffix} annual ({annual_price_id}): INR override set to {int(annual_paise) / 100:.2f}")

    print("\nDone. Indian buyers checking out (address = India) will now see INR pricing and UPI as a payment option.")


if __name__ == "__main__":
    asyncio.run(main())
