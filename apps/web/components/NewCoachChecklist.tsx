"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircleIcon as CheckCircle,
  CircleIcon as Circle,
  XIcon as X,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

const DISMISS_KEY = "onboarding-checklist-dismissed";

interface Step {
  key: string;
  label: string;
  href: (slug: string) => string;
  done: boolean;
}

export default function NewCoachChecklist() {
  const params = useParams<{ slug: string }>();
  const [dismissed, setDismissed] = useState(true); // default hidden until localStorage read, avoids a flash
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasProgram, setHasProgram] = useState(false);
  const [hasForm, setHasForm] = useState(false);
  const [hasClient, setHasClient] = useState(false);
  const [hasMessaged, setHasMessaged] = useState(false);
  const [hasCalendar, setHasCalendar] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setReady(true);
  }, []);

  useEffect(() => {
    // Each step is meant to build on the one before it — a client added
    // before the public profile/program exist would land on a blank
    // profile with nothing to be assigned, so the checklist (and its
    // "done" detection) follows that same 1-2-3 order end to end.
    api
      .myProfile()
      .then((p) => setHasProfile(Boolean(p.bio || p.tagline)))
      .catch(() => {});
    api.listTemplates().then((t) => setHasProgram(t.length > 0)).catch(() => {});
    api.listForms().then((f) => setHasForm(f.length > 0)).catch(() => {});
    api.listClients().then((c) => setHasClient(c.length > 0)).catch(() => {});
    api
      .listThreads()
      .then((threads) => setHasMessaged(threads.some((t) => t.last_message_at !== null)))
      .catch(() => {});
    api
      .listIntegrations()
      .then((integrations) => setHasCalendar(integrations.some((i) => i.connected)))
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!ready || dismissed) return null;

  const steps: Step[] = [
    {
      key: "profile",
      label: "Complete your public profile",
      href: (slug) => `/${slug}/settings`,
      done: hasProfile,
    },
    {
      key: "program",
      label: "Create a program or package",
      href: (slug) => `/${slug}/programs`,
      done: hasProgram,
    },
    {
      key: "client",
      label: "Add or import your first client",
      href: (slug) => `/${slug}/clients`,
      done: hasClient,
    },
    {
      key: "portal",
      label: "Share their personal portal link",
      href: (slug) => `/${slug}/clients`,
      done: hasClient,
    },
    {
      key: "message",
      label: "Message an active client",
      href: (slug) => `/${slug}/chat`,
      done: hasMessaged,
    },
    {
      key: "calendar",
      label: "Connect your calendar",
      href: (slug) => `/${slug}/calendar`,
      done: hasCalendar,
    },
    {
      key: "form",
      label: "Create a form with AI",
      href: (slug) => `/${slug}/forms/new`,
      done: hasForm,
    },
    {
      key: "document",
      label: "Share a document",
      href: (slug) => `/${slug}/documents`,
      done: false,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null; // fully complete — no need to keep showing it

  return (
    <Card className="animate-fade-up relative">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss guide"
        className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <h3 className="font-heading mb-1 text-sm font-semibold text-neutral-900">
        Getting started
      </h3>
      <p className="mb-4 text-xs text-neutral-500">
        {doneCount} of {steps.length} done: a quick tour of the essentials.
      </p>
      <div className="flex flex-col gap-1">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href(params.slug)}
            className="flex items-center gap-2.5 rounded-[10px] px-2 py-2 text-sm hover:bg-neutral-50"
          >
            {step.done ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-accent-600" weight="fill" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-neutral-300" />
            )}
            <span className={step.done ? "text-neutral-400 line-through" : "text-neutral-800"}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
