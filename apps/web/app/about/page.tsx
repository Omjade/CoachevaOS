import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow, Button } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About CoachevaOS | Coaching Client Management Software for Any Niche",
  description:
    "CoachevaOS is client and practice management software for independent coaches: a branded client portal, scheduling, billing, a lead pipeline, and an AI daily briefing — built for life, business, health, fitness, executive, and any other 1:1 coaching niche.",
  path: "/about",
  keywords: [
    "coaching software",
    "coaching client management software",
    "coaching practice management platform",
    "client portal for coaches",
    "coaching CRM",
    "AI coaching software",
    "independent coach software",
    "solo coaching business software",
  ],
});

const FEATURES = [
  { label: "Branded client portal", body: "Each client gets their own home for the relationship, not a shared inbox thread." },
  { label: "Scheduling & booking", body: "Session booking tied to your real availability, with Google Meet, Zoom, Calendly, and Cal.com support." },
  { label: "Billing & payment tracking", body: "Payment and subscription status visible per client, so nothing gets missed at renewal." },
  { label: "Lead pipeline", body: "A Kanban board for growing your own practice, from first contact to signed client." },
  { label: "AI daily briefing", body: "One morning summary of who needs your attention today, drafted from real client activity." },
  { label: "Niche-specific custom fields", body: "Starter templates for 12+ coaching niches, fully editable to match how you actually work." },
];

const NICHES = [
  "Life coaches",
  "Business coaches",
  "Health & nutrition coaches",
  "Fitness coaches & personal trainers",
  "Executive & leadership coaches",
  "Career coaches",
  "Relationship coaches",
  "Mindset & wellness coaches",
  "Academic coaches",
  "Sports performance coaches",
  "Parenting coaches",
  "Financial coaches",
];

const BELIEFS = [
  {
    heading: "You own your data",
    body: "Every client record, note, and conversation belongs to your practice. If you ever leave, it leaves with you.",
  },
  {
    heading: "Built for solo practices, not enterprises",
    body: "No seat licenses, no admin hierarchies to configure. CoachevaOS is sized for one coach running their own business, from day one to two hundred clients.",
  },
  {
    heading: "AI that drafts, you approve",
    body: "Every AI-generated message, follow-up, or plan is a draft you review before anything reaches a client. Nothing is ever sent on your behalf automatically.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <Eyebrow className="mb-4">About</Eyebrow>
        <h1 className="font-heading mb-5 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
          Coaching client management software, built around the actual job
        </h1>
        <div className="mb-10 flex flex-col gap-4 text-sm leading-relaxed text-neutral-600">
          <p>
            CoachevaOS is client and practice management software for independent coaches —
            not a course platform, not a coaching marketplace, and not workout- or
            meal-programming software. It's the operating system around your coaching: client
            records, a branded portal, scheduling, billing, a lead pipeline, and an AI daily
            briefing, in one connected workspace.
          </p>
          <p>
            Most independent coaches run their practice across five tools that were never
            designed to talk to each other: a spreadsheet for client progress, WhatsApp for
            day-to-day messages, email for follow-ups, Calendly for bookings, and a Google Drive
            folder for everything else. Nothing shares context, so every client relationship
            lives in fragments across your phone and laptop. CoachevaOS started from that exact
            frustration.
          </p>
        </div>

        <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
          What CoachevaOS actually does
        </h2>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.label}>
              <h3 className="font-heading mb-1.5 text-sm font-semibold text-neutral-900">{f.label}</h3>
              <p className="text-xs leading-relaxed text-neutral-600">{f.body}</p>
            </Card>
          ))}
        </div>

        <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
          Who it's for
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-neutral-600">
          CoachevaOS is niche-agnostic by design — the same platform works for any 1:1 coaching
          practice, with starter templates pre-loaded for:
        </p>
        <div className="mb-12 flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <span key={n} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-[0_4px_10px_rgba(28,29,31,0.06)]">
              {n}
            </span>
          ))}
        </div>

        <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
          What we believe
        </h2>
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BELIEFS.map((b) => (
            <Card key={b.heading}>
              <h3 className="font-heading mb-2 text-sm font-semibold text-neutral-900">{b.heading}</h3>
              <p className="text-xs leading-relaxed text-neutral-600">{b.body}</p>
            </Card>
          ))}
        </div>

        <div className="rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            See it running with your own clients — free for 14 days, no card required to start.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
