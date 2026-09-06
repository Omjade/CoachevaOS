import Link from "next/link";
import { SOLUTIONS } from "@/lib/solutions-data";
import { nicheDisplayLabel } from "@/lib/niche";

// Renders real, crawlable links to every /solutions/[niche] page from a
// tools/templates page — the niche pages existed with zero inbound links
// from these otherwise-orphaned free-tool pages, and this is genuine
// on-page content (not meta-only keyword stuffing), so it earns relevance
// for niche-specific searches ("capacity calculator for life coaches") on
// its own, not just via <meta keywords>.
export default function NicheApplicability({ toolLabel }: { toolLabel: string }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading mb-3 text-xl font-semibold text-neutral-900">
        Built for every kind of 1:1 coaching practice
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">
        This {toolLabel} works the same way regardless of your niche — the math is identical whether
        you run a life coaching practice, a business coaching practice, or a personal training
        business. Jump to your specific practice type below to see what CoachevaOS pre-loads for it:
      </p>
      <div className="flex flex-wrap gap-2">
        {SOLUTIONS.map((s) => (
          <Link
            key={s.value}
            href={`/solutions/${s.value}`}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-accent-600 hover:text-accent-600"
          >
            {nicheDisplayLabel(s.value)}
          </Link>
        ))}
      </div>
    </div>
  );
}
