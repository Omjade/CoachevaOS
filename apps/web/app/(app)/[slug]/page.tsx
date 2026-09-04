"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useViewerRole } from "@/lib/useViewerRole";
import { useOwnSlug } from "@/lib/useOwnSlug";
import PublicCoachPortfolio from "@/components/PublicCoachPortfolio";

// A logged-in coach/client hitting their OWN bare /{slug} still lands on the
// real dashboard exactly as before. But a logged-in coach/client visiting a
// DIFFERENT slug — including a coach viewing their own public link from an
// account that doesn't own it, or one coach viewing another coach's page —
// must see the real public portfolio, not get bounced to their own
// dashboard. So the redirect only fires once we've confirmed this slug is
// actually the viewer's own (coach: their portal_slug; client: their
// coach's portal_slug), not just because *someone* is logged in.
// A genuinely anonymous visitor always sees the public portfolio directly.
// (The layout above this page makes the same "is this my own slug" check —
// see SlugLayout.tsx — to decide whether to wrap this page in the app shell
// at all; both must agree, which is why this uses the same shared hook.)
export default function SlugIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const role = useViewerRole();
  const ownSlug = useOwnSlug(role);
  const router = useRouter();

  useEffect(() => {
    if ((role === "coach" || role === "client") && ownSlug === slug) {
      router.replace(`/${slug}/dashboard`);
    }
  }, [role, ownSlug, slug, router]);

  // Still resolving role, or a logged-in viewer whose own-slug check hasn't
  // landed yet — hold off rendering anything to avoid a public-portfolio
  // flash right before the dashboard redirect fires.
  if (role === null) return null;
  if ((role === "coach" || role === "client") && ownSlug === undefined) return null;
  if ((role === "coach" || role === "client") && ownSlug === slug) return null;

  return <PublicCoachPortfolio slug={slug} />;
}
