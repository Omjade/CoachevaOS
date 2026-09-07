"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon as Check, StarIcon as Star } from "@phosphor-icons/react/dist/ssr";
import { api } from "@/lib/api";
import { GLOBAL_PRICING_TIERS, INDIA_PRICING_TIERS } from "@/lib/pricing";

const SALES_EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@coachevaos.com";

export default function PricingGrid() {
  // Auto-detected on load (best-effort IP geolocation via the backend), but
  // switchable by hand below — a visitor whose IP resolves wrong, or who's
  // just curious what the other region costs, isn't stuck with a guess.
  const [region, setRegion] = useState<"global" | "india">("global");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    api
      .getRegion()
      .then((r) => setRegion(r.region))
      .catch(() => setRegion("global"));
  }, []);

  const plans = region === "india" ? INDIA_PRICING_TIERS : GLOBAL_PRICING_TIERS;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-[0_4px_10px_rgba(28,29,31,0.06)]">
          <button
            type="button"
            onClick={() => setRegion("global")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              region === "global" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Global (USD)
          </button>
          <button
            type="button"
            onClick={() => setRegion("india")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              region === "india" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            India (INR)
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-[0_4px_10px_rgba(28,29,31,0.06)]">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              cycle === "monthly" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              cycle === "annual" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {cycle === "annual" && (
        <p className="mx-auto mb-6 max-w-md text-center text-xs text-neutral-500">
          Annual billing charges 11 months up front — you get the 12th month free, billed once a
          year instead of monthly.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          return (
            <div
              key={plan.tier}
              className={`relative flex flex-col justify-between rounded-[19px] border bg-white p-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)] ${
                plan.popular ? "border-accent-500 ring-2 ring-accent-500/30 sm:-translate-y-2" : "border-neutral-300/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-[10px] font-semibold text-white shadow-[0_6px_14px_rgba(255,75,56,0.35)]">
                  <Star className="h-3 w-3" weight="fill" /> Most popular
                </span>
              )}
              <div>
                <p className="font-heading text-lg font-semibold text-neutral-900">{plan.name}</p>
                <p className="mt-2 font-heading text-3xl font-semibold text-neutral-900">{price}</p>
                {cycle === "annual" && plan.tier !== "enterprise" && (
                  <p className="mt-0.5 text-[11px] text-neutral-400">11 months' price, 1 month free</p>
                )}
                <p className="mt-1 text-xs text-neutral-500">{plan.blurb}</p>
                {plan.popular && (
                  <p className="mt-2 text-[11px] font-medium text-accent-700">
                    Best for most independent coaches
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-600">
                  <Check className="h-3.5 w-3.5 text-accent-600" weight="bold" />
                  14-day free trial
                </div>
                <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-1.5 text-xs text-neutral-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" weight="bold" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              {plan.tier === "enterprise" ? (
                <a href={`mailto:${SALES_EMAIL}`} className="mt-6">
                  <button className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-semibold text-neutral-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-50">
                    Contact us
                  </button>
                </a>
              ) : (
                <Link href="/signup" className="mt-6">
                  <button
                    className={`w-full rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                      plan.popular
                        ? "bg-accent-600 text-white hover:bg-accent-700"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    Get started
                  </button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
