"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getConsent, onConsentChange } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Inert until NEXT_PUBLIC_GA_MEASUREMENT_ID is actually set — matches this
// codebase's established pattern for every other third-party integration
// (Paddle, Google OAuth, etc.): ship the wiring now, activate later by
// setting one env var, never half-build it when the real ID shows up.
// Real consent gating, not cosmetic: the GA script tag itself is never
// rendered until the visitor has actively accepted (not just dismissed) the
// cookie banner, and it starts firing immediately if they accept later in
// the same session without needing a reload.
export default function Analytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    setEnabled(getConsent() === "accepted");
    return onConsentChange((value) => setEnabled(value === "accepted"));
  }, []);

  if (!GA_ID || !enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
