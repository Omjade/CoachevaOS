"use client";

import { useEffect, useState } from "react";
import { api, ApiError, PlatformSubscriptionData, SubscriptionTier } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow } from "@/components/ui";

const PLANS: {
  tier: SubscriptionTier;
  name: string;
  price: string;
  blurb: string;
}[] = [
  { tier: "starter", name: "Starter", price: "$29/mo", blurb: "Up to 50 clients" },
  { tier: "growth", name: "Growth", price: "$49/mo", blurb: "Up to 100 clients" },
  { tier: "scale", name: "Scale", price: "$89/mo", blurb: "Up to 200 clients" },
  { tier: "enterprise", name: "Enterprise", price: "Contact us", blurb: "200+ clients" },
];

const STATUS_LABEL: Record<PlatformSubscriptionData["status"], string> = {
  trialing: "Trial",
  active: "Active",
  trial_expired: "Trial expired",
  past_due: "Past due",
  canceled: "Canceled",
};

export default function BillingPage() {
  const [sub, setSub] = useState<PlatformSubscriptionData | null>(null);
  const [selecting, setSelecting] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.getPlatformSubscription().then(setSub).catch(() => {});
  }

  useEffect(refresh, []);

  async function choose(tier: SubscriptionTier) {
    if (tier === "enterprise") return;
    setSelecting(tier);
    setError(null);
    try {
      await api.selectPlan(tier);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't select that plan");
    } finally {
      setSelecting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Eyebrow className="mb-2">Billing</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Plan
        </h1>
      </div>

      {sub && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Current plan</p>
              <p className="font-heading text-lg font-semibold text-neutral-900 capitalize">
                {sub.tier} · {STATUS_LABEL[sub.status]}
              </p>
            </div>
            <div className="text-right text-sm text-neutral-500">
              {sub.client_limit ? (
                <p>
                  {sub.active_client_count} / {sub.client_limit} clients
                </p>
              ) : (
                <p>{sub.active_client_count} clients</p>
              )}
              {sub.status === "trialing" && (
                <p>Trial ends {new Date(sub.trial_ends_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = sub?.tier === plan.tier && sub.status === "active";
          return (
            <Card key={plan.tier} className={isCurrent ? "!border-accent-400" : undefined}>
              <h3 className="font-heading mb-1 text-lg font-semibold text-neutral-900">
                {plan.name}
              </h3>
              <p className="font-heading mb-1 text-xl font-semibold text-neutral-900">
                {plan.price}
              </p>
              <p className="mb-4 text-sm text-neutral-500">{plan.blurb}</p>
              {plan.tier === "enterprise" ? (
                <Button variant="secondary" className="w-full" disabled>
                  Contact sales
                </Button>
              ) : isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={selecting === plan.tier}
                  onClick={() => choose(plan.tier)}
                >
                  {selecting === plan.tier ? "Selecting…" : "Select plan"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
