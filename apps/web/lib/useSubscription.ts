"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode, createElement } from "react";
import { api, PlatformSubscriptionData } from "@/lib/api";

interface SubscriptionContextValue {
  subscription: PlatformSubscriptionData | null;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// Fetched once per app-shell mount and shared via context so a plan
// change/cancel/checkout made on one page (e.g. the billing page) is
// reflected everywhere else in the shell (SubscriptionBanner, the settings
// summary card) immediately via the shared refresh(), instead of each
// consumer independently polling or requiring a full page reload.
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<PlatformSubscriptionData | null>(null);

  const refresh = useCallback(async () => {
    try {
      const sub = await api.getPlatformSubscription();
      setSubscription(sub);
    } catch {
      // No subscription yet (onboarding not complete) — leave null, callers
      // treat null as "nothing to show" rather than an error.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return createElement(SubscriptionContext.Provider, { value: { subscription, refresh } }, children);
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
