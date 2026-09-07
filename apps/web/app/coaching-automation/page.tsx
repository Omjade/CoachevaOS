import type { Metadata } from "next";
import Link from "next/link";
import { LightningIcon as Lightning, FileTextIcon as FileText, BellIcon as Bell } from "@phosphor-icons/react/dist/ssr";
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
  title: "Coaching Automation Software | Stop Doing Repetitive Admin | CoachevaOS",
  description:
    "Coaching automation software that handles onboarding, session-note follow-ups, and lead-capture forms automatically, so admin stops eating the hours you'd rather coach in.",
  path: "/coaching-automation",
  keywords: [
    "coaching automation software",
    "automate coaching business tasks",
    "coaching workflow automation",
    "coach admin automation",
    "automated client onboarding for coaches",
  ],
});

const FEATURES = [
  {
    Icon: Lightning,
    title: "Automatic new-client onboarding",
    body: "When a new client completes intake, CoachevaOS can automatically draft a welcome message, suggested goals, and a first check-in task. A coach reviews and accepts before anything sends.",
  },
  {
    Icon: FileText,
    title: "Session notes into follow-ups, automatically",
    body: "The AI session assistant turns a session note (typed or a short voice recording) into a summary, action items, and a draft follow-up message in one step.",
  },
  {
    Icon: Bell,
    title: "Notifications that do the checking for you",
    body: "Meeting reminders, overdue tasks, subscription expirations, and stale leads all surface automatically. Nobody has to remember to go looking.",
  },
];

const FAQ = [
  {
    q: "What can coaching automation software actually automate?",
    a: "In CoachevaOS: new-client onboarding drafts (welcome message, suggested goals, first task), session notes turning into follow-up drafts, and automatic notifications for meetings, overdue tasks, and stale leads. Every AI-drafted item is reviewed by the coach before it reaches a client.",
  },
  {
    q: "Will automation ever message a client without me reviewing it first?",
    a: "No, every automated draft (onboarding welcome message, follow-up, suggested goals) is reviewed and can be edited by the coach before anything is sent or assigned.",
  },
];

export default function CoachingAutomationPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coaching Automation" }]} />
        <Eyebrow className="mb-4">Automation</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Coaching automation software that handles the repetitive admin
        </h1>
        <DirectAnswer>
          CoachevaOS automates the repetitive parts of running a coaching practice: new-client
          onboarding drafts, session notes turned into follow-ups, and automatic reminders for
          meetings, tasks, and stale leads, so a coach's time goes back into actual coaching, not
          admin.
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
          <p className="mb-4 text-sm text-neutral-200">See how much admin CoachevaOS takes off your plate.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "AI coaching software", href: "/ai-coaching-software" },
            { label: "Client portal software", href: "/client-portal" },
            { label: "CoachevaOS vs. CoachAccountable", href: "/compare/coachaccountable-alternative" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
