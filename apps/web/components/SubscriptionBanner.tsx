"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, PlatformSubscriptionData } from "@/lib/api";

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function SubscriptionBanner() {
  const params = useParams<{ slug: string }>();
  const billingHref = `/${params.slug}/billing`;
  const [sub, setSub] = useState<PlatformSubscriptionData | null>(null);

  useEffect(() => {
    api.getPlatformSubscription().then(setSub).catch(() => {});
  }, []);

  if (!sub) return null;

  if (sub.status === "trial_expired") {
    return (
      <div className="mb-6 rounded-(--radius-md) border border-accent-400 bg-accent-200 px-4 py-3 text-sm text-accent-800">
        Your trial has ended — you can still view everything, but adding or editing is paused
        until you{" "}
        <Link href={billingHref} className="font-semibold underline">
          choose a plan
        </Link>
        .
      </div>
    );
  }

  if (sub.status === "trialing") {
    const days = daysUntil(sub.trial_ends_at);
    if (days <= 5) {
      return (
        <div className="mb-6 rounded-(--radius-md) border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-neutral-700">
          {days <= 0 ? "Your trial ends today" : `${days} day${days === 1 ? "" : "s"} left in your trial`} —{" "}
          <Link href={billingHref} className="font-semibold text-accent-700 underline">
            pick a plan
          </Link>{" "}
          to keep going without interruption.
        </div>
      );
    }
    return null;
  }

  if (sub.client_limit && sub.active_client_count / sub.client_limit >= 0.8) {
    return (
      <div className="mb-6 rounded-(--radius-md) border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-neutral-700">
        You&apos;re growing fast — {sub.active_client_count}/{sub.client_limit} clients on your
        current plan.{" "}
        <Link href={billingHref} className="font-semibold text-accent-700 underline">
          Consider upgrading
        </Link>
        .
      </div>
    );
  }

  return null;
}
