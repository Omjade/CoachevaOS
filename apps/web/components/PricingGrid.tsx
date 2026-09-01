"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr";
import { api } from "@/lib/api";
import { GLOBAL_PRICING_TIERS, INDIA_PRICING_TIERS } from "@/lib/pricing";

const SALES_EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@coachevaos.com";

export default function PricingGrid() {
  // Auto-detected, not a toggle — shows one currency based on the visitor's
  // resolved region, defaulting to Global/USD while resolving or on failure.
  const [region, setRegion] = useState<"global" | "india">("global");

  useEffect(() => {
    api
      .getRegion()
      .then((r) => setRegion(r.region))
      .catch(() => setRegion("global"));
  }, []);

  const plans = region === "india" ? INDIA_PRICING_TIERS : GLOBAL_PRICING_TIERS;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {plans.map((plan) => (
        <div
          key={plan.tier}
          className="flex flex-col justify-between rounded-[19px] border border-neutral-300/50 bg-white p-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)]"
        >
          <div>
            <p className="font-heading text-lg font-semibold text-neutral-900">{plan.name}</p>
            <p className="mt-2 font-heading text-3xl font-semibold text-neutral-900">{plan.monthlyPrice}</p>
            <p className="mt-1 text-xs text-neutral-500">{plan.blurb}</p>
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
              <button className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800">
                Get started
              </button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
