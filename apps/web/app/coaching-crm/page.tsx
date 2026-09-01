import type { Metadata } from "next";
import Link from "next/link";
import { KanbanIcon as Kanban, ChatCircleIcon as ChatCircle, ChartLineUpIcon as ChartLineUp } from "@phosphor-icons/react/dist/ssr";
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
  title: "Coaching CRM | A CRM That Remembers the Relationship | CoachevaOS",
  description:
    "A coaching CRM built around the coaching relationship, not a generic sales pipeline: leads, client history, session context, and an AI daily briefing in one place.",
  path: "/coaching-crm",
});

const FEATURES = [
  {
    Icon: Kanban,
    title: "A real lead pipeline, not a spreadsheet",
    body: "New, contacted, follow-up, and booked stages on a drag-and-drop Kanban board, with CSV import and a stale-lead indicator so nobody sits untouched for weeks unnoticed.",
  },
  {
    Icon: ChatCircle,
    title: "Client memory, not just contact info",
    body: "A generic CRM remembers a deal stage. CoachevaOS remembers the coaching relationship: goals, session notes, check-ins, and progress history, all tied to the same client record a lead became.",
  },
  {
    Icon: ChartLineUp,
    title: "AI prioritization across your whole pipeline",
    body: "The AI daily briefing spans both sides: which leads are going stale and which active clients need attention, in one morning read instead of two separate systems.",
  },
];

const FAQ = [
  {
    q: "How is a coaching CRM different from a generic CRM like HubSpot?",
    a: "A generic CRM tracks a sales pipeline and stops there. A coaching CRM like CoachevaOS carries a lead straight into an ongoing coaching relationship (goals, session notes, progress, and billing) in the same record, with AI prioritization spanning both.",
  },
  {
    q: "Can I import leads from a spreadsheet or another CRM export?",
    a: "Yes, CSV/Excel import with AI-assisted column mapping brings existing leads or clients in directly.",
  },
];

export default function CoachingCRMPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coaching CRM" }]} />
        <Eyebrow className="mb-4">Coaching CRM</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          A coaching CRM that remembers the relationship, not just the lead
        </h1>
        <DirectAnswer>
          CoachevaOS is a coaching CRM built specifically for the coaching relationship: a
          drag-and-drop lead pipeline that converts into a full client record with one click, so
          goals, session notes, and progress carry forward instead of resetting in a second system
          once someone becomes a client.
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
          <p className="mb-4 text-sm text-neutral-200">See a lead go from first contact to client in one click.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client management software for coaches", href: "/client-management-software" },
            { label: "CoachevaOS vs. Delenta", href: "/compare/delenta-alternative" },
            { label: "Coaching automation software", href: "/coaching-automation" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
