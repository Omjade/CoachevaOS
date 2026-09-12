"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VideoCameraIcon as VideoCamera,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  CalendarBlankIcon as CalendarBlank,
} from "@phosphor-icons/react";
import { api, MeetingData } from "@/lib/api";
import { Card } from "@/components/ui";

const TYPE_ICON = { video: VideoCamera, in_person: MapPin, phone: Phone } as const;

export default function TodaysSessionsPanel({ date }: { date: string }) {
  const [sessions, setSessions] = useState<MeetingData[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api
      .todaysSessions(date)
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [date]);

  async function mark(session: MeetingData, status: "attended" | "no_show") {
    setBusyId(session.id);
    try {
      const updated = await api.updateSession(session.id, { status });
      setSessions((prev) => prev?.map((s) => (s.id === session.id ? updated : s)) ?? null);
    } catch {
      // best-effort — leave the row as-is on failure
    } finally {
      setBusyId(null);
    }
  }

  if (sessions === null) return null;

  return (
    <Card className="animate-fade-up !p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <CalendarBlank className="h-4 w-4" weight="fill" />
        </span>
        <h3 className="font-heading text-sm font-semibold text-neutral-900">Today&apos;s sessions</h3>
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-neutral-500">Nothing scheduled for this day.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => {
            const Icon = TYPE_ICON[session.session_type];
            const when = new Date(session.starts_at);
            const marked = session.status === "attended" || session.status === "no_show";
            return (
              <div
                key={session.id}
                className="flex items-center justify-between gap-2 rounded-[12px] border border-neutral-200 bg-white px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-neutral-800">{session.client_name}</p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {session.location ? ` · ${session.location}` : ""}
                    </p>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {marked ? (
                    <motion.span
                      key="marked"
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        session.status === "attended"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-accent-200 text-accent-800"
                      }`}
                    >
                      {session.status === "attended" ? "Attended" : "No-show"}
                    </motion.span>
                  ) : (
                    <motion.div key="actions" className="flex shrink-0 gap-1.5">
                      {session.meeting_url && (
                        <a
                          href={session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white"
                        >
                          Join
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={busyId === session.id}
                        onClick={() => mark(session, "attended")}
                        className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-50"
                      >
                        Attended
                      </button>
                      <button
                        type="button"
                        disabled={busyId === session.id}
                        onClick={() => mark(session, "no_show")}
                        className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-50"
                      >
                        No-show
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
