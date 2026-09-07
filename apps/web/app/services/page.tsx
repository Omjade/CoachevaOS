import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow, Button } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SOLUTIONS } from "@/lib/solutions-data";
import { nicheDisplayLabel } from "@/lib/niche";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Services | Everything CoachevaOS Gives Your Coaching Practice",
  description:
    "Everything CoachevaOS gives an independent coach: client workspace, lead pipeline, branded portal, AI daily briefing, and niche-ready templates for any coaching practice.",
  path: "/services",
  keywords: [
    "coaching software features",
    "coaching platform services",
    "client management software features",
    "coaching CRM features",
    "AI coaching platform features",
    "coaching practice management services",
  ],
});

const SERVICES = [
  {
    title: "Client workspace",
    body: "Every client's chat history, progress, session notes, goals, and tasks live in one connected view, not spread across five open tabs. Log a check-in, message a client, or review a session note without switching apps.",
  },
  {
    title: "Lead pipeline",
    body: "Every inbound lead moves through a real pipeline (new, contacted, follow-up, booked) instead of a spreadsheet you forget to update. Convert a lead to a client in one click once they're ready.",
  },
  {
    title: "Branded client portal",
    body: "Each coach gets their own onboarding link and portal, where clients message you directly, book sessions against your real availability, and submit check-ins, with no separate booking tool or shared inbox required.",
  },
  {
    title: "AI daily briefing",
    body: "Instead of a dashboard you have to interpret, open the app to a morning briefing that already knows who hasn't replied, whose check-ins have gone quiet, and who's overdue for a session.",
  },
  {
    title: "Niche-ready templates",
    body: "Pick your coaching niche during setup and your workspace comes pre-loaded with relevant fields and metrics (body weight and steps for fitness, revenue and leads for business, applications and interviews for career coaching), fully editable from there.",
  },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} />
        <Eyebrow className="mb-4">Services</Eyebrow>
        <h1 className="font-heading mb-3 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
          Everything your coaching practice needs, in one place
        </h1>
        <p className="mb-12 max-w-lg text-sm leading-relaxed text-neutral-600">
          CoachevaOS isn&apos;t a bundle of separate tools. It&apos;s one workspace built around
          the actual coaching relationship.
        </p>

        <div className="flex flex-col gap-4">
          {SERVICES.map((s) => (
            <Card key={s.title}>
              <h2 className="font-heading mb-2 text-lg font-semibold text-neutral-900">{s.title}</h2>
              <p className="text-sm leading-relaxed text-neutral-600">{s.body}</p>
            </Card>
          ))}
        </div>

        <h2 className="font-heading mt-12 mb-4 text-2xl font-semibold tracking-tight text-neutral-900">
          Built for your coaching niche
        </h2>
        <p className="mb-6 max-w-lg text-sm leading-relaxed text-neutral-600">
          Every niche below gets its own pre-loaded fields, metrics, and AI context, no generic
          one-size-fits-all setup.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.value}
              href={`/solutions/${s.value}`}
              className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-accent-300 hover:text-accent-700"
            >
              {nicheDisplayLabel(s.value)}
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            See all of this running with your own clients, free for 14 days.
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
