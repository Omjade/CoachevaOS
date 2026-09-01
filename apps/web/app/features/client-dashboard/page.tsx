import type { Metadata } from "next";
import Link from "next/link";
import { SquaresFourIcon as SquaresFour, TargetIcon as Target, ClockCounterClockwiseIcon as ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Dashboard for Coaches | CoachevaOS",
  description:
    "A personalized client workspace: goals, progress timeline, tasks, custom fields, and session history, all on one dashboard per client.",
  path: "/features/client-dashboard",
});

const FAQ = [
  {
    q: "What shows up on a client's dashboard?",
    a: "Goals, a visual progress timeline, upcoming tasks, custom fields relevant to their coaching niche, session history, and (if enabled) an AI progress summary, all scoped to that one client.",
  },
  {
    q: "Can a client see their own dashboard, or is it coach-only?",
    a: "Both. The coach sees the full client-management view, and the client sees a lighter version of the same data (their own goals, progress, and tasks) in their own portal.",
  },
];

export default function ClientDashboardFeaturePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Dashboard" }]} />
        <Eyebrow className="mb-4">Feature</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          A personalized client dashboard, not a shared spreadsheet row
        </h1>
        <DirectAnswer>
          CoachevaOS's client dashboard brings a client's goals, progress timeline, tasks, custom
          fields, and session history into one personalized workspace: the same view a coach uses
          to manage the relationship, and a lighter version the client sees in their own portal.
        </DirectAnswer>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <Target className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Goals &amp; progress</h2>
            <p className="text-sm text-neutral-600">An open-ended goal list with a visual progress timeline, not a fixed milestone template.</p>
          </Card>
          <Card>
            <SquaresFour className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Niche-specific fields</h2>
            <p className="text-sm text-neutral-600">Custom fields and metrics pre-loaded per coaching niche, fully editable per client.</p>
          </Card>
          <Card>
            <ClockCounterClockwise className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Full history in view</h2>
            <p className="text-sm text-neutral-600">Session notes, check-ins, tasks, and documents merged into one timeline per client.</p>
          </Card>
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">See what a client's own dashboard looks like.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client management software for coaches", href: "/client-management-software" },
            { label: "Coaching dashboard for coaches", href: "/features/coaching-dashboard" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
