"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowSquareOutIcon as ArrowSquareOut, CalendarBlankIcon as CalendarBlank } from "@phosphor-icons/react";
import { api, ApiError, MeetingData } from "@/lib/api";
import { Button, Card, Eyebrow, Input } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { ClientCalendar } from "@/app/(app)/[slug]/calendar/page";

// Unlike dashboard/settings, a coach's full account-level Calendar page
// (availability rules + every client's meetings + integrations) genuinely
// doesn't have a client-scoped equivalent — rendering it here would leak
// every other client's meetings into a single-client URL, a real scope leak,
// not a convenience. Instead this renders a light, real, client-scoped slice:
// just this client's meetings plus a quick way to schedule one.
function CoachClientCalendar({ slug, clientId }: { slug: string; clientId: string }) {
  const [meetings, setMeetings] = useState<MeetingData[] | null>(null);
  const [starts, setStarts] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api
      .listMeetings()
      .then((all) => setMeetings(all.filter((m) => m.client_id === clientId)))
      .catch(() => setMeetings([]));
  }

  useEffect(refresh, [clientId]);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    if (!starts) return;
    setScheduling(true);
    setError(null);
    try {
      const startsAt = new Date(starts);
      const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);
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
        <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">Sessions</h3>
        {meetings === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-neutral-500">No sessions scheduled with this client yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 text-neutral-900">
                  <CalendarBlank className="h-4 w-4 text-accent-600" weight="fill" />
                  {new Date(m.starts_at).toLocaleString()}
                </span>
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
              </div>
            ))}
          </div>
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
