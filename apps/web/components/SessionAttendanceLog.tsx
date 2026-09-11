"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VideoCameraIcon as VideoCamera,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
} from "@phosphor-icons/react";
import { api, MeetingData, MeetingStatus } from "@/lib/api";
import { Card } from "@/components/ui";

const TYPE_ICON = { video: VideoCamera, in_person: MapPin, phone: Phone } as const;

// Same accent-intensity convention as the client list's StatusTag (clients
// page): a positive/neutral state gets the lighter accent-100/700, an
// attention-worthy state gets the stronger accent-200/800 + bold, and a
// fully inactive state is plain neutral — never a literal red/green.
const STATUS_STYLE: Record<MeetingStatus, string> = {
  scheduled: "bg-neutral-200 text-neutral-700",
  attended: "bg-accent-100 text-accent-700",
  no_show: "bg-accent-200 text-accent-800 font-semibold",
  canceled: "bg-neutral-200 text-neutral-500",
  rescheduled: "bg-neutral-200 text-neutral-700",
  completed: "bg-accent-100 text-accent-700",
};

const STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  attended: "Attended",
  no_show: "No-show",
  canceled: "Cancelled",
  rescheduled: "Rescheduled",
  completed: "Attended",
};

const CYCLE: MeetingStatus[] = ["scheduled", "attended", "no_show", "canceled"];

export default function SessionAttendanceLog({
  clientId,
  refreshKey,
}: {
  clientId: string;
  refreshKey?: number;
}) {
  const [sessions, setSessions] = useState<MeetingData[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function refresh() {
    api
      .listSessions({ client_id: clientId })
      .then(setSessions)
      .catch(() => setSessions([]));
  }

  useEffect(refresh, [clientId, refreshKey]);

  if (!sessions || sessions.length === 0) return null;

  const attended = sessions.filter((s) => s.status === "attended" || s.status === "completed").length;
  const noShow = sessions.filter((s) => s.status === "no_show").length;
  const marked = attended + noShow;
  const attendanceRate = marked > 0 ? Math.round((attended / marked) * 100) : null;

  async function cycleStatus(session: MeetingData) {
    const currentIdx = CYCLE.indexOf(session.status);
    const next = CYCLE[(currentIdx === -1 ? 0 : currentIdx + 1) % CYCLE.length];
    setUpdatingId(session.id);
    try {
      const updated = await api.updateSession(session.id, { status: next });
      setSessions((prev) => prev?.map((s) => (s.id === session.id ? updated : s)) ?? null);
    } catch {
      // Best-effort — a failed status update just leaves the row as-is,
      // matching the silent-fail pattern used across this page's other cards.
    } finally {
      setUpdatingId(null);
    }
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-neutral-900">Session log</h3>
        {attendanceRate !== null && (
          <span className="text-xs font-semibold text-neutral-500">
            {attendanceRate}% attendance
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((session) => {
          const Icon = TYPE_ICON[session.session_type];
          const when = new Date(session.starts_at);
          return (
            <div
              key={session.id}
              className="flex items-center justify-between gap-2 rounded-[10px] px-2 py-2 hover:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-800">
                    {when.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                    {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                  {session.location && (
                    <p className="truncate text-[11px] text-neutral-400">{session.location}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => cycleStatus(session)}
                disabled={updatingId === session.id}
                className="shrink-0"
                title="Tap to update status"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={session.status}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[session.status]}`}
                  >
                    {STATUS_LABEL[session.status]}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
