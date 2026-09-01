"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CookieIcon as Cookie } from "@phosphor-icons/react";
import { Button } from "@/components/ui";
import { getConsent, setConsent } from "@/lib/consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  function choose(value: "accepted" | "declined") {
    setConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 md:p-4">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 rounded-[18px] border border-neutral-300/60 bg-white px-5 py-4 shadow-[0_20px_44px_rgba(28,29,31,0.14)] sm:flex-row sm:items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Cookie className="h-4 w-4" weight="fill" />
        </span>
        <p className="flex-1 text-xs text-neutral-600">
          We use essential cookies to keep you signed in and your workspace working. With your
          consent, we&apos;d also like to use analytics cookies to understand how the site is
          used.{" "}
          <Link href="/privacy" className="font-medium text-accent-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => choose("declined")}>
            Essential only
          </Button>
          <Button onClick={() => choose("accepted")}>Accept</Button>
        </div>
      </div>
    </div>
  );
}
