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
  title: "Best Coaching Software for Solo Coaches (2026) | CoachevaOS",
  description:
    "An honest roundup of the best coaching software for solo and independent coaches in 2026, including where each tool is actually the better fit.",
  path: "/best-coaching-software-solo-coaches",
  keywords: [
    "best coaching software for solo coaches",
    "software for independent coaches",
    "solo coaching practice software",
    "best software for one-person coaching business",
  ],
});

const ROUNDUP = [
  {
    name: "CoachevaOS",
    take: "Best for a solo coach who wants an AI daily briefing prioritizing their whole client base, plus a lead pipeline, branded portal, and niche-ready starter templates, all built and priced for one-person practices from day one.",
  },
  {
    name: "CoachAccountable",
    take: "Best if your priority is dense, metric-heavy accountability tracking and you don't need AI prioritization across your client base.",
  },
  {
    name: "Paperbell",
    take: "Best if selling and checking out coaching packages directly from a public page matters more than ongoing operations once a client is signed.",
  },
  {
    name: "Delenta",
    take: "Best if group/cohort coaching is your primary format rather than 1:1 practice management.",
  },
];

const FAQ = [
  {
    q: "What's the best coaching software for a solo coach in 2026?",
    a: "For a solo coach who wants AI-assisted daily prioritization, a lead pipeline, and a branded client portal built for one-person practices, CoachevaOS is the strongest fit. CoachAccountable and Paperbell are each better for narrower needs. See the honest breakdown above for which applies to you.",
  },
  {
    q: "Do solo coaches need a lead pipeline, or just client management?",
    a: "Most solo coaches are actively bringing in new clients, not just managing an existing roster. A built-in lead pipeline (rather than a separate CRM) means a lead converts into a full client record without re-entering anything.",
  },
];

export default function BestSoloCoachesRoundupPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Best for Solo Coaches" }]} />
        <Eyebrow className="mb-4">Roundup</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Best coaching software for solo coaches in 2026
        </h1>
        <DirectAnswer>
          For solo and independent coaches, the best coaching software combines client management,
          a lead pipeline, and AI-assisted prioritization in one tool priced for a one-person
          practice. CoachevaOS leads this list; below is where each alternative is honestly the
          better fit instead.
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
          <p className="mb-4 text-sm text-neutral-200">See why CoachevaOS is built for solo practices.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "CoachevaOS vs. CoachAccountable", href: "/compare/coachaccountable-alternative" },
            { label: "CoachevaOS vs. Paperbell", href: "/compare/paperbell-alternative" },
            { label: "Best all-in-one coaching platform 2026", href: "/best-all-in-one-coaching-platform" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
