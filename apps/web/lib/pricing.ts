import { SubscriptionTier } from "@/lib/api";

export interface PricingTier {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  blurb: string;
  // Mirrors the backend's TIER_CLIENT_LIMITS exactly (apps/api/app/routers/billing.py)
  // — null means unlimited/manual (Enterprise). Used to compute which plan
  // actually fits a coach's current active-client count, not just for display.
  clientLimit: number | null;
  // "Why you need to pay" — what's included at this tier, shown on the public
  // pricing page. Same copy across currencies; only the price differs.
  features: string[];
}

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  trial: [],
  starter: [
    "Up to 15 clients",
    "Client portal & chat",
    "Forms & intake",
    "Calendar booking",
    "AI daily briefing",
  ],
  growth: [
    "Up to 30 clients",
    "Everything in Starter",
    "AI program generator",
    "Custom fields",
  ],
  scale: [
    "Up to 60 clients",
    "Everything in Growth",
    "AI client insights & churn alerts",
    "CSV/Excel client import",
  ],
  pro: [
    "100+ clients",
    "Everything in Scale",
    "Priority support",
    "Advanced analytics",
  ],
  enterprise: [
    "150+ clients or multi-coach",
    "Dedicated onboarding",
    "Custom contract",
  ],
};

// Illustrative marketing copy for the public pricing page — not the source of
// truth for an actual charge. The real amount at checkout comes from Paddle's
// own Paddle.PricePreview() response (see components/payments/PaddleCheckout.tsx),
// never computed or re-formatted here.
export const GLOBAL_PRICING_TIERS: PricingTier[] = [
  { tier: "starter", name: "Starter", monthlyPrice: "$19/mo", annualPrice: "$190/yr", blurb: "Up to 15 clients", clientLimit: 15, features: TIER_FEATURES.starter },
  { tier: "growth", name: "Growth", monthlyPrice: "$29/mo", annualPrice: "$290/yr", blurb: "Up to 30 clients", clientLimit: 30, features: TIER_FEATURES.growth },
  { tier: "scale", name: "Scale", monthlyPrice: "$49/mo", annualPrice: "$490/yr", blurb: "Up to 60 clients", clientLimit: 60, features: TIER_FEATURES.scale },
  { tier: "pro", name: "Pro", monthlyPrice: "$99/mo", annualPrice: "$990/yr", blurb: "100+ clients", clientLimit: 100, features: TIER_FEATURES.pro },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Contact us",
    annualPrice: "Contact us",
    blurb: "150+ clients or multi-coach",
    clientLimit: null,
    features: TIER_FEATURES.enterprise,
  },
];

export const INDIA_PRICING_TIERS: PricingTier[] = [
  { tier: "starter", name: "Starter", monthlyPrice: "₹499/mo", annualPrice: "₹4,499/yr", blurb: "Up to 15 clients", clientLimit: 15, features: TIER_FEATURES.starter },
  { tier: "growth", name: "Growth", monthlyPrice: "₹799/mo", annualPrice: "₹7,199/yr", blurb: "Up to 30 clients", clientLimit: 30, features: TIER_FEATURES.growth },
  { tier: "scale", name: "Scale", monthlyPrice: "₹1,499/mo", annualPrice: "₹13,499/yr", blurb: "Up to 60 clients", clientLimit: 60, features: TIER_FEATURES.scale },
  { tier: "pro", name: "Pro", monthlyPrice: "₹2,999/mo", annualPrice: "₹26,999/yr", blurb: "100+ clients", clientLimit: 100, features: TIER_FEATURES.pro },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Contact us",
    annualPrice: "Contact us",
    blurb: "150+ clients or multi-coach",
    clientLimit: null,
    features: TIER_FEATURES.enterprise,
  },
];

// Backward-compatible default for the public marketing page (no region signal
// available at build time for a static/SSR page) — same values as GLOBAL.
export const PRICING_TIERS = GLOBAL_PRICING_TIERS;

// The cheapest plan whose client_limit still covers the coach's current
// active-client count — never recommends a tier that would immediately be
// over capacity. Falls through to Enterprise once every paid tier's cap is
// exceeded (matches the spec: 150+/multi-coach is manual-sales-only).
export function recommendedTierFor(activeClientCount: number, plans: PricingTier[]): SubscriptionTier {
  const fitting = plans.find((p) => p.clientLimit !== null && activeClientCount <= p.clientLimit);
  return fitting ? fitting.tier : "enterprise";
}
