"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFourIcon as SquaresFour,
  UsersIcon as Users,
  UsersThreeIcon as UsersThree,
  NotePencilIcon as NotePencil,
  StackIcon as Stack,
  ChatCircleIcon as ChatCircle,
  CalendarBlankIcon as CalendarBlank,
  FileTextIcon as FileText,
  SlidersHorizontalIcon as SlidersHorizontal,
  UserCircleIcon as UserCircle,
  ListChecksIcon as ListChecks,
  CheckSquareIcon as CheckSquare,
  ChartLineUpIcon as ChartLineUp,
  PackageIcon as Package,
  ClipboardTextIcon as ClipboardText,
  GearIcon as Gear,
  BellIcon as Bell,
  SparkleIcon as Sparkle,
  VideoCameraIcon as VideoCamera,
  TrendUpIcon as TrendUp,
  WarningIcon as Warning,
} from "@phosphor-icons/react";
import { GoogleMeetIcon } from "@/components/ProviderIcons";
import { ClientGrowthChart, EngagementTrendChart, LeadFunnelChart, Sparkline } from "@/components/DashboardCharts";
import { Card } from "@/components/ui";
import type { WeekPoint, CheckinWeekPoint, FunnelPoint } from "@/lib/api";

// A purpose-built marketing mockup — but every sidebar item, the trial
// banner, the "Getting started" checklist copy, and the AI summary text are
// copied directly from real coach/client dashboard screenshots, not
// invented. Reuses the REAL chart components (ClientGrowthChart etc.) fed
// dummy data, so the visual is genuinely identical to production, not a
// look-alike. Sidebar items switch which mock section is shown — visual
// navigation only, no real data access.

const GROWTH_DATA: WeekPoint[] = [
  { week: "2026-06-01", count: 6 }, { week: "2026-06-08", count: 7 },
  { week: "2026-06-15", count: 8 }, { week: "2026-06-22", count: 8 },
  { week: "2026-06-29", count: 10 }, { week: "2026-07-06", count: 11 },
  { week: "2026-07-13", count: 11 }, { week: "2026-07-20", count: 12 },
  { week: "2026-07-27", count: 13 }, { week: "2026-08-03", count: 13 },
  { week: "2026-08-10", count: 14 }, { week: "2026-08-17", count: 14 },
];
const ENGAGEMENT_DATA: CheckinWeekPoint[] = [
  { week: "2026-06-01", checkins: 18, active_clients: 24, rate: 0.75 },
  { week: "2026-06-08", checkins: 20, active_clients: 24, rate: 0.83 },
  { week: "2026-06-15", checkins: 19, active_clients: 25, rate: 0.76 },
  { week: "2026-06-22", checkins: 22, active_clients: 26, rate: 0.85 },
  { week: "2026-06-29", checkins: 24, active_clients: 27, rate: 0.89 },
  { week: "2026-07-06", checkins: 23, active_clients: 27, rate: 0.85 },
  { week: "2026-07-13", checkins: 25, active_clients: 28, rate: 0.89 },
  { week: "2026-07-20", checkins: 26, active_clients: 28, rate: 0.93 },
];
const FUNNEL_DATA: FunnelPoint[] = [
  { stage: "new", count: 9 }, { stage: "contacted", count: 6 },
  { stage: "follow_up", count: 4 }, { stage: "booked", count: 3 },
  { stage: "converted", count: 2 },
];
const SPARK_DATA: WeekPoint[] = GROWTH_DATA.slice(-6);

const COACH_CHECKLIST = [
  { label: "Create a form with AI", done: true },
  { label: "Add or import your first client", done: true },
  { label: "Share their personal portal link", done: true },
  { label: "Message an active client", done: true },
  { label: "Connect your calendar", done: true },
  { label: "Share a document", done: false },
];

const CLIENT_CHECKLIST = [
  { label: "Message your coach", done: false },
  { label: "See your tasks", done: false },
  { label: "Log your first check-in", done: false },
  { label: "See your progress", done: false },
  { label: "Book a session", done: true },
];

