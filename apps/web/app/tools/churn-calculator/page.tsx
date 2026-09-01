import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import ChurnCalculator from "@/components/tools/ChurnCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Churn Calculator for Coaches | CoachevaOS",
  description:
    "Free calculator: how much revenue your coaching practice is losing to client churn each month and year, based on your active client count and churn rate.",
  path: "/tools/churn-calculator",
});

export default function ChurnCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Churn Calculator" }]} />
        <Eyebrow className="mb-4">Free tool</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          How much is client churn actually costing you?
        </h1>
        <DirectAnswer>
          Enter your active client count, monthly churn rate, and average client value to see the
          real monthly and annual revenue impact of losing clients you didn't have to. No signup
          required.
        </DirectAnswer>

        <div className="mb-10">
          <ChurnCalculator />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            CoachevaOS flags at-risk clients before they churn, with an AI daily briefing and risk
            alerts built in.
          </p>
          <Link href="/ai-coaching-software">
            <Button>See how risk alerts work</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "How many clients can you realistically manage?", href: "/tools/capacity-calculator" },
            { label: "Client retention strategies that actually work", href: "/blog/client-retention-strategies-that-work" },
            { label: "AI coaching software", href: "/ai-coaching-software" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
