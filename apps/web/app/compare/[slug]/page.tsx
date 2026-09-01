import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/ssr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Eyebrow, Button } from "@/components/ui";
import Breadcrumbs from "@/components/Breadcrumbs";
import DirectAnswer from "@/components/DirectAnswer";
import ComparisonTable from "@/components/ComparisonTable";
import Testimonial from "@/components/Testimonial";
import FAQAccordion from "@/components/FAQAccordion";
import InternalLinkCluster from "@/components/InternalLinkCluster";
import { buildMetadata } from "@/lib/seo";
import { COMPETITORS, getCompetitor } from "@/lib/compare-data";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return {};
  return buildMetadata({
    title: `${c.keyword} | CoachevaOS vs. ${c.name}`,
    description: `Comparing CoachevaOS and ${c.name} for coaching practice management: features, AI, and who each is actually best for.`,
    path: `/compare/${c.slug}`,
  });
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();

  const otherCompetitors = COMPETITORS.filter((x) => x.slug !== c.slug).slice(0, 3);

  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `vs. ${c.name}` }]} />
        <Eyebrow className="mb-4">Comparison</Eyebrow>
        <h1 className="font-heading mb-5 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
          CoachevaOS vs. {c.name}: Which Coaching Platform Is Right for You?
        </h1>
        <DirectAnswer>{c.directAnswer}</DirectAnswer>

        <div className="mb-8 rounded-[16px] border border-neutral-200 bg-white p-5">
          <h2 className="font-heading mb-2 text-sm font-semibold text-neutral-900">
            What {c.name} does well
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">{c.strengths}</p>
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Feature-by-feature comparison
        </h2>
        <div className="mb-8">
          <ComparisonTable competitorName={c.name} rows={c.rows} />
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-[16px] border border-accent-200 bg-accent-100/40 p-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" weight="fill" />
          <p className="text-sm leading-relaxed text-neutral-800">{c.bestForFraming}</p>
        </div>

        <div className="mb-10">
          <Testimonial />
        </div>

        <h2 className="font-heading mb-4 text-xl font-semibold text-neutral-900">
          Frequently asked questions
        </h2>
        <div className="mb-10">
          <FAQAccordion items={c.faq} />
        </div>

        <div className="mb-10 rounded-[16px] bg-neutral-900 p-6 text-center">
          <p className="mb-4 text-sm text-neutral-200">
            See CoachevaOS's AI daily briefing and client portal for yourself.
          </p>
          <Link href="/signup">
            <Button>Start your free trial</Button>
          </Link>
        </div>

        <InternalLinkCluster
          title="Other comparisons"
          links={otherCompetitors.map((x) => ({ label: `CoachevaOS vs. ${x.name}`, href: `/compare/${x.slug}` }))}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
