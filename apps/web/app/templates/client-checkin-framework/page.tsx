import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon as Download } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import NicheApplicability from "@/components/NicheApplicability";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Retention & Check-In Framework | Free 15-Minute Template",
  description:
    "A structured 15-minute weekly accountability check-in framework for coaches: 5 time-boxed sections covering wins, commitments, obstacles, focus, and confidence. Free download, no signup.",
  path: "/templates/client-checkin-framework",
  keywords: [
    "client check-in framework",
    "coaching accountability check-in template",
    "weekly client check-in questions",
    "coaching retention framework",
    "accountability coaching template",
  ],
});

const STEPS = [
  { time: "0-3 min", title: "Wins", body: "\"What's one thing that went well since we last talked?\" — always start here." },
  { time: "3-7 min", title: "Commitments review", body: "Go through last session's action items one by one: done / partially done / not done." },
  { time: "7-10 min", title: "Obstacles", body: "\"What got in the way, if anything did?\" — diagnostic, not judgment." },
  { time: "10-13 min", title: "This week's focus", body: "One thing that matters most this week — not five priorities." },
  { time: "13-15 min", title: "Commitment + confidence check", body: "Rate confidence 1-10. Below 7 means the commitment is too big — shrink it now." },
];

export default function ClientCheckinFrameworkPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Check-In Framework" }]} />
        <Eyebrow className="mb-4">Free practice kit</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Client retention & check-in framework: a 15-minute weekly structure
        </h1>
        <DirectAnswer>
          A repeatable, time-boxed 15-minute weekly accountability check-in structure — five
          sections covering wins, commitment review, obstacles, weekly focus, and a confidence
          check — that keeps clients accountable between sessions without a full session's worth
          of time. Works as a live call or a written async check-in. Free download, no signup.
        </DirectAnswer>

        <Card className="mb-8">
          <h2 className="font-heading mb-4 text-sm font-semibold text-neutral-900">The 5-part structure</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((s) => (
              <div key={s.title} className="flex gap-3">
                <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-semibold text-accent-700">
                  {s.time}
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                  <p className="text-xs leading-relaxed text-neutral-600">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-8">
          <h2 className="font-heading mb-2 text-sm font-semibold text-neutral-900">
            Using this with a group or membership program
          </h2>
          <p className="text-xs leading-relaxed text-neutral-600">
            The same five questions work as a written weekly check-in form instead of a live call —
            clients submit async, you review in batches. This is exactly the kind of individual
            tracking inside a group program a client portal is built for.
          </p>
        </Card>

        <div className="mb-10 flex justify-center">
          <a href="/templates/coachevaos-client-checkin-framework.txt" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the check-in framework
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Turn this into a real recurring check-in your clients submit through their own portal.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <NicheApplicability toolLabel="client check-in framework" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion
            items={[
              {
                q: "Does this replace a full coaching session?",
                a: "No — it's an accountability touchpoint between sessions, not a substitute for the deeper work of a real session. It keeps momentum without expanding into a second full session every week.",
              },
              {
                q: "Can this work as a written check-in instead of a call?",
                a: "Yes — the same five questions work equally well as a written form clients fill out weekly, which is often more scalable once you have more than a handful of clients.",
              },
            ]}
          />
        </div>

        <InternalLinkCluster
          links={[
            { label: "Coaching agreement & contract template", href: "/templates/coaching-agreement-template" },
            { label: "Intake discovery question library", href: "/templates/discovery-questions-library" },
            { label: "Client retention strategies that actually work", href: "/blog/client-retention-strategies-that-work" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
