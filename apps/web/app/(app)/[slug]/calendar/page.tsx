"use client";

import { Suspense, useEffect, useState } from "react";
import {
  PlusIcon as Plus,
  XIcon as X,
  CheckIcon as Check,
  VideoCameraIcon as VideoCamera,
  CalendarBlankIcon as CalendarBlank,
  LinkIcon as LinkIconGlyph,
  ArrowSquareOutIcon as ArrowSquareOut,
} from "@phosphor-icons/react";
import {
  api,
  API_URL,
  ApiError,
  AvailabilityRules,
  CalendarProviderKey,
  CoachProfile,
  IntegrationStatus,
  MeetingData,
  SchedulingLinks,
} from "@/lib/api";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button, Card, Eyebrow } from "@/components/ui";
import { getNicheConfig } from "@/lib/niche";
import { useViewerRole } from "@/lib/useViewerRole";
import { useCurrentUser } from "@/lib/useCurrentUser";

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

const PROVIDERS: { key: CalendarProviderKey; label: string; Icon: typeof VideoCamera }[] = [
  { key: "google", label: "Google Meet", Icon: VideoCamera },
  { key: "zoom", label: "Zoom", Icon: VideoCamera },
  { key: "calendly", label: "Calendly", Icon: CalendarBlank },
  { key: "cal_com", label: "Cal.com", Icon: CalendarBlank },
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

function nextDatesForDay(dayIndex: number, count = 3): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; dates.length < count && i < 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === dayIndex) dates.push(d);
  }
  return dates;
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

function CoachCalendar() {
  const searchParams = useSearchParams();
  const [rules, setRules] = useState<AvailabilityRules>(DEFAULT_RULES);
  const [newSlot, setNewSlot] = useState("");
  const [saved, setSaved] = useState(false);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [disconnecting, setDisconnecting] = useState<CalendarProviderKey | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState<string | null>(null);

  function refreshIntegrations() {
    api.listIntegrations().then(setIntegrations).catch(() => setIntegrations([]));
  }

  useEffect(() => {
    api.myProfile().then(setProfile).catch(() => {});
    api.getMyAvailability().then(setRules).catch(() => {});
    api.listMeetings().then(setMeetings).catch(() => {});
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
          join link automatically.
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
                className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-neutral-900">{label}</p>
                    {connected && status?.account_label && (
                      <p className="truncate text-xs text-neutral-500">{status.account_label}</p>
                    )}
                  </div>
                </div>
                {connected ? (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => disconnect(key)}
                    disabled={disconnecting === key}
                  >
                    {disconnecting === key ? "Disconnecting…" : "Disconnect"}
                  </Button>
                ) : (
                  <a href={`${API_URL}/integrations/${key}/connect`}>
                    <Button variant="secondary" className="!px-3 !py-1.5 text-xs">
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
        <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
          Upcoming meetings
        </h3>
        {meetings.length === 0 ? (
          <p className="text-sm text-neutral-500">No meetings booked yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm"
              >
                <span className="text-neutral-900">
                  {m.client_name}{" "}
                  <span className="text-neutral-500">
                    · {getNicheConfig(profile?.niche).sessionLabel}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">
                    {new Date(m.starts_at).toLocaleString()}
                    {m.client_timezone && (
                      <span className="text-neutral-400">
                        {" "}
                        ({timeInZone(m.starts_at, m.client_timezone)} for {m.client_name})
                      </span>
                    )}
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
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function ClientCalendar() {
  const { user } = useCurrentUser();
  const [rules, setRules] = useState<AvailabilityRules | null>(null);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SchedulingLinks | null>(null);

  function refresh() {
    api.listMyMeetings().then(setMeetings).catch(() => {});
  }

  useEffect(() => {
    api.getCoachAvailability().then(setRules).catch(() => {});
    api.getSchedulingLinks().then(setLinks).catch(() => {});
    refresh();
  }, []);

  async function book(date: Date, slot: string) {
    const [h, m] = slot.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);
    const key = `${date.toDateString()}-${slot}`;
    setBooking(key);
    setError(null);
    try {
      await api.bookMeeting(startsAt.toISOString());
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't book that slot");
    } finally {
      setBooking(null);
    }
  }

  const availableDayIndices = rules
    ? DAY_KEYS.map((k, i) => (rules.days[k] ? (i + 1) % 7 : null)).filter(
        (v): v is number => v !== null
      )
    : [];

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Book a session
      </h1>

      <Card>
        <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
          Upcoming sessions
        </h3>
        {meetings.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing booked yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900"
              >
                {/* Explicit stored User.timezone rather than the ambient
                    browser zone — keeps this in sync with the coach's own
                    view of the same meeting, which already uses the same
                    stored value (see the coach calendar's timeInZone tag). */}
                {new Date(m.starts_at).toLocaleString(
                  undefined,
                  user?.timezone ? { timeZone: user.timezone } : undefined
                )}
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
        <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
          Available times
        </h3>
        {!rules || rules.slots.length === 0 || availableDayIndices.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Your coach hasn&apos;t set up bookable times yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {availableDayIndices.flatMap((dayIndex) =>
              nextDatesForDay(dayIndex).map((date) => (
                <div key={date.toDateString()}>
                  <p className="mb-2 text-sm font-medium">
                    {date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rules.slots.map((slot) => {
                      const key = `${date.toDateString()}-${slot}`;
                      return (
                        <Button
                          key={slot}
                          type="button"
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={booking === key}
                          onClick={() => book(date, slot)}
                        >
                          {booking === key ? "Booking…" : slot}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-accent-700">{error}</p>}
      </Card>
    </div>
  );
}
