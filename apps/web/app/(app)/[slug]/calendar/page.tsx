"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  PlusIcon as Plus,
  XIcon as X,
  CheckIcon as Check,
  LinkIcon as LinkIconGlyph,
  ArrowSquareOutIcon as ArrowSquareOut,
  PencilSimpleIcon as PencilSimple,
  ProhibitIcon as Prohibit,
} from "@phosphor-icons/react";
import { GoogleMeetIcon, ZoomIcon, CalendlyIcon, CalDotComIcon } from "@/components/ProviderIcons";
import GoogleCalendarCard from "@/components/GoogleCalendarCard";
import {
  api,
  API_URL,
  ApiError,
  AvailabilityRules,
  AvailabilityRulesWithTimezone,
  CalendarProviderKey,
  CoachProfile,
  IntegrationStatus,
  MeetingData,
  SchedulingLinks,
} from "@/lib/api";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button, Card, Eyebrow, Input } from "@/components/ui";
import { getNicheConfig } from "@/lib/niche";
import { useViewerRole } from "@/lib/useViewerRole";
import { useCurrentUser } from "@/lib/useCurrentUser";

const WINDOW_DAYS = 20;

// A coach's calendar reads in the coach's own local time (correct as-is) —
// this only adds an explicit "for {client}" tag next to it using the
// client's real stored timezone, so it's never ambiguous whose clock a
// meeting time is shown in.
function timeInZone(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}

const PROVIDER_ICON: Record<CalendarProviderKey, typeof GoogleMeetIcon> = {
  google: GoogleMeetIcon,
  zoom: ZoomIcon,
  calendly: CalendlyIcon,
  cal_com: CalDotComIcon,
};

const PROVIDERS: { key: CalendarProviderKey; label: string; Icon: typeof GoogleMeetIcon }[] = [
  { key: "google", label: "Google Meet", Icon: GoogleMeetIcon },
  { key: "zoom", label: "Zoom", Icon: ZoomIcon },
  { key: "calendly", label: "Calendly", Icon: CalendlyIcon },
  { key: "cal_com", label: "Cal.com", Icon: CalDotComIcon },
];

const DAY_KEYS: (keyof AvailabilityRules["days"])[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DEFAULT_RULES: AvailabilityRules = {
  session_length: 45,
  buffer: 10,
  days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
  slots: [],
};

// Calendar-day arithmetic done entirely in the coach's own timezone, never
// the viewer's browser zone — otherwise a client near a date boundary could
// be shown (and book) the wrong day relative to the coach's real calendar.
// Only the Y/M/D components matter here; the actual instant is constructed
// server-side from date+time+coach_timezone, so plain UTC-midnight markers
// are a safe, DST-proof way to walk whole calendar days.
function todayInTimezone(timezone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day") };
}

function nextDatesForDayInTimezone(
  dayIndex: number,
  timezone: string,
  count = 3
): { iso: string; weekday: number; label: string }[] {
  const { y, m, d } = todayInTimezone(timezone);
  const startUtc = Date.UTC(y, m - 1, d);
  const dates: { iso: string; weekday: number; label: string }[] = [];
  for (let i = 0; dates.length < count && i < 28; i++) {
    const cursor = new Date(startUtc + i * 86400000);
    if (cursor.getUTCDay() === dayIndex) {
      const iso = cursor.toISOString().slice(0, 10);
      const label = cursor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      dates.push({ iso, weekday: dayIndex, label });
    }
  }
  return dates;
}

function withinNextNDays(iso: string, days: number): boolean {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return t >= now - 60_000 && t <= now + days * 86400000;
}

export default function CalendarPage() {
  const role = useViewerRole();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (role !== "client") return;
    api
      .getMyClientProfile()
      .then((p) => router.replace(`/${params.slug}/client/${p.id}/calendar`))
      .catch(() => {});
  }, [role, router, params.slug]);

  if (role === null) return null;
  if (role === "client") return null; // redirecting via the effect above
  return (
    <Suspense fallback={null}>
      <CoachCalendar />
    </Suspense>
  );
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google Meet",
  zoom: "Zoom",
  calendly: "Calendly",
  cal_com: "Cal.com",
};

function MeetingProviderBadge({ provider }: { provider: "google" | "zoom" | null }) {
  if (!provider) return null;
  const Icon = PROVIDER_ICON[provider];
  return (
    <span className="flex items-center gap-1 text-xs text-neutral-500">
      <Icon className="h-3.5 w-3.5" />
      {PROVIDER_LABEL[provider]}
    </span>
  );
}

