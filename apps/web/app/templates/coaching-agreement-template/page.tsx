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
  title: "Free Coaching Agreement & Contract Template | Download",
  description:
    "A free coaching agreement and contract template covering scope, fees, cancellation policy, confidentiality, and liability — a real starting framework for any coaching practice, no signup required.",
  path: "/templates/coaching-agreement-template",
  keywords: [
    "coaching agreement template",
    "coaching contract template",
    "free coaching contract",
    "life coach agreement template",
    "business coach contract template",
    "coaching client agreement",
  ],
});

const SECTIONS = [
  { title: "1. Scope of coaching", body: "Defines what coaching is (and isn't) — critical for setting expectations that coaching isn't therapy, medical, financial, or legal advice." },
  { title: "2. Session structure", body: "Frequency, length, and format, so there's no ambiguity about what the client is actually paying for." },
  { title: "3. Fees and payment", body: "Amount, schedule, accepted methods, and what happens on late payment — spelled out before it's ever an awkward conversation." },
  { title: "4. Cancellation and rescheduling", body: "A clear notice-period policy protects your calendar and your income from last-minute no-shows." },
  { title: "5. Confidentiality", body: "What you keep private, and the narrow legal exceptions (like risk of harm) where you don't." },
  { title: "6. Client responsibilities", body: "Names that results depend on the client's own effort, not a guarantee you're making." },
  { title: "7. Limitation of liability", body: "Protects you from being held responsible for decisions a client makes based on coaching conversations." },
  { title: "8. Term and termination", body: "How either party can end the engagement, and what happens to sessions already paid for." },
  { title: "9. Signatures", body: "Makes it a real, mutually agreed document, not just a policy page." },
];

export default function CoachingAgreementTemplatePage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coaching Agreement Template" }]} />
        <Eyebrow className="mb-4">Free practice kit</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Free coaching agreement & contract template
        </h1>
        <DirectAnswer>
          A ready-to-adapt coaching agreement template covering scope, session structure, fees,
          cancellation policy, confidentiality, liability, and termination — the nine sections
          every coaching contract needs. Not legal advice; have a lawyer in your jurisdiction
          review before use. Download directly, no signup required.
        </DirectAnswer>

        <Card className="mb-8">
          <h2 className="font-heading mb-3 text-sm font-semibold text-neutral-900">What's in it</h2>
          <div className="flex flex-col gap-3">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                <p className="text-xs leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mb-10 flex justify-center">
          <a href="/templates/coachevaos-coaching-agreement-template.txt" download>
            <Button>
              <Download className="h-4 w-4" weight="bold" />
              Download the agreement template
            </Button>
          </a>
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Once a client signs, keep their agreement, notes, and billing status in one branded portal.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <NicheApplicability toolLabel="coaching agreement template" />

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion
            items={[
              {
                q: "Is this a legally binding contract I can use as-is?",
                a: "It's a starting framework covering the sections a real coaching agreement typically needs, not a finished legal document. Have a lawyer in your jurisdiction review and adapt it before using it with real clients.",
              },
              {
                q: "Does this work for any coaching niche?",
                a: "Yes — the structure (scope, fees, cancellation, confidentiality, liability) applies to life, business, health, fitness, executive, or any other 1:1 coaching practice. Only the scope-of-coaching section needs your specific niche filled in.",
              },
            ]}
          />
        </div>

        <InternalLinkCluster
          links={[
            { label: "Intake discovery question library", href: "/templates/discovery-questions-library" },
            { label: "Client retention & check-in framework", href: "/templates/client-checkin-framework" },
            { label: "How to price your coaching packages", href: "/blog/how-to-price-your-coaching-packages" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
