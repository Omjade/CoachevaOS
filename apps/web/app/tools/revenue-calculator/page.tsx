import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import RevenueCalculator from "@/components/tools/RevenueCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Coaching Revenue Calculator | CoachevaOS",
  description:
    "Free calculator: how many clients you need at your current price point to hit a target monthly income, accounting for churn.",
  path: "/tools/revenue-calculator",
});

export default function RevenueCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Revenue Calculator" }]} />
        <Eyebrow className="mb-4">Free tool</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          How many clients do you need to hit your income goal?
        </h1>
        <DirectAnswer>
          Enter a target monthly income and your average price per client to see how many active
          clients you need, plus how many new clients to bring in each month at your expected churn
          rate just to hold steady. No signup required.
        </DirectAnswer>

        <div className="mb-10">
          <RevenueCalculator />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Track real revenue and billing status per client in one dashboard.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "How many clients can you realistically manage?", href: "/tools/capacity-calculator" },
            { label: "How much is churn costing you?", href: "/tools/churn-calculator" },
            { label: "How to price your coaching packages", href: "/blog/how-to-price-your-coaching-packages" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
