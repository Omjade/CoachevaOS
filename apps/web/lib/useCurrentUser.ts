"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";

// Every shell/layout/page independently called api.me() on mount with no
// caching or deduplication — a single dashboard load fired /auth/me up to
// 4 separate times (layout, shell, page, and a child component), some of
// them chained rather than parallel. This module-level cache + shared
// in-flight promise means the first caller during a page load triggers
// exactly one request; every other useCurrentUser() call reuses it —
// including later client-side navigations within the same session, since
// the cache survives SPA route changes (only a hard refresh re-fetches, and
// there's no way around that for a client-only auth check without moving to
// server-side session verification, a much larger change).
//
// Deliberately only SUCCESS is cached, never failure. A first attempt can
// fail transiently (e.g. returning from a multi-hop payment-provider
// redirect where the access-token cookie has expired mid-flow but the
// refresh-token cookie is still valid) — caching that failure would strand
// every later mount in "logged out" for the rest of the tab's session with
// no way to recover, even though a fresh attempt moments later would
// succeed. Each hook instance is free to retry on its own mount.
//
// Call invalidateCurrentUser() right after any successful login/register/
// invite-accept/MFA-verify so a fresh session's data is never served from a
// stale pre-login cache — see app/login, app/signup, app/invite/[token].
let cachedUser: User | null = null;
let inFlight: Promise<User> | null = null;

export function invalidateCurrentUser() {
  cachedUser = null;
  inFlight = null;
}

export function useCurrentUser(): { user: User | null; loading: boolean; error: boolean } {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    let cancelled = false;
    if (!inFlight) inFlight = api.me();
    const thisRequest = inFlight;
    thisRequest
      .then((u) => {
        cachedUser = u;
        if (!cancelled) {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => {
        // Only clear the shared in-flight slot if it's still the request we
        // started — a later invalidateCurrentUser()/new attempt may already
        // have replaced it.
        if (inFlight === thisRequest) inFlight = null;
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
