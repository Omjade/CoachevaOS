"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ViewerRole } from "@/lib/useViewerRole";

// The logged-in viewer's own portal slug — a coach's own portal_slug, or a
// client's own coach's portal_slug. Used to distinguish "this bare /{slug}
// is MY OWN portal" (real dashboard) from "I'm logged in but viewing a
// DIFFERENT coach's public link" (must still show the real public profile,
// never my own dashboard chrome). Same module-level cache + shared
// in-flight promise pattern as useCurrentUser.ts, and resets at the same
// login-boundary points via invalidateOwnSlug().
let cachedSlug: string | null | undefined = undefined;
let inFlight: Promise<string | null> | null = null;

export function invalidateOwnSlug() {
  cachedSlug = undefined;
  inFlight = null;
}

/** Returns undefined while resolving, null once resolved for a role with no slug (e.g. onboarding not complete). */
export function useOwnSlug(role: ViewerRole): string | null | undefined {
  const [slug, setSlug] = useState<string | null | undefined>(cachedSlug);

  useEffect(() => {
    if (role !== "coach" && role !== "client") return;
    if (cachedSlug !== undefined) {
      setSlug(cachedSlug);
      return;
    }

    let cancelled = false;
    if (!inFlight) {
      inFlight =
        role === "coach"
          ? api.myProfile().then((p) => p.portal_slug)
          : api.getMyPortal().then((p) => p.portal_slug);
    }
    const thisRequest = inFlight;
    thisRequest
      .then((s) => {
        cachedSlug = s;
        if (!cancelled) setSlug(s);
      })
      .catch(() => {
        if (inFlight === thisRequest) inFlight = null;
        if (!cancelled) setSlug(null);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return slug;
}
