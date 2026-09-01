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
  title: "Free Personal Trainer Client Tracker Spreadsheet | CoachevaOS",
  description:
    "A free client tracker spreadsheet built for personal trainers: weight, goals, sessions completed, and injury notes. Real CSV download, no signup required.",
  path: "/templates/pt-client-tracker",
});

const COLUMNS = [
  "Client Name",
  "Email",
  "Program",
  "Start Weight",
  "Current Weight",
  "Goal",
  "Sessions Completed",
  "Next Session",
  "Injuries / Notes",
];

export default function PTClientTrackerTemplatePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "PT Client Tracker" }]} />
        <Eyebrow className="mb-4">Free template</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Free personal trainer client tracker spreadsheet
        </h1>
        <DirectAnswer>
          A client tracker built for personal trainers: starting and current weight, goals,
          sessions completed, next session, and injury notes, all in one row per client. Download
          the CSV directly, no signup required.
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
          <a href="/templates/coachevaos-pt-client-tracker.csv" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the PT client tracker (CSV)
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Outgrown the spreadsheet? CoachevaOS pairs with your workout-programming tool for the
            rest of your practice.
          </p>
          <Link href="/solutions/fitness">
            <Button>See CoachevaOS for fitness coaches</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client tracker template", href: "/templates/client-tracker" },
            { label: "CoachevaOS for fitness coaches", href: "/solutions/fitness" },
            { label: "How many clients can you realistically manage?", href: "/tools/capacity-calculator" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
