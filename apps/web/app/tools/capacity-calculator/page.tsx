import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import CapacityCalculator from "@/components/tools/CapacityCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Coaching Client Capacity Calculator | CoachevaOS",
  description:
    "Free calculator: how many clients can you realistically manage based on your available hours, session length, and admin time per client.",
  path: "/tools/capacity-calculator",
});

export default function CapacityCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Capacity Calculator" }]} />
        <Eyebrow className="mb-4">Free tool</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          How many clients can you realistically manage?
        </h1>
        <DirectAnswer>
          This calculator estimates a realistic client capacity from the hours you actually have for
          client work each week, your average session length, and the admin/prep time each client
          takes beyond the session itself. No signup required.
        </DirectAnswer>

        <div className="mb-10">
          <CapacityCalculator />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Outgrown a spreadsheet for tracking client capacity? See what it looks like as a full
            client workspace.
          </p>
          <Link href="/features/client-dashboard">
            <Button>See the client dashboard</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "How many clients do you need to hit your income goal?", href: "/tools/revenue-calculator" },
            { label: "How much is churn costing you?", href: "/tools/churn-calculator" },
            { label: "Client management software for coaches", href: "/client-management-software" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
