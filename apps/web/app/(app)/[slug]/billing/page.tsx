"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckIcon as Check } from "@phosphor-icons/react";
import { api, ApiError, BillingCycle, SubscriptionTier } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow } from "@/components/ui";
import { GLOBAL_PRICING_TIERS, INDIA_PRICING_TIERS, recommendedTierFor } from "@/lib/pricing";
import { openPaddleCheckout } from "@/components/payments/PaddleCheckout";
import { useSubscription } from "@/lib/useSubscription";
import { useRoleGuard } from "@/lib/useRoleGuard";

const SALES_EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@coachevaos.com";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  trial_expired: "Trial expired",
  past_due: "Past due",
  restricted: "Restricted",
  canceled: "Canceled",
};

const TIER_LABEL: Record<SubscriptionTier, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
  pro: "Pro",
  enterprise: "Enterprise",
};

function BillingPageInner() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { subscription: sub, refresh } = useSubscription();
  const [region, setRegion] = useState<"global" | "india" | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selecting, setSelecting] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(searchParams.get("checkout") === "success");
  const [mismatchTier, setMismatchTier] = useState<SubscriptionTier | null>(null);
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [manageBillingError, setManageBillingError] = useState<string | null>(null);

  useEffect(() => {
    // The region toggle seeds from the server's fully reconciled answer
    // (declared billing country when set, else best-effort IP geolocation) —
    // not a blind client-side default — so a coach doesn't land on a region
    // that disagrees with everything already known about them.
    api
      .getRegion()
      .then((r) => setRegion(r.region))
      .catch(() => setRegion("global"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flashSuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  // A completed checkout redirects back here before the webhook has
  // necessarily landed — poll briefly for the subscription to flip to active
  // rather than showing stale trial/pending state.
  useEffect(() => {
    if (!checkoutPending) return;
    const id = setInterval(refresh, 2000);
    const timeout = setTimeout(() => {
      clearInterval(id);
      setCheckoutPending(false);
    }, 15000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutPending]);

  useEffect(() => {
    if (checkoutPending && sub?.status === "active") {
      setCheckoutPending(false);
      flashSuccess(`Payment successful. You're on the ${TIER_LABEL[sub.tier]} plan`);
    }
  }, [checkoutPending, sub]);

  // Both regions go through the same Paddle checkout — Paddle itself shows
  // localized currency and payment methods (UPI only ever appears for an
  // India checkout address on an India-priced item, see the India price
  // overrides applied via scripts/apply_india_pricing.py). This toggle is
  // just a display/checkout-locale hint, not a provider choice. Once a real
  // (paid) subscription exists it's locked in — switching currency after the
  // fact is a support-assisted cancel-and-resubscribe, not a self-serve toggle.
  const hasRealSubscription = sub?.status === "active" || sub?.status === "past_due";
  const plans = region === "india" ? INDIA_PRICING_TIERS : GLOBAL_PRICING_TIERS;
  // The cheapest plan that still covers the coach's current active-client
  // count — e.g. 18 active clients skips Starter's 15-client cap straight to
  // Growth. Recomputed live off the same count already shown above, so it
  // tracks as clients are added/removed, not a one-time snapshot.
  const recommendedTier = sub ? recommendedTierFor(sub.active_client_count, plans) : null;

  async function subscribe(tier: SubscriptionTier, confirmMismatch = false) {
    setSelecting(tier);
    setError(null);
    try {
      const token = await api.getPaddleCheckoutToken(tier, cycle, region ?? "global", confirmMismatch);
      setMismatchTier(null);
      setMismatchMessage(null);
      await openPaddleCheckout({
        clientSideToken: token.client_side_token,
        environment: token.environment,
        priceId: token.price_id,
        customerEmail: token.customer_email,
        customData: token.custom_data,
        successUrl: `${window.location.origin}/${params.slug}/billing?checkout=success`,
        // Paddle only shows INR pricing + UPI for an India checkout address —
        // this just pre-fills that step, the buyer can still change it.
        countryCode: region === "india" ? "IN" : undefined,
        paddleCustomerId: token.processor_customer_id,
      });
    } catch (err) {
      // A 409 here means the coach picked "India" pricing with no signal
      // supporting it — real, server-enforced friction, not just a client
      // guess. One explicit "continue anyway" click retries with the confirm
      // flag; this doesn't and can't guarantee they're actually India-based —
      // Paddle's own checkout still requires a real India address for the
      // INR price to apply at all — it only deters a casual "let me just try
      // India pricing" click.
      if (err instanceof ApiError && err.status === 409 && !confirmMismatch) {
        setMismatchTier(tier);
        setMismatchMessage(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't start checkout. Try again.");
      }
    } finally {
      setSelecting(null);
    }
  }

  async function changePlan(tier: SubscriptionTier) {
    setSelecting(tier);
    setError(null);
    try {
      await api.changePlan(tier, cycle);
      await refresh();
      flashSuccess(`Plan changed to ${TIER_LABEL[tier]}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change plan");
    } finally {
      setSelecting(null);
    }
  }

  async function openManageBilling() {
    setManagingBilling(true);
    setManageBillingError(null);
    try {
      const { url } = await api.getPaddlePortalSession();
      window.location.href = url;
    } catch (err) {
      setManageBillingError(
        err instanceof ApiError ? err.message : "Couldn't open billing management. Try again."
      );
    } finally {
      setManagingBilling(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancel your subscription at the end of the current billing period?")) return;
    setError(null);
    try {
      await api.cancelSubscription();
      await refresh();
      flashSuccess("Your subscription will cancel at the end of this billing period");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel subscription");
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

      {checkoutPending && (
        <Card className="!border-accent-400">
          <p className="text-sm text-neutral-700">
            Payment received. Setting up your plan… this usually takes a few seconds.
          </p>
        </Card>
      )}

      {successMessage && (
        <div className="flex items-center gap-1.5 rounded-(--radius-md) border border-accent-200 bg-accent-100 px-4 py-3 text-sm font-medium text-accent-700">
          <Check className="h-4 w-4 shrink-0" weight="bold" />
          {successMessage}
        </div>
      )}

      {sub && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Current plan</p>
              <p className="font-heading text-lg font-semibold text-neutral-900 capitalize">
                {sub.tier} · {STATUS_LABEL[sub.status]}
              </p>
              {sub.cancel_at_period_end && (
                <p className="mt-1 text-xs text-accent-600">Cancels at the end of this billing period</p>
              )}
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
              {sub.status === "active" && !sub.cancel_at_period_end && sub.current_period_end && (
                <p>Renews {new Date(sub.current_period_end).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {sub.status === "past_due" && (
            <div className="mt-3 rounded-(--radius-md) border border-accent-300 bg-accent-100 px-3.5 py-2.5 text-xs text-neutral-700">
              Your last payment didn&apos;t go through.
              {sub.grace_period_ends_at
                ? ` Update your payment method by ${new Date(sub.grace_period_ends_at).toLocaleDateString()} to avoid losing access.`
                : " Update your payment method to avoid losing access."}
            </div>
          )}

          {sub.status === "restricted" && (
            <div className="mt-3 rounded-(--radius-md) border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              Your payment couldn&apos;t be processed and the grace period has ended. Adding or
              editing data is paused until you update your plan below.
            </div>
          )}

          <div className="mt-3 flex items-center gap-4">
            {sub.provider && (
              <button
                type="button"
                onClick={openManageBilling}
                disabled={managingBilling}
                className="text-xs font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50"
              >
                {managingBilling ? "Opening…" : "Manage billing"}
              </button>
            )}
            {(sub.status === "active" || sub.status === "past_due") &&
              !sub.cancel_at_period_end &&
              sub.provider && (
                <button
                  type="button"
                  onClick={cancel}
                  className="text-xs text-neutral-400 hover:text-accent-600"
                >
                  Cancel subscription
                </button>
              )}
          </div>
          {manageBillingError && (
            <p className="mt-1.5 text-xs text-accent-600">{manageBillingError}</p>
          )}
        </Card>
      )}

      {sub && recommendedTier && recommendedTier !== sub.tier && (
        <div className="rounded-(--radius-md) border border-accent-200 bg-accent-100 px-4 py-3 text-sm text-neutral-700">
          {recommendedTier === "enterprise" ? (
            <>
              You have <strong>{sub.active_client_count}</strong> active clients, which is beyond our
              self-serve plans.{" "}
              <a href={`mailto:${SALES_EMAIL}`} className="font-semibold text-accent-700 underline">
                Contact sales
              </a>{" "}
              for Enterprise.
            </>
          ) : (
            <>
              You have <strong>{sub.active_client_count}</strong> active clients.{" "}
              <strong>{TIER_LABEL[recommendedTier]}</strong> is the best fit for your current plan size.
            </>
          )}
        </div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {mismatchTier && (
        <Card className="!border-accent-400">
          <p className="text-sm text-neutral-700">{mismatchMessage}</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => subscribe(mismatchTier, true)}>Continue anyway</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMismatchTier(null);
                setMismatchMessage(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!hasRealSubscription && region && (
          <p className="text-xs text-neutral-500">
            Pricing shown in {region === "india" ? "INR (India)" : "USD"}
          </p>
        )}
        <div className="ml-auto flex gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-full border px-3 py-1.5 ${cycle === "monthly" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`rounded-full border px-3 py-1.5 ${cycle === "annual" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"}`}
          >
            Annual
          </button>
        </div>
      </div>

      {hasRealSubscription && (
        <p className="text-xs text-neutral-500">
          Switching plans is prorated to your current billing cycle. You&apos;re charged (or credited) only
          the difference for the days remaining, never the new plan&apos;s full price on top of what you
          already paid.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => {
          const isCurrent = sub?.tier === plan.tier && sub.status === "active";
          const isRecommended = plan.tier === recommendedTier;
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          return (
            <Card key={plan.tier} className={isCurrent ? "!border-accent-400" : undefined}>
              {isRecommended && (
                <span className="mb-2 inline-block rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                  Recommended for you
                </span>
              )}
              <h3 className="font-heading mb-1 text-lg font-semibold text-neutral-900">
                {plan.name}
              </h3>
              <p className="font-heading mb-1 text-xl font-semibold text-neutral-900">{price}</p>
              <p className="mb-4 text-sm text-neutral-500">{plan.blurb}</p>
              {plan.tier === "enterprise" ? (
                <a href={`mailto:${SALES_EMAIL}`}>
                  <Button variant="secondary" className="w-full">
                    Contact sales
                  </Button>
                </a>
              ) : isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={selecting === plan.tier}
                  onClick={() => (hasRealSubscription ? changePlan(plan.tier) : subscribe(plan.tier))}
                >
                  {selecting === plan.tier
                    ? "Loading…"
                    : hasRealSubscription
                      ? "Switch plan"
                      : "Subscribe"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BillingPageGate() {
  // Gates which component even MOUNTS, not just what it renders —
  // BillingPageInner calls useSubscription(), which throws with no
  // SubscriptionProvider ancestor (only CoachShell provides one, PortalShell
  // doesn't), so a client reaching this route must never let that component
  // instantiate at all, not just early-return from inside it.
  const ok = useRoleGuard("coach");
  if (!ok) return null;
  return (
    <Suspense fallback={null}>
      <BillingPageInner />
    </Suspense>
  );
}

export default function BillingPage() {
  return <BillingPageGate />;
}
