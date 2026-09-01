import type { Metadata } from "next";
import Link from "next/link";
import { PaintBrushIcon as PaintBrush, ChatCircleTextIcon as ChatCircleText, CheckSquareIcon as CheckSquare } from "@phosphor-icons/react/dist/ssr";
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
  title: "Coach Client Portal Software | CoachevaOS",
  description:
    "A branded client portal for coaches: messaging, session booking, check-ins, progress, and documents in one place your clients actually use.",
  path: "/client-portal",
});

const FEATURES = [
  {
    Icon: PaintBrush,
    title: "Branded, not generic",
    body: "Each coach gets their own portal link at their own slug. Clients land on a workspace that feels like your practice, not a shared third-party tool.",
  },
  {
    Icon: ChatCircleText,
    title: "Messaging, booking, and check-ins together",
    body: "Clients message you directly, book sessions against your real availability (with Google Meet/Zoom/Calendly/Cal.com integration), and submit daily or weekly check-ins. No separate WhatsApp, Calendly, or email thread needed.",
  },
  {
    Icon: CheckSquare,
    title: "Progress and goals clients can actually see",
    body: "Goals, task lists, and a progress timeline are visible to the client themselves, not locked inside the coach's own notes, so a client can see their own trajectory between sessions.",
  },
];

const FAQ = [
  {
    q: "What should a good client portal actually feel like?",
    a: "A client portal should feel like one calm, branded home for the coaching relationship: messaging, booking, check-ins, and progress in one place, rather than a generic shared dashboard or a patchwork of separate apps.",
  },
  {
    q: "Can clients book sessions directly through the portal?",
    a: "Yes, clients book against the coach's real connected availability, with a real Google Meet or Zoom link generated automatically once a coach has connected one of those providers.",
  },
];

export default function ClientPortalPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Client Portal" }]} />
        <Eyebrow className="mb-4">Client Portal</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Coach client portal software
        </h1>
        <DirectAnswer>
          CoachevaOS gives every coach a branded client portal: messaging, session booking against
          real availability, check-ins, and a visible progress timeline, so clients have one calm
          place to go instead of a scattered mix of WhatsApp, Calendly, and email.
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
          <p className="mb-4 text-sm text-neutral-200">Give your clients a branded home for the relationship.</p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          links={[
            { label: "Client management software for coaches", href: "/client-management-software" },
            { label: "Coaching automation software", href: "/coaching-automation" },
            { label: "CoachevaOS vs. Paperbell", href: "/compare/paperbell-alternative" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
