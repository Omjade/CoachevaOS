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
import ChurnCalculator from "@/components/tools/ChurnCalculator";
import { buildMetadata } from "@/lib/seo";

const TITLE = "Client Churn Calculator for Coaches | See Revenue Lost to Churn";
const DESCRIPTION =
  "Free client churn calculator for coaches: see how much revenue your life coaching, business coaching, health coaching, or personal training practice loses to churn each month and year. No signup.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/churn-calculator",
  keywords: [
    "coaching client churn calculator",
    "client retention calculator for coaches",
    "how much does client churn cost",
    "coaching business churn rate",
    "personal training client retention calculator",
    "life coach client retention",
    "coaching revenue lost to churn",
  ],
});

const FAQ = [
  {
    q: "What's a normal client churn rate for a coaching business?",
    a: "Most 1:1 coaching practices see 5-10% monthly churn; anything above 10% usually points to onboarding, engagement, or pricing-fit issues worth investigating rather than treating as normal attrition.",
  },
  {
    q: "Does this churn calculator apply to personal trainers and fitness coaches?",
    a: "Yes — churn math is the same across coaching niches (life, business, health, fitness, executive coaching): active clients, churn rate, and average client value are all that matter, regardless of what kind of coaching you do.",
  },
  {
    q: "How is annual revenue lost to churn calculated?",
    a: "It multiplies your monthly client loss (active clients × churn rate) by your average client value, then annualizes that monthly loss — giving a realistic yearly cost of churn rather than an easy-to-ignore small monthly number.",
  },
];

export default function ChurnCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <ToolSchema name={TITLE} description={DESCRIPTION} path="/tools/churn-calculator" />
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Churn Calculator" }]} />
        <Eyebrow className="mb-4">Free tool</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          How much is client churn actually costing you?
        </h1>
        <DirectAnswer>
          Enter your active client count, monthly churn rate, and average client value to see the
          real monthly and annual revenue impact of losing clients you didn't have to. Works for life
          coaches, business coaches, personal trainers, and any 1:1 coaching practice. No signup
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

        <NicheApplicability toolLabel="churn calculator" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
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
