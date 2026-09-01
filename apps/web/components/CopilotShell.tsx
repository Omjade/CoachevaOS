"use client";

import { ReactNode } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { Eyebrow } from "@/components/ui";

// Groups the app's scattered AI-backed cards (briefing, prep-my-day, weekly
// digest, needs-attention/recommendations, and — on the client-detail page —
// churn/snapshot/program/timeline/session-assistant) under one shared visual
// boundary and heading, so they read as one "AI Copilot" surface instead of
// unrelated cards stacked on the page. Individual cards keep their own
// distinct styling (the briefing card is deliberately a dark hero card) —
// this only adds the shared frame/heading around them, not a redesign of each.
export default function CopilotShell({
  title = "AI Copilot",
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-fade-up flex flex-col gap-4 rounded-[22px] border border-neutral-200/70 bg-neutral-50/40 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Sparkle className="h-3.5 w-3.5" weight="fill" />
        </span>
        <div>
          <Eyebrow className="mb-0">{title}</Eyebrow>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
