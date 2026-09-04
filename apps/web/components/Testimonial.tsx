import { QuotesIcon as Quotes } from "@phosphor-icons/react/dist/ssr";
import { TESTIMONIALS, type Testimonial as TestimonialData } from "@/lib/testimonials";

// Reuses the existing shared testimonial data (already used in AuthLayout/
// CoachMapCarousel) instead of inventing new copy per page. Niche pages pass
// their own niche value; comparison/standalone pages omit it and just get a
// sensible default. Only 4 of the 12 real niches have a directly-tagged
// entry today — everything else falls back to the first entry, matching the
// same cross-niche reuse already established in lib/niche.ts's own config.
export function pickTestimonial(niche?: string): TestimonialData {
  if (niche) {
    const match = TESTIMONIALS.find((t) => t.role.toLowerCase().startsWith(niche.toLowerCase()));
    if (match) return match;
  }
  return TESTIMONIALS[0];
}

export default function Testimonial({ niche }: { niche?: string }) {
  const t = pickTestimonial(niche);
  return (
    <figure className="rounded-[16px] border border-neutral-200 bg-neutral-50/60 p-6">
      <Quotes className="mb-3 h-6 w-6 text-accent-300" weight="fill" />
      <blockquote className="mb-4 text-[15px] leading-relaxed text-neutral-800">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-2.5 text-xs text-neutral-500">
        {t.photoUrl && (
          <img src={t.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        )}
        <span>
          <span className="font-medium text-neutral-700">{t.name}</span> · {t.role} · {t.location}
        </span>
      </figcaption>
    </figure>
  );
}
