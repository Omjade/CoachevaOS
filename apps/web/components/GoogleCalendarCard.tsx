"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarBlankIcon as CalendarBlank,
  VideoCameraIcon as VideoCamera,
  ArrowSquareOutIcon as ArrowSquareOut,
} from "@phosphor-icons/react";
import { api, ApiError, GoogleCalendarEvent } from "@/lib/api";
import { Button, Card } from "@/components/ui";

function formatEventTime(e: GoogleCalendarEvent): string {
  if (e.all_day_date) {
    return new Date(e.all_day_date).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  if (!e.start) return "";
  const d = new Date(e.start);
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// A compact, coach-only "what's really on my Google Calendar" widget for the
// profile/settings page — a live read from Google itself (not this app's own
// internal Meeting table), so it includes events booked outside CoachevaOS
// too. Never rendered on any client-facing or public page: real event
// titles/times are private to the coach.
export default function GoogleCalendarCard() {
  const params = useParams<{ slug: string }>();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<GoogleCalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  function load() {
    setError(null);
    setNeedsReconnect(false);
    api
      .listIntegrations()
      .then((integrations) => {
        const google = integrations.find((i) => i.provider === "google");
        setConnected(!!google?.connected);
        if (!google?.connected) return;
        api
          .listGoogleCalendarEvents()
          .then(setEvents)
          .catch((err) => {
            if (err instanceof ApiError && err.status === 409) {
              setNeedsReconnect(true);
            } else {
              setError(err instanceof ApiError ? err.message : "Couldn't load your calendar.");
            }
          });
      })
      .catch(() => setConnected(false));
  }

  useEffect(load, []);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <CalendarBlank className="h-4.5 w-4.5" weight="fill" />
        </span>
        <div>
          <h3 className="font-heading text-sm font-semibold text-neutral-900">Google Calendar</h3>
          <p className="text-xs text-neutral-500">Your next 10 upcoming events, straight from Google.</p>
        </div>
      </div>

      {connected === null ? null : !connected ? (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5">
          <p className="text-xs text-neutral-600">Not connected yet.</p>
          <Link href={`/${params.slug}/calendar`}>
            <Button variant="secondary" size="sm">
              Connect from Calendar
            </Button>
          </Link>
        </div>
      ) : needsReconnect ? (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-accent-200 bg-accent-100 px-3.5 py-2.5">
          <p className="text-xs text-neutral-700">Access expired. Reconnect to keep seeing your events.</p>
          <Link href={`/${params.slug}/calendar`}>
            <Button variant="secondary" size="sm">
              Reconnect from Calendar
            </Button>
          </Link>
        </div>
      ) : error ? (
        <p className="text-xs text-accent-600">
          {error}{" "}
          <button type="button" onClick={load} className="font-medium underline">
            Try again
          </button>
        </p>
      ) : events === null ? (
        <p className="text-xs text-neutral-500">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-neutral-500">Nothing on your calendar in the next few weeks.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-neutral-200/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{e.summary}</p>
                <p className="text-xs text-neutral-500">{formatEventTime(e)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {e.hangout_link && (
                  <a
                    href={e.hangout_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
                  >
                    <VideoCamera className="h-3.5 w-3.5" />
                    Join
                  </a>
                )}
                {e.html_link && (
                  <a
                    href={e.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-neutral-600"
                    aria-label="Open in Google Calendar"
                  >
                    <ArrowSquareOut className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
