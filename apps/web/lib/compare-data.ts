import type { ComparisonRow } from "@/components/ComparisonTable";
import type { FAQItem } from "@/components/FAQAccordion";

export interface CompetitorEntry {
  slug: string;
  name: string;
  keyword: string;
  /** Honest one-paragraph summary of what they do well, never trash a competitor. */
  strengths: string;
  directAnswer: string;
  rows: ComparisonRow[];
  bestForFraming: string;
  faq: FAQItem[];
}

// Real, research-grounded content, not fabricated pricing or feature claims.
// Where a competitor's specific internals aren't publicly verifiable, rows
// stay at the level of well-established positioning rather than invented
// specifics, since comparison pages get fact-checked by prospects who've
// actually used both tools.
export const COMPETITORS: CompetitorEntry[] = [
  {
    slug: "coachaccountable-alternative",
    name: "CoachAccountable",
    keyword: "CoachAccountable alternative",
    strengths:
      "CoachAccountable is a genuinely strong accountability-and-delivery back office: action items, metrics, worksheets, and engagement reporting are all mature, deep features for coaches who already have a full client roster and want dense between-session tracking.",
    directAnswer:
      "CoachevaOS is a coaching practice management platform built around an AI daily briefing that tells you which clients need attention before you open your inbox, plus a branded client portal, lead pipeline, and calendar booking, all in one workspace, priced for solo and small coaching practices.",
    rows: [
      { feature: "Client portal & messaging", coachevaos: true, competitor: true },
      { feature: "Action items / between-session tracking", coachevaos: true, competitor: true },
      { feature: "Lead pipeline (Kanban + CSV import)", coachevaos: true, competitor: false },
      { feature: "AI daily briefing across your whole client base", coachevaos: true, competitor: false, emphasize: true },
      { feature: "AI churn/risk alerts", coachevaos: true, competitor: false, emphasize: true },
      { feature: "Calendar booking + Google Meet/Zoom links", coachevaos: true, competitor: "Limited" },
      { feature: "Niche-agnostic custom fields & metrics", coachevaos: true, competitor: "Fitness/wellness-flavored" },
    ],
    bestForFraming:
      "Best for AI-driven daily prioritization across your whole roster: CoachevaOS. Best for metric-heavy, per-client accountability tracking: CoachAccountable.",
    faq: [
      {
        q: "Is CoachevaOS a good CoachAccountable alternative for accountability coaching?",
        a: "Yes, if you also want an AI layer that tells you who needs attention across your entire client base each morning, not just per-client tracking. If your workflow is specifically metric-and-worksheet-heavy delivery, CoachAccountable's depth there is real and worth weighing.",
      },
      {
        q: "Does CoachevaOS have AI features CoachAccountable doesn't?",
        a: "Yes, an AI daily briefing, churn/risk alerts, an AI session assistant that drafts follow-ups from session notes, and an AI program generator. Independent research into AI coaching platforms found only about a third of coaching-software products offer real AI features today, and CoachAccountable isn't one of them.",
      },
      {
        q: "Can I import my existing clients from a spreadsheet?",
        a: "Yes, CoachevaOS has a CSV/Excel import flow with AI-assisted column mapping, so switching from a spreadsheet or another tool doesn't mean re-entering every client by hand.",
      },
    ],
  },
  {
    slug: "paperbell-alternative",
    name: "Paperbell",
    keyword: "Paperbell alternative",
    strengths:
      "Paperbell's real strength is selling coaching, not just delivering it. A coach can build a package page, take payment at checkout, and onboard a client without a separate website. That's a genuinely useful, different angle from a pure practice-management tool.",
    directAnswer:
      "CoachevaOS is a coaching practice management platform for coaches who already have clients (or are actively bringing them in through a lead pipeline) and want ongoing operations (messaging, scheduling, progress tracking, and an AI briefing) running from one dashboard rather than a package-and-checkout page.",
    rows: [
      { feature: "Sell packages via a public checkout page", coachevaos: false, competitor: true },
      { feature: "Lead pipeline for inbound leads (not yet paying)", coachevaos: true, competitor: false },
      { feature: "Ongoing client operations (tasks, progress, check-ins)", coachevaos: true, competitor: "Basic" },
      { feature: "AI daily briefing across your whole client base", coachevaos: true, competitor: false, emphasize: true },
      { feature: "Custom fields & metrics per coaching niche", coachevaos: true, competitor: false },
      { feature: "Calendar integrations (Google Meet, Zoom, Calendly, Cal.com)", coachevaos: true, competitor: "Built-in scheduling only" },
    ],
    bestForFraming:
      "Best for ongoing client operations and AI-assisted daily prioritization: CoachevaOS. Best for selling and checking out new coaching packages directly: Paperbell.",
    faq: [
      {
        q: "Is CoachevaOS a Paperbell alternative for selling coaching packages?",
        a: "Not directly. Paperbell's checkout-and-packages flow is a real strength worth keeping if that's your main need. CoachevaOS is the stronger fit once a lead becomes a client and you need day-to-day operations: messaging, scheduling, progress tracking, and billing tracking in one place.",
      },
      {
        q: "Can leads and clients live in the same system?",
        a: "Yes, CoachevaOS's lead pipeline (a Kanban board with stages from new to booked) converts a lead into a full client record with one click, so nothing has to be re-entered.",
      },
    ],
  },
  {
    slug: "satori-alternative",
    name: "Satori",
    keyword: "Satori alternative",
    strengths:
      "Satori is built for qualification-heavy discovery calls and leans enterprise. It's a genuinely good fit for a coach or coaching organization with a structured, multi-step sales process before a client is accepted.",
    directAnswer:
      "CoachevaOS is a lighter-weight, more approachable coaching practice management platform built for solo and small coaching practices, prioritizing an AI daily briefing and a simple lead-to-client pipeline over a heavier, enterprise-leaning qualification process.",
    rows: [
      { feature: "Built for solo/small coaching practices", coachevaos: true, competitor: "Enterprise-leaning" },
      { feature: "Lead pipeline (Kanban + CSV import)", coachevaos: true, competitor: true },
      { feature: "AI daily briefing across your whole client base", coachevaos: true, competitor: false, emphasize: true },
      { feature: "Branded client portal", coachevaos: true, competitor: true },
      { feature: "Niche-agnostic starter templates (12+ coaching niches)", coachevaos: true, competitor: false },
    ],
    bestForFraming:
      "Best for a solo coach who wants something approachable and AI-assisted from day one: CoachevaOS. Best for enterprise-scale discovery-call qualification: Satori.",
    faq: [
      {
        q: "Is CoachevaOS a good fit if I'm a solo coach, not a coaching org?",
        a: "Yes, CoachevaOS is priced and designed for solo and small coaching practices specifically, whereas Satori's qualification-heavy workflow is built with larger, more structured operations in mind.",
      },
    ],
  },
  {
    slug: "simply-coach-alternative",
    name: "Simply.Coach",
    keyword: "Simply.Coach alternative",
    strengths:
      "Simply.Coach is built for compliance and corporate coaching structure. It's a strong choice for coaches operating inside or alongside an organization with formal reporting requirements.",
    directAnswer:
      "CoachevaOS is priced and positioned for independent solo coaches and small practices rather than organizations, with an AI daily briefing, branded client portal, and lead pipeline built for someone running their own practice, not a corporate coaching program.",
    rows: [
      { feature: "Priced for solo/independent coaches", coachevaos: true, competitor: "Organization-priced" },
      { feature: "AI daily briefing across your whole client base", coachevaos: true, competitor: false, emphasize: true },
      { feature: "Lead pipeline for growing a solo practice", coachevaos: true, competitor: "Limited" },
      { feature: "Branded client portal", coachevaos: true, competitor: true },
      { feature: "Custom fields & metrics per coaching niche", coachevaos: true, competitor: "Compliance-focused fields" },
    ],
    bestForFraming:
      "Best for an independent coach running their own practice: CoachevaOS. Best for compliance and corporate coaching structure: Simply.Coach.",
    faq: [
      {
        q: "Is CoachevaOS suitable for corporate/organizational coaching programs?",
        a: "It's built and priced for independent solo coaches and small practices first. If you need compliance reporting and organizational structure specifically, Simply.Coach's focus there is a real, deliberate strength worth weighing.",
      },
    ],
  },
  {
    slug: "delenta-alternative",
    name: "Delenta",
    keyword: "Delenta alternative",
    strengths:
      "Delenta covers a broad feature set with a genuine strength in group coaching and a mobile-first client experience. It's a solid pick for a coach running cohort-based programs.",
    directAnswer:
      "CoachevaOS goes deeper on 1:1 practice operations: an AI daily briefing, lead pipeline, and niche-specific custom fields and metrics, rather than spreading across group coaching and mobile-first delivery as its primary focus.",
    rows: [
      { feature: "Group/cohort coaching support", coachevaos: false, competitor: true },
      { feature: "AI daily briefing across your whole client base", coachevaos: true, competitor: false, emphasize: true },
      { feature: "Lead pipeline (Kanban + CSV import)", coachevaos: true, competitor: "Basic" },
      { feature: "Niche-agnostic starter templates (12+ coaching niches)", coachevaos: true, competitor: false },
      { feature: "1:1 client workspace depth", coachevaos: true, competitor: "Broad, less deep" },
    ],
    bestForFraming:
      "Best for deep 1:1 practice operations with AI-assisted prioritization: CoachevaOS. Best for group coaching and mobile-first delivery: Delenta.",
    faq: [
      {
        q: "Does CoachevaOS support group or cohort coaching?",
        a: "Not as a dedicated feature today. CoachevaOS is built around deep 1:1 client operations. If group/cohort coaching is your primary format, Delenta's focus there is worth considering directly.",
      },
    ],
  },
];

export function getCompetitor(slug: string): CompetitorEntry | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
