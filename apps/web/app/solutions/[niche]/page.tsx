import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button, Card } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import Testimonial from "@/components/Testimonial";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";
import { nicheDisplayLabel } from "@/lib/niche";
import { SOLUTIONS, getSolution } from "@/lib/solutions-data";
import { COMPETITORS } from "@/lib/compare-data";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ niche: s.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ niche: string }>;
}): Promise<Metadata> {
  const { niche } = await params;
  const s = getSolution(niche);
  if (!s) return {};
  const label = nicheDisplayLabel(s.value);
  return buildMetadata({
    title: `${s.keyword} | Built for ${label}s | CoachevaOS`,
    description: s.directAnswer.slice(0, 155),
    path: `/solutions/${s.value}`,
  });
}

export default async function SolutionPage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche: nicheParam } = await params;
  const s = getSolution(nicheParam);
  if (!s) notFound();
  const label = nicheDisplayLabel(s.value);

  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `${label}s` }]} />
        <Eyebrow className="mb-4">{label}</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          Coaching practice management software, built for {label.toLowerCase()}s
        </h1>
        <DirectAnswer>{s.directAnswer}</DirectAnswer>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-heading mb-1.5 text-sm font-semibold text-neutral-900">The problem</h2>
            <p className="text-sm leading-relaxed text-neutral-600">{s.pain}</p>
          </Card>
          <Card>
            <h2 className="font-heading mb-1.5 text-sm font-semibold text-neutral-900">
              With CoachevaOS
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">{s.outcome}</p>
          </Card>
        </div>

        <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
          What CoachevaOS tracks for you, from day one
        </h2>
        <div className="mb-8 rounded-[16px] border border-neutral-200 bg-white p-5">
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {s.tracks.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="h-4 w-4 shrink-0 text-accent-600" weight="bold" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            Every field above is fully editable. This is a starting point pre-loaded for {label.toLowerCase()}s,
            not a fixed template.
          </p>
        </div>

        {s.personaTerms && (
          <div className="mb-8">
            <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
              Built for every kind of {label.toLowerCase()}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {s.personaTerms.map((term) => (
                <div key={term} className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                  {term}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10">
          <Testimonial niche={label.replace(" Coach", "")} />
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={s.faq} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            Start your free trial as a {label.toLowerCase()}: your workspace comes pre-loaded, ready to go.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          title="See how CoachevaOS compares"
          links={COMPETITORS.slice(0, 3).map((c) => ({ label: `CoachevaOS vs. ${c.name}`, href: `/compare/${c.slug}` }))}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
