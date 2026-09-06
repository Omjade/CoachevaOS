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
import RevenueCalculator from "@/components/tools/RevenueCalculator";
import { buildMetadata } from "@/lib/seo";

const TITLE = "Coaching Revenue Calculator | How Many Clients to Hit Your Income Goal";
const DESCRIPTION =
  "Free coaching revenue calculator: find how many clients a life coach, business coach, health coach, or personal trainer needs at their current price to hit a target monthly income, accounting for churn. No signup.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/revenue-calculator",
  keywords: [
    "coaching revenue calculator",
    "how many clients to make $10k a month coaching",
    "life coach income calculator",
    "personal trainer income calculator",
    "coaching business revenue calculator",
    "how much should I charge as a coach",
    "coaching pricing calculator",
    "business coach revenue goal calculator",
  ],
});

const FAQ = [
  {
    q: "How many coaching clients do I need to make $10,000 a month?",
    a: "It depends entirely on your price per client and churn rate — at $400/month per client with typical churn, that's roughly 25-30 active clients. Enter your own price and churn rate above for an exact number, since generic income targets rarely match a real pricing model.",
  },
  {
    q: "Does this work for personal trainers and fitness coaches, not just life coaches?",
    a: "Yes — the math is identical for any coaching niche (life, business, health, executive, academic, fitness) since it's based purely on price per client, target income, and churn, not the type of coaching you do.",
  },
  {
    q: "Why does the calculator account for churn instead of just dividing income by price?",
    a: "A flat division ignores that clients leave every month — this calculator also shows how many new clients you need just to replace churned ones, which is the real number that determines how much you need to be marketing, not just your total client count.",
  },
];

export default function RevenueCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <ToolSchema name={TITLE} description={DESCRIPTION} path="/tools/revenue-calculator" />
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
          rate just to hold steady. Works for life coaches, business coaches, personal trainers, and
          any 1:1 coaching practice. No signup required.
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

        <NicheApplicability toolLabel="revenue calculator" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
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
