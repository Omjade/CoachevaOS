"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

// First-party, non-identifying visit counter (see POST /track/visit) —
// distinct from the consent-gated GA loader in Analytics.tsx. Fires once per
// route (mount + every client-side navigation), fire-and-forget, never
// blocks render or surfaces an error to the visitor.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    api.trackVisit(pathname);
  }, [pathname]);

  return null;
}
