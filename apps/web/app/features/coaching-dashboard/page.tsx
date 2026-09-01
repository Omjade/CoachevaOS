import type { Metadata } from "next";
import Link from "next/link";
import { SparkleIcon as Sparkle, UsersThreeIcon as UsersThree, ChartBarIcon as ChartBar } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Coaching Dashboard | Your AI Daily Command Center | CoachevaOS",
  description:
    "The coach's own dashboard: an AI daily briefing across your whole client base, growth charts, lead funnel, and a needs-attention panel in one view.",
  path: "/features/coaching-dashboard",
});

const FAQ = [
  {
    q: "What's on a coach's own dashboard?",
    a: "An AI daily briefing (who needs attention today), a needs-attention panel with reasons and suggested actions, client growth and lead-funnel charts, and a weekly digest: the whole practice's status in one view each morning.",
  },
  {
    q: "Does the dashboard update in real time?",
    a: "The AI briefing regenerates when underlying data actually changes (not just once a day on a stale cache), and a manual refresh button is available any time.",
  },
];

export default function CoachingDashboardFeaturePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coaching Dashboard" }]} />
        <Eyebrow className="mb-4">Feature</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          A coaching dashboard built as an AI daily command center
        </h1>
        <DirectAnswer>
          CoachevaOS's coaching dashboard opens every morning with an AI briefing prioritizing your
          entire client base, a needs-attention panel with a reason and a suggested next step per
          client, and growth/lead-funnel charts: one view instead of piecing your practice's status
          together from five apps.
        </DirectAnswer>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <Sparkle className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">AI daily briefing</h2>
            <p className="text-sm text-neutral-600">Who hasn't replied, whose check-ins have gone quiet, who's overdue, every morning.</p>
          </Card>
          <Card>
            <UsersThree className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Needs-attention panel</h2>
            <p className="text-sm text-neutral-600">Each flagged client comes with a reason and a concrete suggested next step, not just a red dot.</p>
          </Card>
          <Card>
            <ChartBar className="mb-2 h-6 w-6 text-accent-600" weight="fill" />
            <h2 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Growth &amp; funnel charts</h2>
            <p className="text-sm text-neutral-600">Client growth, lead funnel, and engagement trend, computed from your own real data.</p>
          </Card>
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">See your own practice's dashboard on day one.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "AI coaching software", href: "/ai-coaching-software" },
            { label: "Client dashboard", href: "/features/client-dashboard" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
