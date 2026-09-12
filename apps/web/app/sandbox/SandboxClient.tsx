"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SquaresFourIcon as SquaresFour,
  UsersIcon as Users,
  CalendarBlankIcon as CalendarBlank,
  CheckSquareIcon as CheckSquare,
  TrendUpIcon as TrendUp,
  WarningIcon as Warning,
  ArrowLeftIcon as ArrowLeft,
} from "@phosphor-icons/react";
import { Card, Button } from "@/components/ui";

// Un-gated, client-side-only mock workspace — no auth, no API calls, no
// persistence. Every value below is hardcoded/dummy data or local React
// state a visitor can click around, so someone can feel the real product's
// interaction patterns (checking off a task, clicking between clients,
// scanning a briefing) in under a minute before ever giving an email.
// This is intentionally a curated subset, not a full clone of the
// authenticated app at app/(app)/[slug]/* — see LandingDashboardPreview.tsx
// for the same design-consistency rationale.

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: SquaresFour },
  { key: "clients", label: "Clients", Icon: Users },
  { key: "calendar", label: "Calendar", Icon: CalendarBlank },
  { key: "tasks", label: "Tasks", Icon: CheckSquare },
] as const;

type NavKey = (typeof NAV)[number]["key"];

const MOCK_CLIENTS = [
  { name: "Priya K.", niche: "Business coaching", status: "On track", note: "Hit Q3 revenue goal — discuss scaling next." },
  { name: "Marcus T.", niche: "Fitness coaching", status: "Needs attention", note: "Missed last 2 check-ins, hasn't logged workouts in 9 days." },
  { name: "Elena R.", niche: "Career coaching", status: "On track", note: "3 interviews booked this week, prepping for final round." },
  { name: "David S.", niche: "Life coaching", status: "On track", note: "Making steady progress on confidence goals." },
];

const MOCK_SESSIONS = [
  { client: "Priya K.", time: "Today, 10:00 AM", provider: "Google Meet" },
  { client: "Marcus T.", time: "Today, 1:30 PM", provider: "Zoom" },
  { client: "Elena R.", time: "Tomorrow, 9:00 AM", provider: "Google Meet" },
  { client: "David S.", time: "Wed, 2:00 PM", provider: "Calendly" },
];

const INITIAL_TASKS = [
  { id: 1, label: "Send follow-up to Marcus about missed check-ins", done: false },
  { id: 2, label: "Prep session notes for Elena's interview debrief", done: false },
  { id: 3, label: "Review and approve AI-drafted program for new lead", done: true },
  { id: 4, label: "Update David's goal tracker after this week's session", done: false },
];

function DashboardTab() {
  const stats = [
    { label: "Active clients", value: "14", Icon: Users },
    { label: "MRR", value: "$4,850", Icon: TrendUp },
    { label: "At-risk", value: "1", Icon: Warning },
    { label: "Leads waiting", value: "3", Icon: Users },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[16px] bg-neutral-900 p-5 text-white">
        <p className="mb-2 text-xs font-semibold text-neutral-300">Today's AI briefing</p>
        <ul className="flex flex-col gap-1.5 text-[13px] text-neutral-200">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" /> Marcus T. hasn't
            logged a workout in 9 days — worth a direct check-in before today's session.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" /> 3 new leads
            waiting more than 48 hours — follow up before they go cold.
          </li>
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <s.Icon className="h-4 w-4" weight="fill" />
            </span>
            <p className="font-heading text-xl font-semibold text-neutral-900">{s.value}</p>
            <p className="text-[11px] text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClientsTab() {
  const [selected, setSelected] = useState(0);
  const c = MOCK_CLIENTS[selected];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
      <div className="flex flex-col gap-1.5">
        {MOCK_CLIENTS.map((client, i) => (
          <button
            key={client.name}
            onClick={() => setSelected(i)}
            className={`rounded-[10px] px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              i === selected ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {client.name}
            <span className={`block text-[10px] ${i === selected ? "text-neutral-400" : "text-neutral-400"}`}>
              {client.niche}
            </span>
          </button>
        ))}
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-neutral-900">{c.name}</h3>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              c.status === "On track" ? "bg-accent-100 text-accent-700" : "bg-accent-200 text-accent-800"
            }`}
          >
            {c.status}
          </span>
        </div>
        <p className="mb-1 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
          Private coach notes
        </p>
        <p className="rounded-[10px] bg-neutral-100 p-3 text-xs leading-relaxed text-neutral-600">{c.note}</p>
      </Card>
    </div>
  );
}

function CalendarTab() {
  return (
    <div className="flex flex-col gap-2">
      {MOCK_SESSIONS.map((s) => (
        <div
          key={s.client + s.time}
          className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3"
        >
          <div>
            <p className="text-xs font-medium text-neutral-800">{s.client}</p>
            <p className="text-[10px] text-neutral-500">
              {s.time} · {s.provider}
            </p>
          </div>
          <Button variant="secondary">Join</Button>
        </div>
      ))}
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <button
          key={t.id}
          onClick={() =>
            setTasks((prev) => prev.map((p) => (p.id === t.id ? { ...p, done: !p.done } : p)))
          }
          className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-white px-4 py-3 text-left"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] ${
              t.done ? "border-accent-600 bg-accent-600 text-white" : "border-neutral-300 text-transparent"
            }`}
          >
            ✓
          </span>
          <p className={`text-xs ${t.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>{t.label}</p>
        </button>
      ))}
      <p className="mt-2 text-[10px] text-neutral-400">Click a task to check it off — try it.</p>
    </div>
  );
}

export default function SandboxClient() {
  const [active, setActive] = useState<NavKey>("dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to CoachevaOS
        </Link>
        <span className="rounded-full bg-accent-100 px-3 py-1 text-[10px] font-semibold text-accent-700">
          Interactive sandbox — mock data, no signup required
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 md:flex-row md:p-6">
        <nav className="flex gap-2 overflow-x-auto md:w-48 md:flex-col md:gap-1.5">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2.5 text-xs font-medium transition-colors ${
                active === item.key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-white"
              }`}
            >
              <item.Icon className="h-4 w-4" weight="fill" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {active === "dashboard" && <DashboardTab />}
          {active === "clients" && <ClientsTab />}
          {active === "calendar" && <CalendarTab />}
          {active === "tasks" && <TasksTab />}
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white p-4 text-center md:p-6">
        <p className="mb-3 text-xs text-neutral-600">
          This is a static preview with dummy data. Your real workspace connects your own calendar,
          clients, and billing.
        </p>
        <Link href="/signup">
          <Button>Start your free 14-day trial</Button>
        </Link>
      </div>
    </div>
  );
}
