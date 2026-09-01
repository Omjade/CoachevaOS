import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PricingGrid from "@/components/PricingGrid";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for independent coaches: plans that scale with your client list.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-6xl px-3 py-10 md:px-4">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <Eyebrow className="mx-auto mb-4">Pricing</Eyebrow>
          <h1 className="font-heading mb-3 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
            Simple pricing that scales with your client list
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            No setup fees. Cancel anytime. Every plan includes a 14-day free trial.
          </p>
        </div>
        <PricingGrid />
      </main>
      <SiteFooter />
    </div>
  );
}
