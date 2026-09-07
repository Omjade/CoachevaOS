import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Best All-in-One Coaching Platform 2026 | CoachevaOS",
  description:
    "The best all-in-one coaching platforms in 2026, compared honestly: client management, scheduling, billing tracking, and AI, all from a single dashboard.",
  path: "/best-all-in-one-coaching-platform",
  keywords: [
    "best all-in-one coaching platform",
    "all-in-one coaching software",
    "coaching platform comparison",
    "all-in-one client management software for coaches",
  ],
});

const ROUNDUP = [
  {
    name: "CoachevaOS",
    take: "Client management, lead pipeline, branded portal, calendar integrations (Google Meet/Zoom/Calendly/Cal.com), billing tracking, and an AI daily briefing, all in one dashboard, with a niche-agnostic setup that isn't fitness-first by default.",
  },
  {
    name: "Simply.Coach",
    take: "A genuinely broad feature set built for compliance and corporate coaching structure. The better fit for organizational coaching programs specifically.",
  },
  {
    name: "Delenta",
    take: "Broad coverage with a real strength in group coaching and mobile-first delivery.",
  },
];

const FAQ = [
  {
    q: "What makes a coaching platform 'all-in-one'?",
    a: "An all-in-one coaching platform replaces the usual stack of a spreadsheet, WhatsApp, email, and a separate scheduling tool with one system covering client management, scheduling, billing tracking, and communication.",
  },
  {
    q: "Is an all-in-one platform better than stacking separate tools?",
    a: "For most solo and small coaching practices, yes. The real cost of stacked tools isn't the subscriptions. It's the admin time spent keeping five separate systems in sync, which an all-in-one platform removes entirely.",
  },
];

export default function BestAllInOnePlatformRoundupPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Best All-in-One Platform" }]} />
        <Eyebrow className="mb-4">Roundup</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Best all-in-one coaching platform in 2026
        </h1>
        <DirectAnswer>
          The best all-in-one coaching platforms replace a stack of separate tools (a spreadsheet,
          WhatsApp, email, and a scheduling app) with one dashboard covering client management,
          bookings, billing tracking, and communication. CoachevaOS leads this list with an AI daily
          briefing layered on top; below is where the alternatives are honestly the better fit.
        </DirectAnswer>

        <div className="mb-8 flex flex-col gap-3">
          {ROUNDUP.map((r, i) => (
            <Card key={r.name} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">{r.name}</h2>
                <p className="text-sm leading-relaxed text-neutral-600">{r.take}</p>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">Replace five apps with one dashboard.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "CoachevaOS vs. Simply.Coach", href: "/compare/simply-coach-alternative" },
            { label: "CoachevaOS vs. Delenta", href: "/compare/delenta-alternative" },
            { label: "Best coaching software for solo coaches", href: "/best-coaching-software-solo-coaches" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
