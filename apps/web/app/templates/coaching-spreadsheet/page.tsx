import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon as Download } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Coaching Business Spreadsheet Template | CoachevaOS",
  description:
    "A free coaching business spreadsheet: track revenue per client, sessions delivered, and renewal dates in one place. Real CSV download, no signup required.",
  path: "/templates/coaching-spreadsheet",
});

const COLUMNS = ["Client Name", "Package", "Monthly Revenue", "Sessions This Month", "Status", "Renewal Date", "Notes"];

export default function CoachingSpreadsheetTemplatePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coaching Spreadsheet" }]} />
        <Eyebrow className="mb-4">Free template</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Free coaching business spreadsheet template
        </h1>
        <DirectAnswer>
          A business-side spreadsheet for coaches: revenue per client, sessions delivered this
          month, renewal dates, and status, all in one view so you can see your practice's health
          at a glance. Download the CSV directly, no signup required.
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
          <a href="/templates/coachevaos-coaching-business-tracker.csv" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the business tracker (CSV)
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Outgrown the spreadsheet? See what it looks like as a full client workspace.
          </p>
          <Link href="/features/coaching-dashboard">
            <Button>See the coaching dashboard</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client tracker template", href: "/templates/client-tracker" },
            { label: "How many clients do you need to hit your income goal?", href: "/tools/revenue-calculator" },
            { label: "How to price your coaching packages", href: "/blog/how-to-price-your-coaching-packages" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
