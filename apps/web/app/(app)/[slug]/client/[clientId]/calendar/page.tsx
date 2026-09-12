"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowSquareOutIcon as ArrowSquareOut,
  CalendarBlankIcon as CalendarBlank,
  PencilSimpleIcon as PencilSimple,
  ProhibitIcon as Prohibit,
} from "@phosphor-icons/react";
import { api, ApiError, AvailabilityRules, MeetingData } from "@/lib/api";
import { Button, Card, Eyebrow, Input } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { ClientCalendar } from "@/app/(app)/[slug]/calendar/page";

const WINDOW_DAYS = 20;

const PROVIDER_LABEL: Record<string, string> = { google: "Google Meet", zoom: "Zoom" };

function withinNextNDays(iso: string, days: number): boolean {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return t >= now - 60_000 && t <= now + days * 86400000;
}

// Unlike dashboard/settings, a coach's full account-level Calendar page
// (availability rules + every client's meetings + integrations) genuinely
// doesn't have a client-scoped equivalent — rendering it here would leak
// every other client's meetings into a single-client URL, a real scope leak,
// not a convenience. Instead this renders a light, real, client-scoped slice:
// just this client's meetings plus a quick way to schedule one.
function CoachClientCalendar({ slug, clientId }: { slug: string; clientId: string }) {
  const [meetings, setMeetings] = useState<MeetingData[] | null>(null);
  const [rules, setRules] = useState<AvailabilityRules | null>(null);
  const [starts, setStarts] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");

  function refresh() {
    api
      .listMeetings()
      .then((all) => setMeetings(all.filter((m) => m.client_id === clientId)))
      .catch(() => setMeetings([]));
  }

  useEffect(refresh, [clientId]);
  useEffect(() => {
    api.getMyAvailability().then(setRules).catch(() => {});
  }, []);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    if (!starts) return;
    setScheduling(true);
    setError(null);
    try {
      const startsAt = new Date(starts);
      const endsAt = new Date(startsAt.getTime() + (rules?.session_length ?? 45) * 60 * 1000);
      await api.createMeeting({
        client_id: clientId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });
      setStarts("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't schedule that session. Try again.");
    } finally {
      setScheduling(false);
    }
  }

  async function cancelMeeting(meetingId: string) {
    setBusyId(meetingId);
    setError(null);
    try {
      await api.cancelMeeting(meetingId);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel that session. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function startReschedule(m: MeetingData) {
    setReschedulingId(m.id);
    const d = new Date(m.starts_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setRescheduleValue(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setError(null);
  }

  async function confirmReschedule(meetingId: string) {
    if (!rescheduleValue) return;
    setBusyId(meetingId);
    setError(null);
    try {
      await api.rescheduleMeeting(meetingId, { starts_at: new Date(rescheduleValue).toISOString() });
      setReschedulingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reschedule that session. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleMeetings = useMemo(() => {
    const upcoming = (meetings ?? []).filter((m) => m.status === "scheduled");
    return showAll ? upcoming : upcoming.filter((m) => withinNextNDays(m.starts_at, WINDOW_DAYS));
  }, [meetings, showAll]);
  const hiddenCount = (meetings ?? []).filter((m) => m.status === "scheduled").length - visibleMeetings.length;

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Eyebrow className="mb-0">Calendar</Eyebrow>
        <Link href={`/${slug}/calendar`} className="text-xs font-medium text-accent-600 hover:underline">
          Availability & integrations
        </Link>
      </div>

      <Card>
        <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">Schedule a session</h3>
        <form onSubmit={schedule} className="flex flex-wrap items-end gap-3">
          <Input
            type="datetime-local"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
            required
            className="w-auto"
          />
          <Button type="submit" loading={scheduling}>
            {scheduling ? "Scheduling…" : "Schedule"}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-accent-600">{error}</p>}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-neutral-900">Sessions</h3>
          <span className="text-xs text-neutral-400">Next {WINDOW_DAYS} days</span>
        </div>
        {meetings === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : visibleMeetings.length === 0 ? (
          <p className="text-sm text-neutral-500">No sessions scheduled with this client in this window.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleMeetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-neutral-900">
                    <CalendarBlank className="h-4 w-4 text-accent-600" weight="fill" />
                    {new Date(m.starts_at).toLocaleString()}
                    {m.meeting_provider && (
                      <span className="text-xs text-neutral-500">
                        · {PROVIDER_LABEL[m.meeting_provider] ?? m.meeting_provider}
                      </span>
                    )}
                  </span>
                  {m.booking_source !== "internal" && (
                    <span className="text-xs text-neutral-400">
                      Booked via {m.booking_source === "calendly" ? "Calendly" : "Cal.com"} — manage
                      the time there
                    </span>
                  )}
                </span>
                {reschedulingId === m.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={rescheduleValue}
                      onChange={(e) => setRescheduleValue(e.target.value)}
                      className="w-auto text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => confirmReschedule(m.id)}
                      disabled={busyId === m.id}
                    >
                      {busyId === m.id ? "Saving…" : "Confirm"}
                    </Button>
                    <button
                      className="text-xs text-neutral-500 underline"
                      onClick={() => setReschedulingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {m.meeting_url && (
                      <a
                        href={m.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-accent-600 hover:text-accent-700"
                      >
                        Join
                        <ArrowSquareOut className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {m.booking_source === "internal" && (
                      <button
                        className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                        onClick={() => startReschedule(m)}
                      >
                        <PencilSimple className="h-3.5 w-3.5" />
                        Reschedule
                      </button>
                    )}
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                      onClick={() => cancelMeeting(m.id)}
                      disabled={busyId === m.id}
                    >
                      <Prohibit className="h-3.5 w-3.5" />
                      {busyId === m.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {hiddenCount > 0 && (
          <button
            className="mt-3 text-xs font-medium text-accent-600 hover:underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show only next 20 days" : `View ${hiddenCount} more upcoming`}
          </button>
        )}
      </Card>
    </div>
  );
}

export default function NestedCalendarPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { slug, clientId } = use(params);
  const role = useViewerRole();

  if (role === null) return null;
  if (role === "coach") return <CoachClientCalendar slug={slug} clientId={clientId} />;
  return <ClientCalendar />;
}
