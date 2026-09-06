import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon as Download } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import NicheApplicability from "@/components/NicheApplicability";
import FAQAccordion from "@/components/FAQAccordion";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Client Dashboard Template for Coaches | Any Coaching Niche",
  description:
    "A free at-a-glance client dashboard template: status, package value, last/next session, and an engagement flag per client. Works for life, business, health, and executive coaches. Real CSV download, no signup required.",
  path: "/templates/client-dashboard",
  keywords: [
    "client dashboard template for coaches",
    "coaching client status tracker",
    "free coach dashboard spreadsheet",
    "life coach dashboard template",
    "business coach client dashboard",
    "coaching engagement tracker template",
  ],
});

const FAQ = [
  {
    q: "What does the green/yellow/red engagement flag mean?",
    a: "It's a manual at-a-glance signal you set per client — green for on-track, yellow for needs a check-in, red for at risk of churning — so you can scan the sheet and know who needs attention without reading every row.",
  },
  {
    q: "Is this dashboard template specific to one coaching niche?",
    a: "No — status, package value, and session dates apply the same way whether you're a life coach, business coach, health coach, or executive coach. Nothing in it is fitness- or niche-specific.",
  },
  {
    q: "How is this different from CoachevaOS's real client dashboard?",
    a: "This spreadsheet needs manual updates to the engagement flag and session dates. CoachevaOS's actual dashboard updates automatically and uses AI to flag at-risk clients before you'd notice manually — this template is the free, manual starting point.",
  },
];

const COLUMNS = [
  "Client Name",
  "Status",
  "Package",
  "Monthly Value",
  "Last Session",
  "Next Session",
  "Engagement (Green/Yellow/Red)",
  "Notes",
];

export default function ClientDashboardTemplatePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Dashboard Template" }]} />
        <Eyebrow className="mb-4">Free template</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Free client dashboard template for coaches
        </h1>
        <DirectAnswer>
          A simple at-a-glance dashboard: every client's status, package value, last and next
          session, and a green/yellow/red engagement flag so you can spot who needs attention
          without reading every row. Download the CSV directly, no signup required.
        </DirectAnswer>

        <Card className="mb-8">
          <h2 className="font-heading mb-3 text-sm font-semibold text-neutral-900">What's in it</h2>
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map((c) => (
              <span
                key={c}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                {c}
              </span>
            ))}
          </div>
        </Card>

        <div className="mb-10 flex justify-center">
          <a href="/templates/coachevaos-client-dashboard-template.csv" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the dashboard template (CSV)
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            A spreadsheet needs manual updates. CoachevaOS's dashboard flags who needs attention
            automatically, every morning.
          </p>
          <Link href="/features/client-dashboard">
            <Button>See the real client dashboard</Button>
          </Link>
        </div>

        <NicheApplicability toolLabel="client dashboard template" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client tracker template", href: "/templates/client-tracker" },
            { label: "Client dashboard feature", href: "/features/client-dashboard" },
            { label: "AI coaching software", href: "/ai-coaching-software" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
