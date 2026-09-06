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
  title: "Free Personal Trainer Client Tracker Spreadsheet | Fitness Coaches",
  description:
    "A free client tracker spreadsheet built for personal trainers and fitness coaches: weight, goals, sessions completed, and injury notes. Real CSV download, no signup required.",
  path: "/templates/pt-client-tracker",
  keywords: [
    "personal trainer client tracker template",
    "free PT client tracker spreadsheet",
    "fitness coach client tracker",
    "personal training client management spreadsheet",
    "gym client tracker template",
    "strength coach client tracker",
  ],
});

const FAQ = [
  {
    q: "Can I track body fat % or other measurements beyond weight?",
    a: "The CSV columns are a starting point — add columns for body fat %, measurements, or any metric your training style needs. It's a plain spreadsheet, not a locked template.",
  },
  {
    q: "I'm not a personal trainer — is there a version for other coaching niches?",
    a: "Yes — the generic client tracker template covers life, business, and health coaching without fitness-specific fields. See the niche list below for a coaching-type-specific page.",
  },
  {
    q: "Does this replace a workout-programming app?",
    a: "No — this tracks client relationship data (weight, goals, sessions, injuries), not workout plans or exercise libraries. It's meant to run alongside whatever programming tool you already use.",
  },
];

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

        <NicheApplicability toolLabel="client tracker" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={FAQ} />
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
