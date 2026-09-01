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
  title: "Free Client Tracker Template for Coaches | CoachevaOS",
  description:
    "A free client tracker spreadsheet for coaches: name, contact, program, status, next session, and notes. Real CSV download, no signup required.",
  path: "/templates/client-tracker",
});

const COLUMNS = [
  "Client Name",
  "Email",
  "Phone",
  "Program",
  "Start Date",
  "Status",
  "Next Session",
  "Last Contact",
  "Notes",
];

export default function ClientTrackerTemplatePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Tracker Template" }]} />
        <Eyebrow className="mb-4">Free template</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Free client tracker template for coaches
        </h1>
        <DirectAnswer>
          A ready-to-use spreadsheet for tracking every client's contact info, program, status, and
          next session in one place. Download the CSV, open it directly in Google Sheets or Excel,
          and start filling it in. No signup, no email required.
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
          <a href="/templates/coachevaos-client-tracker.csv" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the client tracker (CSV)
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Outgrown the spreadsheet? See what it looks like as a full client workspace.
          </p>
          <Link href="/features/client-dashboard">
            <Button>See the client dashboard</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Coaching business tracker template", href: "/templates/coaching-spreadsheet" },
            { label: "Client dashboard template", href: "/templates/client-dashboard" },
            { label: "Client management software for coaches", href: "/client-management-software" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