function GettingStartedCard({ title, items }: { title: string; items: { label: string; done: boolean }[] }) {
  const doneCount = items.filter((i) => i.done).length;
  return (
    <Card className="mb-4">
      <h3 className="font-heading mb-0.5 text-sm font-semibold text-neutral-900">Getting started</h3>
      <p className="mb-3 text-[11px] text-neutral-500">
        {doneCount} of {items.length} done: {title}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-2">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                i.done ? "bg-accent-600 text-white" : "border border-neutral-300 text-transparent"
              }`}
            >
              ✓
            </span>
            <p className={`text-[11px] ${i.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
              {i.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatTile({ Icon, value, label, spark }: { Icon: typeof Users; value: string; label: string; spark?: boolean }) {
  return (
    <Card className="!p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Icon className="h-4 w-4" weight="fill" />
        </span>
        {spark && <Sparkline data={SPARK_DATA} />}
      </div>
      <p className="font-heading text-xl font-semibold text-neutral-900">{value}</p>
      <p className="text-[11px] text-neutral-500">{label}</p>
    </Card>
  );
}

// ---- Coach sections ----

function CoachDashboardSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 inline-flex items-center gap-1.5 rounded-[6px] border border-accent-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-accent-600 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-600" /> Monday, September 7
        </p>
        <h3 className="font-heading text-lg font-semibold text-neutral-900">Good evening, Alex</h3>
        <p className="text-[11px] text-neutral-500">Here's what's happening today.</p>
      </div>
      <GettingStartedCard title="a quick tour of the essentials." items={COACH_CHECKLIST} />
      <div className="rounded-[16px] bg-neutral-900 p-4 text-white">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
          <Sparkle className="h-3 w-3 text-accent-500" weight="fill" /> Today's AI briefing
        </p>
        <ul className="flex flex-col gap-1.5 text-[12px] text-neutral-200">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" /> Marcus T. hasn't
            checked in for 9 days — worth a direct message before today's session.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" /> Elena's invoice is
            due in 3 days — a reminder is queued automatically.
          </li>
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile Icon={Users} value="14" label="Active clients" spark />
        <StatTile Icon={TrendUp} value="$4,850" label="MRR this month" />
        <StatTile Icon={Warning} value="1" label="At-risk client" />
        <StatTile Icon={UsersThree} value="3" label="Leads waiting" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClientGrowthChart data={GROWTH_DATA} />
        <LeadFunnelChart data={FUNNEL_DATA} />
      </div>
      <EngagementTrendChart data={ENGAGEMENT_DATA} />
    </div>
  );
}

function CoachLeadsSection() {
  // Matches the real 5-stage Kanban (LeadsBoard.tsx) exactly: New, Contacted,
  // Follow Up, Booked, Lost — each column has a colored top border.
  const stages = [
    { label: "New", border: "border-t-neutral-400", items: ["Jordan P.", "Casey L."] },
    { label: "Contacted", border: "border-t-blue-400", items: ["Sam R."] },
    { label: "Follow Up", border: "border-t-amber-400", items: ["Aisha M."] },
    { label: "Booked", border: "border-t-accent-500", items: ["Devon K."] },
    { label: "Lost", border: "border-t-neutral-300", items: [] },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stages.map((s) => (
        <div key={s.label} className={`rounded-[12px] border border-t-2 border-neutral-200 bg-white p-3 ${s.border}`}>
          <p className="mb-2 text-[10px] font-semibold text-neutral-500 uppercase">{s.label}</p>
          <div className="flex flex-col gap-1.5">
            {s.items.length === 0 && <p className="text-[10px] text-neutral-300">—</p>}
            {s.items.map((i) => (
              <div key={i} className="rounded-[8px] bg-neutral-100 px-2 py-1.5 text-[11px] text-neutral-700">
                {i}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CoachFormsSection() {
  const forms = [
    { name: "New client intake", submissions: 12 },
    { name: "Weekly check-in", submissions: 48 },
    { name: "Program feedback", submissions: 6 },
  ];
  return (
    <div className="flex flex-col gap-2">
      {forms.map((f) => (
        <div key={f.name} className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-neutral-800">{f.name}</p>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">
            {f.submissions} submissions
          </span>
        </div>
      ))}
    </div>
  );
}

function CoachClientsSection() {
  const clients = [
    { name: "Priya K.", status: "On track", note: "New revenue high this quarter — discuss scaling plan next." },
    { name: "Marcus T.", status: "At risk", note: "Missed last 2 check-ins, hasn't logged progress in 9 days." },
    { name: "Elena R.", status: "On track", note: "3 interviews booked this week, prepping for final round." },
  ];
  return (
    <div className="flex flex-col gap-2">
      {clients.map((c) => (
        <div key={c.name} className="rounded-[12px] border border-neutral-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-800">{c.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${c.status === "On track" ? "bg-accent-100 text-accent-700" : "bg-red-100 text-red-700"}`}>
              {c.status}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

function CoachProgramsSection() {
  const programs = [
    { name: "12-Week Transformation", clients: 8 },
    { name: "Executive Leadership Sprint", clients: 4 },
    { name: "Foundations (4-week)", clients: 2 },
  ];
  return (
    <div className="flex flex-col gap-2">
      {programs.map((p) => (
        <div key={p.name} className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <Stack className="h-3.5 w-3.5" weight="fill" />
            </span>
            <p className="text-xs font-medium text-neutral-800">{p.name}</p>
          </div>
          <span className="text-[10px] text-neutral-500">{p.clients} clients enrolled</span>
        </div>
      ))}
    </div>
  );
}

function CoachChatSection() {
  const messages = [
    { from: "Priya K.", text: "Just hit a new squat PR today!", time: "10:42 AM", mine: false },
    { from: "You", text: "That's fantastic — how did it feel?", time: "10:50 AM", mine: true },
  ];
  return (
    <Card>
      <p className="mb-3 text-xs font-semibold text-neutral-900">Priya K.</p>
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[75%] rounded-[12px] px-3 py-2 text-[11px] ${m.mine ? "ml-auto bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}>
            {m.text}
          </div>
        ))}
      </div>
    </Card>
  );
}

function CoachCalendarSection() {
  const sessions = [
    { client: "Priya K.", time: "10:00 AM", provider: "Google Meet" },
    { client: "Marcus T.", time: "1:30 PM", provider: "Zoom" },
    { client: "Elena R.", time: "4:00 PM", provider: "Google Meet" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <div key={s.client} className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-neutral-800">{s.client}</p>
            <p className="text-[10px] text-neutral-500">{s.time} · {s.provider}</p>
          </div>
          <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">Join</span>
        </div>
      ))}
    </div>
  );
}

function CoachDocumentsSection() {
  const docs = ["Coaching agreement — Priya K.pdf", "Session notes template.docx", "Program outline.pdf"];
  return (
    <div className="flex flex-col gap-2">
      {docs.map((d) => (
        <div key={d} className="flex items-center gap-2.5 rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <FileText className="h-4 w-4 text-neutral-400" />
          <p className="text-xs text-neutral-700">{d}</p>
        </div>
      ))}
    </div>
  );
}

function CoachCustomFieldsSection() {
  const fields = ["Body weight", "Training experience", "Injuries / limitations", "Monthly revenue"];
  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((f) => (
        <span key={f} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
          {f}
        </span>
      ))}
    </div>
  );
}

function CoachProfileSection() {
  return (
    <Card>
      <p className="mb-1 text-xs font-semibold text-neutral-900">Alex</p>
      <p className="mb-3 text-[11px] text-neutral-500">Fitness Coach</p>
      <div className="flex flex-col gap-2 text-[11px] text-neutral-600">
        <p>Business name: Alex Fitness Coaching</p>
        <p>Branded portal: on</p>
        <p>Timezone: America/New_York</p>
      </div>
    </Card>
  );
}

const COACH_SECTIONS = [
  { key: "dashboard", label: "Dashboard", Icon: SquaresFour, Component: CoachDashboardSection },
  { key: "leads", label: "Leads", Icon: UsersThree, Component: CoachLeadsSection },
  { key: "forms", label: "Forms", Icon: NotePencil, Component: CoachFormsSection },
  { key: "clients", label: "Clients", Icon: Users, Component: CoachClientsSection },
  { key: "programs", label: "Programs", Icon: Stack, Component: CoachProgramsSection },
  { key: "chat", label: "Chat", Icon: ChatCircle, Component: CoachChatSection },
  { key: "calendar", label: "Calendar", Icon: CalendarBlank, Component: CoachCalendarSection },
  { key: "documents", label: "Documents", Icon: FileText, Component: CoachDocumentsSection },
  { key: "fields", label: "Custom Fields", Icon: SlidersHorizontal, Component: CoachCustomFieldsSection },
  { key: "profile", label: "Profile", Icon: UserCircle, Component: CoachProfileSection },
] as const;

// ---- Client sections ----

function ClientDashboardSection() {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-heading text-lg font-semibold text-neutral-900">Good evening, Karan</h3>
      <GettingStartedCard title="a quick tour of your portal." items={CLIENT_CHECKLIST} />
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-heading text-sm font-semibold text-neutral-900">Progress</h4>
          <span className="text-[10px] text-neutral-400">↻</span>
        </div>
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full w-1/2 rounded-full bg-accent-600" />
        </div>
        <p className="mb-3 text-[10px] text-neutral-500">6 of 12 tasks complete (50%)</p>
        <div className="flex items-start gap-2 rounded-[10px] bg-neutral-100 p-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <Sparkle className="h-3 w-3" weight="fill" />
          </span>
          <div>
            <p className="mb-1 text-[9px] font-semibold text-accent-600 uppercase">Your coach's AI summary</p>
            <p className="text-[11px] leading-relaxed text-neutral-600">
              Karan is on pace in the Strength + Conditioning program, with 3 straight weeks of
              logged check-ins — worth celebrating on the next call.
            </p>
          </div>
        </div>
      </Card>
      <Card>
        <h4 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Your program</h4>
        <p className="text-xs text-neutral-600">12-Week Transformation · Week 6 of 12</p>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <h4 className="font-heading text-sm font-semibold text-neutral-900">Your plan</h4>
          <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[10px] font-semibold text-accent-700">Active</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Renews Oct 6, 2026</p>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <VideoCamera className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Next session</p>
          <p className="text-[10px] text-neutral-500">Thursday, 10:00 AM</p>
        </Card>
        <Card className="!p-4">
          <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CheckSquare className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Tasks</p>
          <p className="text-[10px] text-neutral-500">1 incomplete</p>
        </Card>
        <Card className="!p-4">
          <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <ChartLineUp className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Goals</p>
          <p className="text-[10px] text-neutral-500">2 of 3 on track</p>
        </Card>
      </div>
      <EngagementTrendChart data={ENGAGEMENT_DATA} />
    </div>
  );
}

function ClientOnboardingSection() {
  return <GettingStartedCard title="a quick tour of your portal." items={CLIENT_CHECKLIST} />;
}

function ClientMessagesSection() {
  return (
    <Card>
      <p className="mb-3 text-xs font-semibold text-neutral-900">Coach Amara</p>
      <div className="flex flex-col gap-2">
        <div className="max-w-[75%] rounded-[12px] bg-neutral-100 px-3 py-2 text-[11px] text-neutral-700">
          How did today's session feel?
        </div>
        <div className="ml-auto max-w-[75%] rounded-[12px] bg-neutral-900 px-3 py-2 text-[11px] text-white">
          Really good, felt stronger than last week!
        </div>
      </div>
    </Card>
  );
}

function ClientTasksSection() {
  const tasks = [
    { label: "Log 3 strength workouts this week", done: true },
    { label: "Track daily protein intake", done: true },
    { label: "Complete mobility routine (video linked)", done: false },
  ];
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] ${t.done ? "border-accent-600 bg-accent-600 text-white" : "border-neutral-300 text-transparent"}`}>✓</span>
          <p className={`text-xs ${t.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>{t.label}</p>
        </div>
      ))}
    </div>
  );
}

function ClientCalendarSection() {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <VideoCamera className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Next session</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-700">
          <GoogleMeetIcon className="h-3 w-3" /> Google Meet
        </span>
      </div>
      <p className="text-sm font-medium text-neutral-800">Thursday, 10:00 AM with Coach Amara</p>
    </Card>
  );
}

function ClientFilesSection() {
  const docs = ["Coaching agreement.pdf", "Week 4 program plan.pdf"];
  return (
    <div className="flex flex-col gap-2">
      {docs.map((d) => (
        <div key={d} className="flex items-center gap-2.5 rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <FileText className="h-4 w-4 text-neutral-400" />
          <p className="text-xs text-neutral-700">{d}</p>
        </div>
      ))}
    </div>
  );
}

function ClientProgressSection() {
  return <EngagementTrendChart data={ENGAGEMENT_DATA} />;
}

function ClientPackageSection() {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Package className="h-3.5 w-3.5" weight="fill" />
        </span>
        <p className="text-xs font-semibold text-neutral-900">Your package</p>
      </div>
      <p className="text-sm font-medium text-neutral-800">12-Week Transformation</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full w-1/2 rounded-full bg-accent-600" />
      </div>
      <p className="mt-1.5 text-[10px] text-neutral-500">6 of 12 sessions used · Active</p>
    </Card>
  );
}

function ClientCheckinSection() {
  return (
    <Card>
      <p className="mb-3 text-xs font-semibold text-neutral-900">This week's check-in</p>
      <div className="flex flex-col gap-3 text-[11px] text-neutral-600">
        <p>How did this week go? <span className="block mt-1 rounded-[8px] bg-neutral-100 p-2 text-neutral-500">Felt strong, hit every workout.</span></p>
        <p>Confidence (1-10): <span className="font-semibold text-neutral-900">8</span></p>
      </div>
    </Card>
  );
}

function ClientKnowCoachSection() {
  return (
    <Card className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">A</span>
      <div>
        <p className="text-xs font-semibold text-neutral-900">Coach Amara</p>
        <p className="text-[11px] text-neutral-500">Certified strength & conditioning coach, 8 years experience.</p>
      </div>
    </Card>
  );
}

function ClientSettingsSection() {
  return (
    <Card>
      <div className="flex flex-col gap-2 text-[11px] text-neutral-600">
        <p>Notifications: on</p>
        <p>Timezone: America/New_York</p>
        <p>Email: karan@example.com</p>
      </div>
    </Card>
  );
}

const CLIENT_SECTIONS = [
  { key: "onboarding", label: "Onboarding", Icon: ListChecks, Component: ClientOnboardingSection },
  { key: "dashboard", label: "Dashboard", Icon: SquaresFour, Component: ClientDashboardSection },
  { key: "messages", label: "Messages", Icon: ChatCircle, Component: ClientMessagesSection },
  { key: "tasks", label: "Tasks", Icon: CheckSquare, Component: ClientTasksSection },
  { key: "calendar", label: "Calendar", Icon: CalendarBlank, Component: ClientCalendarSection },
  { key: "files", label: "Files", Icon: FileText, Component: ClientFilesSection },
  { key: "progress", label: "Progress", Icon: ChartLineUp, Component: ClientProgressSection },
  { key: "packages", label: "Packages", Icon: Package, Component: ClientPackageSection },
  { key: "checkin", label: "Check-In", Icon: ClipboardText, Component: ClientCheckinSection },
  { key: "coach", label: "Know your coach", Icon: UserCircle, Component: ClientKnowCoachSection },
  { key: "settings", label: "Settings", Icon: Gear, Component: ClientSettingsSection },
] as const;

function Sidebar<T extends string>({
  items,
  active,
  onSelect,
  identityName,
  identityRole,
  brandLabel,
}: {
  items: readonly { key: T; label: string; Icon: typeof Users }[];
  active: T;
  onSelect: (k: T) => void;
  identityName: string;
  identityRole: string;
  brandLabel: string;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col rounded-[14px] bg-neutral-900 px-3 py-4 md:h-[520px] md:w-44">
      <div className="mb-4 flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
        </span>
        <span className="font-heading truncate text-xs font-bold text-white">{brandLabel}</span>
      </div>
      <nav className="scrollbar-thin flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col md:overflow-y-auto">
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`flex shrink-0 items-center gap-2 rounded-[10px] px-2.5 py-2 text-[11px] font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_var(--color-accent-500)]"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <item.Icon
                className="h-3.5 w-3.5 shrink-0"
                weight={isActive ? "fill" : "regular"}
                style={{ color: isActive ? "var(--color-accent-500)" : undefined }}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-3 hidden items-center gap-2 border-t border-white/10 px-1 pt-3 md:flex">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-600 text-[10px] font-semibold text-white">
          {identityName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-white">{identityName}</p>
          <p className="truncate text-[10px] text-neutral-500">{identityRole}</p>
        </div>
      </div>
    </aside>
  );
}

export default function LandingDashboardPreview() {
  const [tab, setTab] = useState<"coach" | "client">("coach");
  const [coachSection, setCoachSection] = useState<(typeof COACH_SECTIONS)[number]["key"]>("dashboard");
  const [clientSection, setClientSection] = useState<(typeof CLIENT_SECTIONS)[number]["key"]>("dashboard");

  const CoachActive = COACH_SECTIONS.find((s) => s.key === coachSection)!.Component;
  const ClientActive = CLIENT_SECTIONS.find((s) => s.key === clientSection)!.Component;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Apple Studio Display-style frame: aluminum bezel, camera dot, stand */}
      <div className="rounded-[24px] bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 p-[10px] shadow-[0_40px_80px_rgba(28,29,31,0.2)]">
        <div className="relative overflow-hidden rounded-[16px] bg-neutral-100">
          <div className="absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-neutral-500" />
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900">
                <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
              </span>
              <span className="font-heading hidden text-xs font-bold text-neutral-900 sm:inline">CoachevaOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-neutral-400" />
              <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
                <button
                  onClick={() => setTab("coach")}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    tab === "coach" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Coach view
                </button>
                <button
                  onClick={() => setTab("client")}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    tab === "client" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Client view
                </button>
              </div>
            </div>
          </div>

          {/* Fixed-height frame — content scrolls internally so the display
              never resizes as you switch between sparse and dense sections. */}
          <div className="flex flex-col gap-3 p-3 md:h-[560px] md:flex-row md:gap-4 md:p-5">
            {tab === "coach" ? (
              <Sidebar
                items={COACH_SECTIONS}
                active={coachSection}
                onSelect={setCoachSection}
                identityName="Alex"
                identityRole="Fitness Coach"
                brandLabel="CoachevaOS"
              />
            ) : (
              <Sidebar
                items={CLIENT_SECTIONS}
                active={clientSection}
                onSelect={setClientSection}
                identityName="Karan Malhotra"
                identityRole="Client"
                brandLabel="John Brookie Coaching"
              />
            )}
            <div className="min-w-0 flex-1 overflow-y-auto md:pr-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab + (tab === "coach" ? coachSection : clientSection)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tab === "coach" ? <CoachActive /> : <ClientActive />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Stand */}
        <div className="mx-auto mt-2 h-7 w-20 rounded-b-[8px] bg-gradient-to-b from-neutral-400 to-neutral-500" />
      </div>
      <div className="mx-auto mt-1 h-2.5 w-48 rounded-full bg-neutral-400/50 blur-[3px]" />
    </div>
  );
}
