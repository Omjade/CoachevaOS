import type { Metadata } from "next";
import Link from "next/link";
import { UsersIcon as Users, CalendarBlankIcon as CalendarBlank, CreditCardIcon as CreditCard } from "@phosphor-icons/react/dist/ssr";
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
  title: "Client Management Software for Coaches | CoachevaOS",
  description:
    "Client management software for coaches: a branded portal, lead-to-client pipeline, custom fields per niche, and an AI daily briefing, all in one dashboard.",
  path: "/client-management-software",
});

const FEATURES = [
  {
    Icon: Users,
    title: "One record per client, not five apps",
    body: "Intake, goals, progress, session notes, tasks, documents, and billing status all live on one client record. No more piecing a client's history together across a spreadsheet, an inbox, and a messaging app.",
  },
  {
    Icon: CalendarBlank,
    title: "Lead pipeline built in",
    body: "A Kanban lead board with CSV/Excel import (AI-assisted column mapping) takes a lead from first contact to a full client record with one click. No separate CRM needed before someone becomes a client.",
  },
  {
    Icon: CreditCard,
    title: "Niche-aware from day one",
    body: "Pick a coaching niche during setup and the client record comes pre-loaded with the fields and metrics that niche actually needs, fully editable, never a fixed template.",
  },
];

const FAQ = [
  {
    q: "What is client management software for coaches?",
    a: "Client management software for coaches centralizes everything about each client relationship (intake, goals, progress, session notes, tasks, documents, and billing status) in one record instead of scattered across a spreadsheet, email, and a messaging app.",
  },
  {
    q: "Can I import my existing client list?",
    a: "Yes, a CSV/Excel import flow with AI-assisted column mapping brings existing clients in directly, without re-typing every record by hand.",
  },
  {
    q: "Does it work for any coaching niche?",
    a: "Yes, CoachevaOS ships starter field/metric templates for 12+ coaching niches (fitness, business, career, life, and more), so a new coach's workspace is useful from the first click rather than an empty settings page.",
  },
];

export default function ClientManagementSoftwarePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Management Software" }]} />
        <Eyebrow className="mb-4">Client Management</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Client management software for coaches
        </h1>
        <DirectAnswer>
          CoachevaOS is client management software for coaches: every client's intake, goals,
          progress, session notes, tasks, documents, and billing status live in one record, fed by a
          built-in lead pipeline and pre-loaded with the fields your coaching niche actually needs.
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
          <p className="mb-4 text-sm text-neutral-200">Bring your existing clients in and see it for yourself.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Coaching CRM", href: "/coaching-crm" },
            { label: "Client portal software", href: "/client-portal" },
            { label: "AI coaching software", href: "/ai-coaching-software" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
