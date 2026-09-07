"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFourIcon as SquaresFour,
  UsersIcon as Users,
  CalendarBlankIcon as CalendarBlank,
  CurrencyDollarIcon as CurrencyDollar,
  TrendUpIcon as TrendUp,
  WarningIcon as Warning,
  CheckSquareIcon as CheckSquare,
  PackageIcon as Package,
  VideoCameraIcon as VideoCamera,
} from "@phosphor-icons/react";
import { GoogleMeetIcon } from "@/components/ProviderIcons";
import { ClientGrowthChart, EngagementTrendChart, LeadFunnelChart, Sparkline } from "@/components/DashboardCharts";
import { Card } from "@/components/ui";
import type { WeekPoint, CheckinWeekPoint, FunnelPoint } from "@/lib/api";

// A purpose-built marketing mockup, not a literal embed of the authenticated
// app — but it reuses the REAL chart components from DashboardCharts.tsx
// (ClientGrowthChart/EngagementTrendChart/LeadFunnelChart/Sparkline) fed
// with realistic dummy data, so what a visitor sees here is visually
// identical to what the real dashboard renders, not an invented look-alike.
// Sidebar items are visual-only (switch which mock section is shown, no
// real routing/data) — enough to convey the app's actual navigation shape
// without pretending this is a live account.

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

const SESSIONS = [
  { client: "Priya K.", time: "10:00 AM", provider: "Google Meet" },
  { client: "Marcus T.", time: "1:30 PM", provider: "Zoom" },
  { client: "Elena R.", time: "4:00 PM", provider: "Google Meet" },
];

const CLIENTS = [
  { name: "Priya K.", status: "On track", note: "New revenue high this quarter — discuss scaling plan next." },
  { name: "Marcus T.", status: "At risk", note: "Missed last 2 check-ins, hasn't logged progress in 9 days." },
  { name: "Elena R.", status: "On track", note: "3 interviews booked this week, prepping for final round." },
];

const PAYMENTS = [
  { client: "Priya K.", amount: "$450", status: "Paid" },
  { client: "Marcus T.", amount: "$450", status: "Paid" },
  { client: "Elena R.", amount: "$320", status: "Due in 3 days" },
];

const TASKS = [
  { label: "Log 3 strength workouts this week", done: true },
  { label: "Track daily protein intake", done: true },
  { label: "Complete mobility routine (video linked)", done: false },
];

const COACH_SECTIONS = [
  { key: "dashboard", label: "Dashboard", Icon: SquaresFour },
  { key: "clients", label: "Clients", Icon: Users },
  { key: "calendar", label: "Calendar", Icon: CalendarBlank },
  { key: "billing", label: "Billing", Icon: CurrencyDollar },
] as const;

const CLIENT_SECTIONS = [
  { key: "dashboard", label: "Dashboard", Icon: SquaresFour },
  { key: "sessions", label: "Sessions", Icon: VideoCamera },
  { key: "tasks", label: "Tasks", Icon: CheckSquare },
  { key: "package", label: "Package", Icon: Package },
] as const;

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

function CoachDashboardSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[16px] bg-neutral-900 p-4 text-white">
        <p className="mb-2 text-xs font-semibold text-neutral-300">Today's AI briefing</p>
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
        <StatTile Icon={Users} value="3" label="Leads waiting" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClientGrowthChart data={GROWTH_DATA} />
        <LeadFunnelChart data={FUNNEL_DATA} />
      </div>
    </div>
  );
}

