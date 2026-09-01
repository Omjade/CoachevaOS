"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useViewerRole } from "@/lib/useViewerRole";

// `dashboard`, `calendar`, and `settings` correctly branch on role internally
// (one page, two components). Every other route under /{slug}/... assumes a
// single role with no check at all — meaning a coach who lands on a
// client-only URL (or a client on a coach-only one), by a stray link, a
// typed URL, or browser back/forward, gets shown that page's real component
// tree under their own shell's chrome. The page doesn't actually render the
// other party's data (every fetch is still scoped server-side by session,
// via require_coach / get_current_client), so nothing leaks — but it's a
// broken, confusing "wrong page" experience with silently-empty lists and no
// explanation. This redirects a role mismatch back to the viewer's own
// dashboard instead of letting the mismatched page render at all.
export function useRoleGuard(requiredRole: "coach" | "client"): boolean {
  const role = useViewerRole();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (role !== null && role !== "anonymous" && role !== requiredRole) {
      router.replace(`/${params.slug}/dashboard`);
    }
  }, [role, requiredRole, router, params.slug]);

  return role === requiredRole;
}
