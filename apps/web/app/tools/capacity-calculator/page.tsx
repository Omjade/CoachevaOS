import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import NicheApplicability from "@/components/NicheApplicability";
import ToolSchema from "@/components/ToolSchema";
import FAQAccordion from "@/components/FAQAccordion";
import CapacityCalculator from "@/components/tools/CapacityCalculator";
import { buildMetadata } from "@/lib/seo";

const TITLE = "Coaching Client Capacity Calculator | How Many Clients Can You Take On?";
const DESCRIPTION =
  "Free client capacity calculator for coaches: find how many clients a life coach, business coach, health coach, personal trainer, or any 1:1 coaching practice can realistically manage, based on hours available, session length, and admin time. No signup.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/capacity-calculator",
  keywords: [
    "client capacity calculator",
    "how many clients can a coach have",
    "how many clients should a life coach take",
    "personal trainer client capacity",
    "coaching caseload calculator",
    "how many clients can a therapist coach manage",
    "business coach client limit",
    "health coach capacity planning",
    "coaching practice capacity calculator",
  ],
});

const FAQ = [
  {
    q: "How many clients can a solo coach realistically manage?",
    a: "It depends on session length, frequency, and admin time per client — most solo coaches land between 15 and 35 active clients when balancing coaching hours with marketing and admin. Use the calculator above with your own numbers rather than a generic rule of thumb.",
  },
  {
    q: "Does this work for personal trainers and fitness coaches, not just life coaches?",
    a: "Yes — the calculation is the same for any 1:1 coaching model: life coaching, business coaching, health/nutrition coaching, personal training, executive coaching, or academic coaching. Only your session length and admin time per client change.",
  },
  {
    q: "Is this client capacity calculator really free?",
    a: "Yes, no signup or email required. It's a standalone tool — CoachevaOS itself is the client management platform that helps you actually run your practice at whatever capacity you land on.",
  },
];

export default function CapacityCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <ToolSchema name={TITLE} description={DESCRIPTION} path="/tools/capacity-calculator" />
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
          takes beyond the session itself. Works for life coaches, business coaches, health coaches,
          personal trainers, or any 1:1 coaching practice. No signup required.
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

        <NicheApplicability toolLabel="client capacity calculator" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
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
