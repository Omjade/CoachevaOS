"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useViewerRole } from "@/lib/useViewerRole";
import PublicCoachPortfolio from "@/components/PublicCoachPortfolio";

// A logged-in coach/client hitting their own bare /{slug} still lands on the
// real dashboard exactly as before (that page's own per-role logic takes it
// from there, including bouncing a client onward to their nested URL). A
// genuinely anonymous visitor — the new case this phase adds — sees the
// public coach portfolio instead of being forced through /login.
export default function SlugIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const role = useViewerRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "coach" || role === "client") {
      router.replace(`/${slug}/dashboard`);
    }
  }, [role, slug, router]);

  if (role === null || role === "coach" || role === "client") return null;
  return <PublicCoachPortfolio slug={slug} />;
}
