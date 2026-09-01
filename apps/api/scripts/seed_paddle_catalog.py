"""One-off script — creates the CoachevaOS product catalog in Paddle (4
self-serve tiers x monthly/annual = 8 prices; Enterprise is manual-sales-only
and deliberately has no Paddle product). Run once per Paddle environment
(sandbox first, then live later in Phase 31's go-live step) after setting
PADDLE_API_KEY and PADDLE_ENVIRONMENT in .env.

Usage (from apps/api, with the venv active):
    python scripts/seed_paddle_catalog.py

Paste the printed PADDLE_PRICE_* values into .env afterward.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.payments import paddle_client  # noqa: E402

# (tier key, display name, monthly USD price in cents, annual USD price in cents)
# Annual = 2 months free on every tier, matching the approved pricing plan.
TIERS = [
    ("starter", "Starter", "1900", "19000"),
    ("growth", "Growth", "2900", "29000"),
    ("scale", "Scale", "4900", "49000"),
    ("pro", "Pro", "9900", "99000"),
]

TRIAL_DAYS = 14


async def main() -> None:
    if not settings.paddle_api_key:
        print("PADDLE_API_KEY is not set — add it to .env first.")
        return

    print(f"Seeding Paddle catalog against {settings.paddle_environment} ...\n")
    results: list[dict[str, str]] = []

    for key, name, monthly_cents, annual_cents in TIERS:
        product = await paddle_client.create_product(
            name=f"CoachevaOS {name}", description=f"CoachevaOS {name} plan"
        )
        product_id = product["id"]
        print(f"Product {name}: {product_id}")

        monthly = await paddle_client.create_price(
            product_id, f"{name} — Monthly", monthly_cents, "USD", "month", trial_days=TRIAL_DAYS
        )
        annual = await paddle_client.create_price(
            product_id, f"{name} — Annual", annual_cents, "USD", "year", trial_days=TRIAL_DAYS
        )
        print(f"  Monthly price: {monthly['id']} (${int(monthly_cents) / 100:.2f}/mo)")
        print(f"  Annual price:  {annual['id']} (${int(annual_cents) / 100:.2f}/yr)")

        results.append(
            {
                "tier": key,
                "product_id": product_id,
                "monthly_price_id": monthly["id"],
                "annual_price_id": annual["id"],
            }
        )

    print("\n--- Paste into .env ---\n")
    for r in results:
        env_key = r["tier"].upper()
        print(f"PADDLE_PRICE_{env_key}_MONTHLY={r['monthly_price_id']}")
        print(f"PADDLE_PRICE_{env_key}_ANNUAL={r['annual_price_id']}")


if __name__ == "__main__":
    asyncio.run(main())