const BOOKING_SOURCE_LABEL: Record<string, string> = {
  calendly: "Calendly",
  cal_com: "Cal.com",
};

// An externally-synced meeting (booked on the coach's own Calendly/Cal.com
// page, mirrored in here via their webhook) isn't one CoachevaOS can safely
// reschedule — there's no way to push that change back to the real booking,
// so it would just desync. Cancelling only affects our own mirrored copy;
// the caption below makes that limitation explicit rather than implying a
// full round-trip that doesn't exist.
function ExternalBookingNote({ source }: { source: MeetingData["booking_source"] }) {
  if (source === "internal") return null;
  return (
    <p className="text-xs text-neutral-400">
      Booked via {BOOKING_SOURCE_LABEL[source]} — manage the time there; cancelling here only
      updates this view.
    </p>
  );
}

function CoachCalendar() {
  const searchParams = useSearchParams();
  const [rules, setRules] = useState<AvailabilityRules>(DEFAULT_RULES);
  const [newSlot, setNewSlot] = useState("");
  const [saved, setSaved] = useState(false);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [disconnecting, setDisconnecting] = useState<CalendarProviderKey | null>(null);
  const [settingDefault, setSettingDefault] = useState<CalendarProviderKey | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState<string | null>(null);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [meetingActionError, setMeetingActionError] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [busyMeetingId, setBusyMeetingId] = useState<string | null>(null);

  function refreshMeetings() {
    api.listMeetings().then(setMeetings).catch(() => {});
  }

  function refreshIntegrations() {
    api.listIntegrations().then(setIntegrations).catch(() => setIntegrations([]));
  }

  useEffect(() => {
    api.myProfile().then(setProfile).catch(() => {});
    api.getMyAvailability().then(setRules).catch(() => {});
    refreshMeetings();
    refreshIntegrations();
  }, []);

  // A failed OAuth connect attempt previously landed back here with zero
  // explanation — the provider just stayed "not connected" with no visible
  // reason. A successful one already self-corrected via the unconditional
  // refetch above, but had no explicit confirmation either.
  useEffect(() => {
    const errorProvider = searchParams.get("integration_error");
    const connectedProvider = searchParams.get("connected");
    if (errorProvider) {
      setIntegrationError(
        `Couldn't connect ${PROVIDER_LABEL[errorProvider] ?? errorProvider}. Please try again.`
      );
    } else if (connectedProvider) {
      setJustConnected(PROVIDER_LABEL[connectedProvider] ?? connectedProvider);
      setTimeout(() => setJustConnected(null), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function disconnect(provider: CalendarProviderKey) {
    setDisconnecting(provider);
    setIntegrationError(null);
    try {
      await api.disconnectIntegration(provider);
      refreshIntegrations();
    } catch (err) {
      setIntegrationError(err instanceof ApiError ? err.message : "Couldn't disconnect. Try again.");
    } finally {
      setDisconnecting(null);
    }
  }

  async function setDefault(provider: CalendarProviderKey) {
    setSettingDefault(provider);
    setIntegrationError(null);
    try {
      const updated = await api.setDefaultVideoProvider(provider);
      setProfile(updated);
    } catch (err) {
      setIntegrationError(err instanceof ApiError ? err.message : "Couldn't set default. Try again.");
    } finally {
      setSettingDefault(null);
    }
  }

  async function save(next: AvailabilityRules) {
    const previous = rules;
    setRules(next);
    setAvailError(null);
    try {
      await api.updateMyAvailability(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setRules(previous);
      setAvailError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    }
  }

  function toggleDay(day: keyof AvailabilityRules["days"]) {
    save({ ...rules, days: { ...rules.days, [day]: !rules.days[day] } });
  }

  function addSlot() {
    if (!newSlot || rules.slots.includes(newSlot)) return;
    save({ ...rules, slots: [...rules.slots, newSlot].sort() });
    setNewSlot("");
  }

  function removeSlot(slot: string) {
    save({ ...rules, slots: rules.slots.filter((s) => s !== slot) });
  }

  async function cancelMeeting(meetingId: string) {
    setBusyMeetingId(meetingId);
    setMeetingActionError(null);
    try {
      await api.cancelMeeting(meetingId);
      refreshMeetings();
    } catch (err) {
      setMeetingActionError(
        err instanceof ApiError ? err.message : "Couldn't cancel that session. Try again."
      );
    } finally {
      setBusyMeetingId(null);
    }
  }

  function startReschedule(meeting: MeetingData) {
    setReschedulingId(meeting.id);
    // Pre-fill with the meeting's current local time so the coach is editing
    // from a sensible starting point, not a blank field.
    const d = new Date(meeting.starts_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setRescheduleValue(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setMeetingActionError(null);
  }

  async function confirmReschedule(meetingId: string) {
    if (!rescheduleValue) return;
    setBusyMeetingId(meetingId);
    setMeetingActionError(null);
    try {
      await api.rescheduleMeeting(meetingId, { starts_at: new Date(rescheduleValue).toISOString() });
      setReschedulingId(null);
      refreshMeetings();
    } catch (err) {
      setMeetingActionError(
        err instanceof ApiError ? err.message : "Couldn't reschedule that session. Try again."
      );
    } finally {
      setBusyMeetingId(null);
    }
  }

  const visibleMeetings = useMemo(() => {
    const upcoming = meetings.filter((m) => m.status === "scheduled");
    return showAllMeetings ? upcoming : upcoming.filter((m) => withinNextNDays(m.starts_at, WINDOW_DAYS));
  }, [meetings, showAllMeetings]);
  const hiddenCount =
    meetings.filter((m) => m.status === "scheduled").length - visibleMeetings.length;

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <div>
        <Eyebrow className="mb-2">Calendar</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Availability & meetings
        </h1>
      </div>

      <Card>
        <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">Integrations</h3>
        <p className="mb-4 text-xs text-neutral-500">
          Connect a video or scheduling provider so sessions booked in CoachevaOS get a real
          join link automatically. Your clients will see whichever one is connected.
        </p>
        {integrations !== null &&
          integrations.every((i) => !i.connected) && (
            <div className="mb-4 rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-xs text-neutral-600">
              Nothing connected yet. Pick one below to start. Clients will see a real "Join"
              link on their booked sessions once it's connected.
            </div>
          )}
        {integrationError && <p className="mb-3 text-xs text-accent-600">{integrationError}</p>}
        {justConnected && (
          <p className="mb-3 text-xs font-medium text-green-700">
            {justConnected} connected successfully.
          </p>
        )}
        <div className="flex flex-col gap-2 text-sm">
          {PROVIDERS.map(({ key, label, Icon }) => {
            const status = integrations?.find((i) => i.provider === key);
            const connected = status?.connected ?? false;
            return (
              <div
                key={key}
                className={`flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 ${
                  connected ? "border-green-200 bg-green-50/40" : "border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <Icon className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-neutral-900">
                      {label}
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          connected ? "bg-green-500" : "bg-neutral-300"
                        }`}
                        aria-hidden="true"
                      />
                    </p>
                    <p className="text-xs">
                      {connected ? (
                        <span className="font-medium text-green-700">
                          Connected{status?.account_label ? ` · ${status.account_label}` : ""}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Not connected</span>
                      )}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <div className="flex items-center gap-2">
                    {profile?.default_video_provider === key ? (
                      <span className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white">
                        Default
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDefault(key)}
                        disabled={settingDefault === key}
                      >
                        {settingDefault === key ? "Setting…" : "Set as default"}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => disconnect(key)}
                      disabled={disconnecting === key}
                    >
                      {disconnecting === key ? "Disconnecting…" : "Disconnect"}
                    </Button>
                  </div>
                ) : (
                  <a href={`${API_URL}/integrations/${key}/connect`}>
                    <Button variant="secondary" size="sm">
                      <LinkIconGlyph className="h-3.5 w-3.5" />
                      Connect
                    </Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <GoogleCalendarCard />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-neutral-900">
            Availability & scheduling rules
          </h3>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
              <Check className="h-3.5 w-3.5" weight="bold" />
              Saved
            </span>
          )}
        </div>
        {availError && <p className="mb-3 text-xs text-accent-600">{availError}</p>}

        <div className="mb-4 flex flex-wrap gap-4">
          <label className="text-sm text-neutral-700">
            Session length
            <select
              value={rules.session_length}
              onChange={(e) => save({ ...rules, session_length: Number(e.target.value) })}
              className="ml-2 rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-2.5 py-1.5 text-sm outline-none focus:border-accent-500"
            >
              {[30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-neutral-700">
            Buffer between sessions
            <select
              value={rules.buffer}
              onChange={(e) => save({ ...rules, buffer: Number(e.target.value) })}
              className="ml-2 rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-2.5 py-1.5 text-sm outline-none focus:border-accent-500"
            >
              {[0, 10, 15, 30].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {DAY_KEYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                rules.days[day]
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-neutral-700">Recurring time slots</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {rules.slots.map((slot) => (
              <span
                key={slot}
                className="flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700"
              >
                {slot}
                <button onClick={() => removeSlot(slot)} aria-label="Remove slot">
                  <X className="h-3 w-3" weight="bold" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-2.5 py-1.5 text-sm outline-none focus:border-accent-500"
            />
            <Button type="button" variant="secondary" onClick={addSlot}>
              <Plus className="h-4 w-4" weight="bold" />
              Add time slot
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-neutral-900">
            Upcoming meetings
          </h3>
          <span className="text-xs text-neutral-400">Next {WINDOW_DAYS} days</span>
        </div>
        {meetingActionError && <p className="mb-3 text-xs text-accent-600">{meetingActionError}</p>}
        {visibleMeetings.length === 0 ? (
          <p className="text-sm text-neutral-500">No meetings booked in this window.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleMeetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-neutral-900">
                    {m.client_name}{" "}
                    <span className="text-neutral-500">
                      · {getNicheConfig(profile?.niche).sessionLabel}
                    </span>
                  </span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-neutral-500">
                    <span>
                      {new Date(m.starts_at).toLocaleString()}
                      {m.client_timezone && (
                        <span className="text-neutral-400">
                          {" "}
                          ({timeInZone(m.starts_at, m.client_timezone)} for {m.client_name})
                        </span>
                      )}
                    </span>
                    <MeetingProviderBadge provider={m.meeting_provider} />
                  </div>
                  <ExternalBookingNote source={m.booking_source} />
                </div>
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
                      disabled={busyMeetingId === m.id}
                    >
                      {busyMeetingId === m.id ? "Saving…" : "Confirm"}
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
                      disabled={busyMeetingId === m.id}
                    >
                      <Prohibit className="h-3.5 w-3.5" />
                      {busyMeetingId === m.id ? "Cancelling…" : "Cancel"}
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
            onClick={() => setShowAllMeetings((v) => !v)}
          >
            {showAllMeetings ? "Show only next 20 days" : `View ${hiddenCount} more upcoming`}
          </button>
        )}
      </Card>
    </div>
  );
}

export function ClientCalendar() {
  const { user } = useCurrentUser();
  const [rules, setRules] = useState<AvailabilityRulesWithTimezone | null>(null);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SchedulingLinks | null>(null);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [busyMeetingId, setBusyMeetingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [reschedulingBusyKey, setReschedulingBusyKey] = useState<string | null>(null);

  function refresh() {
    api.listMyMeetings().then(setMeetings).catch(() => {});
  }

  useEffect(() => {
    api.getCoachAvailability().then(setRules).catch(() => {});
    api.getSchedulingLinks().then(setLinks).catch(() => {});
    refresh();
  }, []);

  async function book(dateIso: string, slot: string) {
    const key = `${dateIso}-${slot}`;
    setBooking(key);
    setError(null);
    try {
      await api.bookMeeting(dateIso, slot);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't book that slot");
    } finally {
      setBooking(null);
    }
  }

  async function cancelMeeting(meetingId: string) {
    setBusyMeetingId(meetingId);
    setError(null);
    try {
      await api.cancelMeeting(meetingId);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel that session. Try again.");
    } finally {
      setBusyMeetingId(null);
    }
  }

  async function reschedule(meetingId: string, dateIso: string, slot: string) {
    setReschedulingBusyKey(`${dateIso}-${slot}`);
    setError(null);
    try {
      await api.rescheduleMeeting(meetingId, { date: dateIso, time: slot });
      setReschedulingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reschedule that session. Try again.");
    } finally {
      setReschedulingBusyKey(null);
    }
  }

  const availableDayIndices = rules
    ? DAY_KEYS.map((k, i) => (rules.days[k] ? (i + 1) % 7 : null)).filter(
        (v): v is number => v !== null
      )
    : [];

  const candidateDates = rules
    ? availableDayIndices.flatMap((dayIndex) =>
        nextDatesForDayInTimezone(dayIndex, rules.coach_timezone)
      )
    : [];

  const visibleMeetings = useMemo(() => {
    const upcoming = meetings.filter((m) => m.status === "scheduled");
    return showAllMeetings ? upcoming : upcoming.filter((m) => withinNextNDays(m.starts_at, WINDOW_DAYS));
  }, [meetings, showAllMeetings]);
  const hiddenCount =
    meetings.filter((m) => m.status === "scheduled").length - visibleMeetings.length;

  const slotPicker = (onPick: (dateIso: string, slot: string) => void, busyKey: string | null) => (
    <div className="flex flex-col gap-4">
      {candidateDates.map(({ iso, label }) => (
        <div key={iso}>
          <p className="mb-2 text-sm font-medium">{label}</p>
          <div className="flex flex-wrap gap-2">
            {rules!.slots.map((slot) => {
              const key = `${iso}-${slot}`;
              return (
                <Button
                  key={slot}
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  disabled={busyKey === key}
                  onClick={() => onPick(iso, slot)}
                >
                  {busyKey === key ? "Saving…" : slot}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Book a session
      </h1>

      {links?.video_provider && (
        <div className="flex items-center gap-2 rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-xs text-neutral-600">
          {(() => {
            const Icon = PROVIDER_ICON[links.video_provider];
            return <Icon className="h-5 w-5 shrink-0" />;
          })()}
          Sessions with your coach automatically include a {PROVIDER_LABEL[links.video_provider]}{" "}
          link once booked.
        </div>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-neutral-900">
            Upcoming sessions
          </h3>
          <span className="text-xs text-neutral-400">Next {WINDOW_DAYS} days</span>
        </div>
        {error && <p className="mb-3 text-xs text-accent-600">{error}</p>}
        {visibleMeetings.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing booked in this window.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleMeetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  {/* Explicit stored User.timezone rather than the ambient
                      browser zone — keeps this in sync with the coach's own
                      view of the same meeting, which already uses the same
                      stored value (see the coach calendar's timeInZone tag). */}
                  {new Date(m.starts_at).toLocaleString(
                    undefined,
                    user?.timezone ? { timeZone: user.timezone } : undefined
                  )}
                  <div className="mt-0.5">
                    <MeetingProviderBadge provider={m.meeting_provider} />
                  </div>
                  <ExternalBookingNote source={m.booking_source} />
                </div>
                {reschedulingId === m.id ? (
                  <div className="flex flex-col gap-2">
                    {slotPicker((d, s) => reschedule(m.id, d, s), reschedulingBusyKey)}
                    <button
                      className="self-start text-xs text-neutral-500 underline"
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
                        onClick={() => setReschedulingId(m.id)}
                        disabled={!rules || rules.slots.length === 0}
                      >
                        <PencilSimple className="h-3.5 w-3.5" />
                        Reschedule
                      </button>
                    )}
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                      onClick={() => cancelMeeting(m.id)}
                      disabled={busyMeetingId === m.id}
                    >
                      <Prohibit className="h-3.5 w-3.5" />
                      {busyMeetingId === m.id ? "Cancelling…" : "Cancel"}
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
            onClick={() => setShowAllMeetings((v) => !v)}
          >
            {showAllMeetings ? "Show only next 20 days" : `View ${hiddenCount} more upcoming`}
          </button>
        )}
      </Card>

      {(links?.calendly_url || links?.cal_com_url) && (
        <Card>
          <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
            Prefer to book on your coach&apos;s own scheduler?
          </h3>
          <div className="flex flex-wrap gap-2">
            {links.calendly_url && (
              <a href={links.calendly_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  Book via Calendly
                  <ArrowSquareOut className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            {links.cal_com_url && (
              <a href={links.cal_com_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  Book via Cal.com
                  <ArrowSquareOut className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-neutral-900">
            Available times
          </h3>
          {rules && (
            <span className="text-xs text-neutral-400">
              Coach&apos;s timezone: {rules.coach_timezone}
            </span>
          )}
        </div>
        {!rules || rules.slots.length === 0 || availableDayIndices.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Your coach hasn&apos;t set up bookable times yet.
          </p>
        ) : (
          slotPicker(book, booking)
        )}
        {error && <p className="mt-3 text-sm text-accent-700">{error}</p>}
      </Card>
    </div>
  );
}
