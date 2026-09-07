import type { Metadata } from "next";
import Link from "next/link";
import { FileTextIcon as FileText, QuestionIcon as Question, ChecksIcon as Checks, CalculatorIcon as Calculator } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Practice Kits for Coaches | Templates, Calculators & Frameworks",
  description:
    "Every free resource CoachevaOS gives coaches: a coaching agreement template, a 25-question discovery library, a client check-in framework, capacity/revenue/churn calculators, and client tracker spreadsheets. No signup required.",
  path: "/free-kits",
  keywords: [
    "free coaching resources",
    "free coaching templates",
    "free coaching business tools",
    "coaching practice kit",
    "free coach downloads",
  ],
});

const KITS = [
  {
    Icon: FileText,
    title: "Coaching Agreement & Contract Template",
    body: "A pre-vetted legal agreement framework covering scope, fees, cancellation, and confidentiality.",
    href: "/templates/coaching-agreement-template",
  },
  {
    Icon: Question,
    title: "Intake Discovery Question Library",
    body: "25 powerful questions to ask a new client before their first session, grouped by category.",
    href: "/templates/discovery-questions-library",
  },
  {
    Icon: Checks,
    title: "Client Retention & Check-In Framework",
    body: "A structured 15-minute weekly accountability check-in, time-boxed into 5 sections.",
    href: "/templates/client-checkin-framework",
  },
];

const CALCULATORS = [
  { title: "Client Capacity Calculator", body: "How many clients you can realistically manage.", href: "/tools/capacity-calculator" },
  { title: "Revenue Calculator", body: "How many clients you need to hit an income goal.", href: "/tools/revenue-calculator" },
  { title: "Churn Calculator", body: "How much revenue churn is actually costing you.", href: "/tools/churn-calculator" },
];

const SPREADSHEETS = [
  { title: "Client Tracker Template", href: "/templates/client-tracker" },
  { title: "Client Dashboard Template", href: "/templates/client-dashboard" },
  { title: "Coaching Business Spreadsheet", href: "/templates/coaching-spreadsheet" },
  { title: "Personal Trainer Client Tracker", href: "/templates/pt-client-tracker" },
];

export default function FreeKitsPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Free Practice Kits" }]} />
        <Eyebrow className="mb-4">Free practice kits</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Every free resource CoachevaOS gives coaches
        </h1>
        <p className="mb-10 max-w-lg text-sm leading-relaxed text-neutral-600">
          Real templates and calculators, not lead-gen bait — no email required for any of these.
          Use them whether or not you ever try CoachevaOS itself.
        </p>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">Practice kits</h2>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {KITS.map((k) => (
            <Link key={k.href} href={k.href}>
              <Card className="h-full transition-colors hover:border-accent-300">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <k.Icon className="h-4 w-4" weight="fill" />
                </span>
                <h3 className="font-heading mb-1.5 text-sm font-semibold text-neutral-900">{k.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-600">{k.body}</p>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">Free calculators</h2>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CALCULATORS.map((c) => (
            <Link key={c.href} href={c.href}>
              <Card className="h-full transition-colors hover:border-accent-300">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <Calculator className="h-4 w-4" weight="fill" />
                </span>
                <h3 className="font-heading mb-1.5 text-sm font-semibold text-neutral-900">{c.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-600">{c.body}</p>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">Spreadsheet templates</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SPREADSHEETS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:border-accent-300 hover:text-accent-700"
            >
              {s.title}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
