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
  title: "25 Intake Discovery Questions for a New Coaching Client | Free Library",
  description:
    "25 powerful discovery questions to ask a new client before their first session, grouped by background, goals, obstacles, working style, and commitment. Free download, no signup.",
  path: "/templates/discovery-questions-library",
  keywords: [
    "discovery questions for coaching",
    "intake questions for coaching clients",
    "executive coach discovery questions",
    "life coach intake questions",
    "coaching first session questions",
    "new client intake questionnaire",
  ],
});

const GROUPS = [
  {
    title: "Background & context",
    questions: [
      "What brought you to coaching right now, specifically?",
      "What have you already tried, and what happened?",
      "What does a typical week actually look like for you?",
    ],
  },
  {
    title: "Goals & outcomes",
    questions: [
      "If this is a complete success, what's different in 90 days?",
      "What would make you feel this was a waste of time?",
      "Is this goal actually yours, or something you feel you 'should' want?",
    ],
  },
  {
    title: "Obstacles & patterns",
    questions: [
      "What's the real reason you haven't solved this yourself already?",
      "What tends to derail you when you're making progress?",
      "Is there a pattern you're worried might repeat here?",
    ],
  },
  {
    title: "Working style & preferences",
    questions: [
      "Do you do better with structure, or room to figure it out yourself?",
      "How do you want to be held accountable?",
      "How much time can you realistically commit between sessions?",
    ],
  },
  {
    title: "Success metrics & commitment",
    questions: [
      "How will you know a session went well, without me telling you?",
      "What would you need to see in month one to trust this process?",
      "What are you willing to give up to make room for this?",
    ],
  },
];

export default function DiscoveryQuestionsLibraryPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Discovery Questions Library" }]} />
        <Eyebrow className="mb-4">Free practice kit</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          25 discovery questions for a new client's first session
        </h1>
        <DirectAnswer>
          A library of 25 discovery questions, grouped into five categories, designed to surface
          what actually matters before a first coaching session: real motivation, honest obstacles,
          working style, and genuine commitment — not just surface-level goals. Free download, no
          signup required.
        </DirectAnswer>

        <div className="mb-8 flex flex-col gap-4">
          {GROUPS.map((g) => (
            <Card key={g.title}>
              <h2 className="font-heading mb-2 text-sm font-semibold text-neutral-900">{g.title}</h2>
              <ul className="flex flex-col gap-1.5">
                {g.questions.map((q) => (
                  <li key={q} className="text-xs leading-relaxed text-neutral-600">
                    "{q}"
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-neutral-400">
                Full set of 25 (5 per category) in the downloadable version.
              </p>
            </Card>
          ))}
        </div>

        <div className="mb-10 flex justify-center">
          <a href="/templates/coachevaos-discovery-questions-library.txt" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download all 25 questions
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Save a client's discovery answers straight into their profile — no separate intake doc to lose track of.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <NicheApplicability toolLabel="discovery question library" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion
            items={[
              {
                q: "Should I ask all 25 questions in one intake call?",
                a: "No — pick 6-8 that fit your niche and the time you have. Asking all 25 in one sitting turns a discovery conversation into an interrogation.",
              },
              {
                q: "Are these questions specific to executive coaching, or do they work for any niche?",
                a: "They're written to be niche-agnostic — the same questions surface real motivation and obstacles whether you're a life coach, business coach, health coach, or executive coach. Adapt the phrasing to your own voice.",
              },
            ]}
          />
        </div>

        <InternalLinkCluster
          links={[
            { label: "Coaching agreement & contract template", href: "/templates/coaching-agreement-template" },
            { label: "Client retention & check-in framework", href: "/templates/client-checkin-framework" },
            { label: "Client onboarding checklist every coach needs", href: "/blog/client-onboarding-checklist-for-coaches" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