function CoachClientsSection() {
  return (
    <div className="flex flex-col gap-2">
      {CLIENTS.map((c) => (
        <div key={c.name} className="rounded-[12px] border border-neutral-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-800">{c.name}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                c.status === "On track" ? "bg-accent-100 text-accent-700" : "bg-red-100 text-red-700"
              }`}
            >
              {c.status}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

function CoachCalendarSection() {
  return (
    <div className="flex flex-col gap-2">
      {SESSIONS.map((s) => (
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

function CoachBillingSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[16px] bg-neutral-900 p-5 text-white">
        <p className="mb-1 text-xs font-semibold text-neutral-300">Monthly recurring revenue</p>
        <p className="font-heading text-3xl font-semibold">$4,850</p>
        <p className="text-[11px] text-neutral-400">+12% vs. last month</p>
      </div>
      <div className="flex flex-col gap-2">
        {PAYMENTS.map((p) => (
          <div key={p.client} className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-neutral-800">{p.client}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-neutral-900">{p.amount}</p>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${p.status === "Paid" ? "bg-accent-100 text-accent-700" : "bg-amber-100 text-amber-700"}`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientDashboardSection() {
  return (
    <div className="flex flex-col gap-4">
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
      <EngagementTrendChart data={ENGAGEMENT_DATA} />
    </div>
  );
}

function ClientSessionsSection() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { label: "Thursday, 10:00 AM", state: "Upcoming" },
        { label: "Last Thursday, 10:00 AM", state: "Completed" },
        { label: "2 weeks ago, 10:00 AM", state: "Completed" },
      ].map((s) => (
        <div key={s.label} className="flex items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-neutral-800">{s.label}</p>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${s.state === "Upcoming" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"}`}>
            {s.state}
          </span>
        </div>
      ))}
    </div>
  );
}

function ClientTasksSection() {
  return (
    <div className="flex flex-col gap-1.5">
      {TASKS.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-white px-4 py-3">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] ${t.done ? "border-accent-600 bg-accent-600 text-white" : "border-neutral-300 text-transparent"}`}>✓</span>
          <p className={`text-xs ${t.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>{t.label}</p>
        </div>
      ))}
    </div>
  );
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

// Styling matches the real authenticated Sidebar.tsx exactly — dark
// neutral-900 panel, brand mark, active-item accent inset border with
// accent-filled icon, avatar+identity footer — not a generic mock nav.
function Sidebar<T extends string>({
  items,
  active,
  onSelect,
  identityName,
  identityRole,
}: {
  items: readonly { key: T; label: string; Icon: typeof Users }[];
  active: T;
  onSelect: (k: T) => void;
  identityName: string;
  identityRole: string;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col rounded-[14px] bg-neutral-900 px-3 py-4 md:w-44">
      <div className="mb-5 flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
        </span>
        <span className="font-heading truncate text-xs font-bold text-white">CoachevaOS</span>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col">
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
      <div className="mt-4 hidden items-center gap-2 border-t border-white/10 px-1 pt-3 md:flex">
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

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Apple Studio Display-style frame: aluminum bezel, camera dot, stand */}
      <div className="rounded-[24px] bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 p-[10px] shadow-[0_40px_80px_rgba(28,29,31,0.2)]">
        <div className="relative overflow-hidden rounded-[16px] bg-neutral-100">
          <div className="absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-neutral-500" />
          {/* App topbar — brand mark + the coach/client view toggle live here,
              same row, like a real app header rather than floating pills */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900">
                <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
              </span>
              <span className="font-heading hidden text-xs font-bold text-neutral-900 sm:inline">CoachevaOS</span>
            </div>
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

          <div className="flex flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-5">
            {tab === "coach" ? (
              <Sidebar
                items={COACH_SECTIONS}
                active={coachSection}
                onSelect={setCoachSection}
                identityName="Coach Amara"
                identityRole="Business coaching"
              />
            ) : (
              <Sidebar
                items={CLIENT_SECTIONS}
                active={clientSection}
                onSelect={setClientSection}
                identityName="Priya K."
                identityRole="Client"
              />
            )}
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab + (tab === "coach" ? coachSection : clientSection)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tab === "coach" && coachSection === "dashboard" && <CoachDashboardSection />}
                  {tab === "coach" && coachSection === "clients" && <CoachClientsSection />}
                  {tab === "coach" && coachSection === "calendar" && <CoachCalendarSection />}
                  {tab === "coach" && coachSection === "billing" && <CoachBillingSection />}
                  {tab === "client" && clientSection === "dashboard" && <ClientDashboardSection />}
                  {tab === "client" && clientSection === "sessions" && <ClientSessionsSection />}
                  {tab === "client" && clientSection === "tasks" && <ClientTasksSection />}
                  {tab === "client" && clientSection === "package" && <ClientPackageSection />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Stand */}
        <div className="mx-auto mt-2 h-7 w-20 rounded-b-[8px] bg-gradient-to-b from-neutral-400 to-neutral-500" />
      </div>
      <div className="mx-auto mt-1 h-2.5 w-48 rounded-full bg-neutral-400/50 blur-[3px]" />
      <p className="mt-4 text-center text-[10px] text-neutral-400">
        Click the sidebar to browse — dummy data shown, exactly how the real layout looks.
      </p>
    </div>
  );
}
