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

const DISMISS_KEY = "client-checklist-dismissed";

interface Step {
  key: string;
  label: string;
  href: (slug: string) => string;
  done: boolean;
}

// A client-facing walkthrough shown once right after onboarding completes,
// parallel to NewCoachChecklist.tsx (which only ever covers the coach side).
// Same dismiss-and-persist (localStorage) and completion-detection pattern.
export default function NewClientChecklist() {
  const params = useParams<{ slug: string }>();
  const [dismissed, setDismissed] = useState(true); // default hidden until localStorage read, avoids a flash
  const [ready, setReady] = useState(false);
  const [hasMessaged, setHasMessaged] = useState(false);
  const [hasTask, setHasTask] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setReady(true);
  }, []);

  useEffect(() => {
    api
      .getMyThread()
      .then((t) => setHasMessaged(t.last_message_at !== null))
      .catch(() => {});
    api
      .listMyTasks()
      .then((tasks) => setHasTask(tasks.length > 0))
      .catch(() => {});
    api
      .listMyMeetings()
      .then((meetings) => setHasBooked(meetings.length > 0))
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!ready || dismissed) return null;

  const steps: Step[] = [
    {
      key: "message",
      label: "Message your coach",
      href: (slug) => `/${slug}/messages`,
      done: hasMessaged,
    },
    {
      key: "tasks",
      label: "See your tasks",
      href: (slug) => `/${slug}/tasks`,
      done: hasTask,
    },
    {
      key: "checkin",
      label: "Log your first check-in",
      href: (slug) => `/${slug}/checkin`,
      done: false,
    },
    {
      key: "progress",
      label: "See your progress",
      href: (slug) => `/${slug}/progress`,
      done: false,
    },
    {
      key: "book",
      label: "Book a session",
      href: (slug) => `/${slug}/calendar`,
      done: hasBooked,
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
        {doneCount} of {steps.length} done: a quick tour of your portal.
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
