"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { XIcon as X } from "@phosphor-icons/react";
import { useSubscription } from "@/lib/useSubscription";

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Dismissal is keyed to the specific banner state (status + the value that
// would change the message) and stored in sessionStorage, not localStorage:
// closing it should hide it for the rest of this session, but a fresh login
// (a new browser session) should show it again if it's still relevant —
// this is never a state that blocks account access, so there's no risk in
// letting it come back.
function useDismissible(key: string) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  }
  return { dismissed, dismiss };
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss"
      className="shrink-0 rounded-full p-1 text-current opacity-60 hover:opacity-100"
    >
      <X className="h-3.5 w-3.5" weight="bold" />
    </button>
  );
}

export default function SubscriptionBanner() {
  const params = useParams<{ slug: string }>();
  const billingHref = `/${params.slug}/billing`;
  const { subscription: sub } = useSubscription();

  const trialExpired = useDismissible("sub-banner-dismissed:trial_expired");
  const days = sub?.status === "trialing" ? daysUntil(sub.trial_ends_at) : null;
  const trialing = useDismissible(`sub-banner-dismissed:trialing:${days}`);
  const growing = useDismissible(`sub-banner-dismissed:growing:${sub?.active_client_count}`);

  if (!sub) return null;

  if (sub.status === "trial_expired") {
    if (trialExpired.dismissed) return null;
    return (
      <div className="mb-6 flex items-start justify-between gap-3 rounded-(--radius-md) border border-accent-400 bg-accent-200 px-4 py-3 text-sm text-accent-800">
        <p>
          Your trial has ended. You can still view everything, but adding or editing is paused
          until you{" "}
          <Link href={billingHref} className="font-semibold underline">
            choose a plan
          </Link>
          .
        </p>
        <DismissButton onClick={trialExpired.dismiss} />
      </div>
    );
  }

  if (sub.status === "trialing") {
    // Same 1/3/6/9/12-day cadence the nightly reminder job notifies at —
    // the banner escalates in tone alongside those notifications rather
    // than only ever showing one flat style in the last few days.
    if (days !== null && days <= 12) {
      if (trialing.dismissed) return null;
      const urgent = days <= 3;
      return (
        <div
          className={`mb-6 flex items-start justify-between gap-3 rounded-(--radius-md) border px-4 py-3 text-sm ${
            urgent
              ? "border-accent-300 bg-accent-100 text-neutral-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-600"
          }`}
        >
          <p>
            {days <= 0 ? "Your trial ends today." : `${days} day${days === 1 ? "" : "s"} left in your trial.`}{" "}
            <Link
              href={billingHref}
              className={`font-semibold underline ${urgent ? "text-accent-700" : "text-neutral-700"}`}
            >
              pick a plan
            </Link>{" "}
            to keep going without interruption.
          </p>
          <DismissButton onClick={trialing.dismiss} />
        </div>
      );
    }
    return null;
  }

  if (sub.client_limit && sub.active_client_count / sub.client_limit >= 0.8) {
    if (growing.dismissed) return null;
    return (
      <div className="mb-6 flex items-start justify-between gap-3 rounded-(--radius-md) border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-neutral-700">
        <p>
          You&apos;re growing fast: {sub.active_client_count}/{sub.client_limit} clients on your
          current plan.{" "}
          <Link href={billingHref} className="font-semibold text-accent-700 underline">
            Consider upgrading
          </Link>
          .
        </p>
        <DismissButton onClick={growing.dismiss} />
      </div>
    );
  }

  return null;
}
