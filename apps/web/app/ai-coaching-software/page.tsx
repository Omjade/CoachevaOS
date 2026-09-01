import type { Metadata } from "next";
import Link from "next/link";
import { BrainIcon as Brain, WarningIcon as Warning, SparkleIcon as Sparkle } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import Testimonial from "@/components/Testimonial";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "AI Coaching Software | An AI Daily Command Center for Coaches | CoachevaOS",
  description:
    "AI coaching software that prioritizes across your whole client base each morning and flags at-risk clients before they churn, not a single bolted-on chatbot feature.",
  path: "/ai-coaching-software",
});

const FEATURES = [
  {
    Icon: Sparkle,
    title: "AI daily briefing",
    body: "Every morning, one briefing tells you who hasn't replied, whose check-ins have gone quiet, and who's overdue for a session, across your entire client base, not one client at a time.",
  },
  {
    Icon: Warning,
    title: "Risk & attention alerts",
    body: "A deterministic churn score (not a black box) flags disengagement early (falling message frequency, missed check-ins, no meetings attended) so you catch it before a client quietly stops responding.",
  },
  {
    Icon: Brain,
    title: "AI session assistant & program generator",
    body: "Turn a session note into a summary, action items, and a draft follow-up message in one step. Draft a starting program for a new client from their goals and niche, then edit before it's ever assigned.",
  },
];

const FAQ = [
  {
    q: "What is AI coaching software?",
    a: "AI coaching software applies AI to the operational side of running a coaching practice: prioritizing which clients need attention, flagging disengagement risk, and drafting follow-ups from session notes, rather than AI coaching a client directly. CoachevaOS's AI always drafts; a coach always reviews before anything reaches a client.",
  },
  {
    q: "Is CoachevaOS's AI actually different from other 'AI-powered' coaching tools?",
    a: "Independent research into AI coaching platforms in 2026 found only about a third of coaching-software products offer real AI features at all, and most of those are a single per-client summary. CoachevaOS's AI operates business-wide: one daily briefing prioritizing your whole roster, plus a churn score computed from real engagement signals, not just a chatbot bolted onto a CRM.",
  },
  {
    q: "Does the AI ever message a client without my approval?",
    a: "No. Every AI-drafted follow-up, program, or form is a draft a coach reviews and edits before it's sent or assigned. Nothing is sent on a coach's behalf automatically.",
  },
];

export default function AICoachingSoftwarePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "AI Coaching Software" }]} />
        <Eyebrow className="mb-4">AI Coaching Software</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          AI coaching software built as a daily command center, not a chatbot
        </h1>
        <DirectAnswer>
          AI coaching software is software that applies AI to running a coaching practice: telling
          a coach who needs attention, flagging at-risk clients, and drafting follow-ups, rather
          than AI coaching the client directly. CoachevaOS's AI daily briefing prioritizes across a
          coach's entire client base every morning, with risk alerts and session-note automation
          layered on top, all reviewed by the coach before anything reaches a client.
        </DirectAnswer>

        <div className="mb-8 grid grid-cols-1 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <f.Icon className="h-5 w-5" weight="fill" />
              </span>
              <div>
                <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">{f.title}</h2>
                <p className="text-sm leading-relaxed text-neutral-600">{f.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-10">
          <Testimonial />
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            See the AI daily briefing prioritize your own client base.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "CoachevaOS vs. CoachAccountable", href: "/compare/coachaccountable-alternative" },
            { label: "Client management software for coaches", href: "/client-management-software" },
            { label: "Coaching automation software", href: "/coaching-automation" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
