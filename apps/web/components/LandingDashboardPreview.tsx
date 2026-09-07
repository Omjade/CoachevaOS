"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarBlankIcon as CalendarBlank,
  NotePencilIcon as NotePencil,
  TrendUpIcon as TrendUp,
  CheckSquareIcon as CheckSquare,
  VideoCameraIcon as VideoCamera,
  PackageIcon as Package,
} from "@phosphor-icons/react";
import { GoogleMeetIcon } from "@/components/ProviderIcons";

// A curated, purpose-built marketing mockup — not a literal embed of the
// authenticated dashboard/calendar/client-detail routes it's inspired by
// (those live at very different URLs and pull real data). Visual language
// (Card radii/shadow, stat-tile icon circles, session-row layout, accent
// colors) is matched to app/(app)/[slug]/dashboard, calendar, and
// clients/[id] so a coach who signs up sees a genuinely familiar UI, not a
// bait-and-switch screenshot.

const SESSIONS = [
  { client: "Priya K.", time: "10:00 AM", provider: "Google Meet" },
  { client: "Marcus T.", time: "1:30 PM", provider: "Zoom" },
  { client: "Elena R.", time: "4:00 PM", provider: "Google Meet" },
];

const TASKS = [
  { label: "Log 3 strength workouts this week", done: true },
  { label: "Track daily protein intake", done: true },
  { label: "Complete mobility routine (video linked)", done: false },
];

function CoachView() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-[16px] border border-neutral-300/50 bg-white p-4 shadow-[0_10px_20px_rgba(28,29,31,0.05)] sm:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CalendarBlank className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Today's sessions</p>
        </div>
        <div className="flex flex-col gap-2">
          {SESSIONS.map((s) => (
            <div
              key={s.client}
              className="flex items-center justify-between rounded-[10px] border border-neutral-200 px-3 py-2"
            >
              <div>
                <p className="text-xs font-medium text-neutral-800">{s.client}</p>
                <p className="text-[10px] text-neutral-500">
                  {s.time} · {s.provider}
                </p>
              </div>
              <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                Join
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-neutral-300/50 bg-white p-4 shadow-[0_10px_20px_rgba(28,29,31,0.05)]">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <NotePencil className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">Session notes — Priya K.</p>
        </div>
        <p className="rounded-[10px] bg-neutral-100 p-3 text-[11px] leading-relaxed text-neutral-600">
          Hit a new squat PR today (135lb x 5). Mentioned work stress affecting sleep — check in on
          recovery next session. Private, only visible to you.
        </p>
      </div>

      <div className="rounded-[16px] bg-neutral-900 p-4 text-white shadow-[0_10px_20px_rgba(28,29,31,0.15)]">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-accent-500">
            <TrendUp className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-200">This month</p>
        </div>
        <p className="font-heading text-2xl font-semibold text-white">$4,850</p>
        <p className="text-[10px] text-neutral-400">+12% vs. last month · 14 active clients</p>
      </div>
    </div>
  );
}

function ClientView() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-[16px] border border-neutral-300/50 bg-white p-4 shadow-[0_10px_20px_rgba(28,29,31,0.05)] sm:col-span-2">
        <div className="mb-3 flex items-center justify-between">
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
        <button className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-[11px] font-semibold text-white">
          Join session
        </button>
      </div>

      <div className="rounded-[16px] border border-neutral-300/50 bg-white p-4 shadow-[0_10px_20px_rgba(28,29,31,0.05)]">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CheckSquare className="h-3.5 w-3.5" weight="fill" />
          </span>
          <p className="text-xs font-semibold text-neutral-900">This week's homework</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {TASKS.map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] ${
                  t.done ? "border-accent-600 bg-accent-600 text-white" : "border-neutral-300 text-transparent"
                }`}
              >
                ✓
              </span>
              <p className={`text-[11px] ${t.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                {t.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-neutral-300/50 bg-white p-4 shadow-[0_10px_20px_rgba(28,29,31,0.05)]">
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
      </div>
    </div>
  );
}

export default function LandingDashboardPreview() {
  const [tab, setTab] = useState<"coach" | "client">("coach");

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Apple Studio Display-style frame: silver bezel + stand */}
      <div className="rounded-[22px] bg-gradient-to-b from-neutral-300 to-neutral-400 p-3 shadow-[0_30px_60px_rgba(28,29,31,0.18)]">
        <div className="overflow-hidden rounded-[14px] bg-neutral-100">
          <div className="flex items-center justify-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
            <button
              onClick={() => setTab("coach")}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                tab === "coach" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              What you see (Coach)
            </button>
            <button
              onClick={() => setTab("client")}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                tab === "client" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              What your client sees
            </button>
          </div>
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === "coach" ? <CoachView /> : <ClientView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Stand */}
        <div className="mx-auto mt-2 h-6 w-16 rounded-b-[6px] bg-gradient-to-b from-neutral-400 to-neutral-500" />
      </div>
      <div className="mx-auto mt-1 h-2 w-40 rounded-full bg-neutral-300/70 blur-[2px]" />
    </div>
  );
}
