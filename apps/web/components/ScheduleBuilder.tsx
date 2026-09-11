"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VideoCameraIcon as VideoCamera,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  CheckCircleIcon as CheckCircle,
} from "@phosphor-icons/react";
import {
  api,
  ApiError,
  CalendarProviderKey,
  IntegrationStatus,
  MeetingData,
  SessionType,
} from "@/lib/api";
import { Button, ErrorBanner, Input, Label } from "@/components/ui";

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

const PROVIDER_LABEL: Record<CalendarProviderKey, string> = {
  google: "Google Meet",
  zoom: "Zoom",
  calendly: "Calendly",
  cal_com: "Cal.com",
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayKey(dateStr: string): (typeof WEEKDAYS)[number]["key"] {
  const idx = new Date(`${dateStr}T00:00:00`).getDay(); // 0=Sun
  return WEEKDAYS[(idx + 6) % 7].key;
}

/** Client-side preview of what the bulk-create call will generate — the
    server re-derives the same dates from the same inputs, so this never
    needs to round-trip just to show a count. */
function computePreviewDates(
  mode: "range" | "dates",
  startDate: string,
  endDate: string,
  weekdays: Set<string>,
  time: string,
  specificDates: { date: string; time: string }[]
): { date: string; time: string }[] {
  if (mode === "dates") return specificDates.filter((d) => d.date && d.time);
  if (!startDate || !endDate || !time || weekdays.size === 0) return [];
  const out: { date: string; time: string }[] = [];
  let current = startDate;
  let guard = 0;
  while (current <= endDate && guard < 366) {
    if (weekdays.has(weekdayKey(current))) out.push({ date: current, time });
    current = addDays(current, 1);
    guard += 1;
  }
  return out;
}

export default function ScheduleBuilder({
  clientId,
  onClose,
  onCreated,
}: {
  clientId: string;
  onClose: () => void;
  onCreated: (sessions: MeetingData[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"range" | "dates">("range");

  // Range mode
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weekdays, setWeekdays] = useState<Set<string>>(new Set(["mon", "wed", "fri"]));
  const [time, setTime] = useState("09:00");

  // Specific-dates mode
  const [specificDates, setSpecificDates] = useState<{ date: string; time: string }[]>([]);

  // Session details
  const [sessionType, setSessionType] = useState<SessionType>("video");
  const [videoProvider, setVideoProvider] = useState<CalendarProviderKey | "">("");
  const [manualMeetingUrl, setManualMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(60);

  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingData[] | null>(null);

  useEffect(() => {
    api.listIntegrations().then(setIntegrations).catch(() => setIntegrations([]));
    api
      .myProfile()
      .then((p) => {
        if (p.default_video_provider) setVideoProvider(p.default_video_provider);
      })
      .catch(() => {});
  }, []);

  const connectedVideoProviders = (integrations ?? []).filter(
    (i) => i.connected && (i.provider === "google" || i.provider === "zoom")
  );
  const connectedLinkProviders = (integrations ?? []).filter(
    (i) => i.connected && (i.provider === "calendly" || i.provider === "cal_com")
  );

  const preview = useMemo(
    () => computePreviewDates(mode, startDate, endDate, weekdays, time, specificDates),
    [mode, startDate, endDate, weekdays, time, specificDates]
  );

  function toggleWeekday(key: string) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleWeekends(include: boolean) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (include) {
        next.add("sat");
        next.add("sun");
      } else {
        next.delete("sat");
        next.delete("sun");
      }
      return next;
    });
  }

  function addSpecificDate() {
    setSpecificDates((prev) => [...prev, { date: "", time: "09:00" }]);
  }

  const canAdvanceStep1 =
    mode === "range"
      ? !!startDate && !!endDate && weekdays.size > 0 && !!time
      : specificDates.length > 0 && specificDates.every((d) => d.date && d.time);

  const canAdvanceStep2 =
    sessionType === "video"
      ? !!videoProvider &&
        (videoProvider === "google" || videoProvider === "zoom" || !!manualMeetingUrl)
      : sessionType === "in_person"
        ? !!location
        : true;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.bulkCreateSessions({
        client_id: clientId,
        session_type: sessionType,
        video_provider: sessionType === "video" ? (videoProvider as CalendarProviderKey) : undefined,
        manual_meeting_url:
          sessionType === "video" && videoProvider !== "google" && videoProvider !== "zoom"
            ? manualMeetingUrl
            : undefined,
        location: sessionType === "in_person" ? location : undefined,
        duration_minutes: duration,
        ...(mode === "range"
          ? { start_date: startDate, end_date: endDate, weekdays: Array.from(weekdays), time }
          : { dates: specificDates }),
      });
      setResult(res.created);
      onCreated(res.created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create sessions. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600"
        >
          <CheckCircle className="h-7 w-7" weight="fill" />
        </motion.span>
        <p className="font-heading text-lg font-semibold text-neutral-900">
          {result.length} session{result.length === 1 ? "" : "s"} created
        </p>
        {result.length < preview.length && (
          <p className="text-xs text-neutral-500">
            {preview.length - result.length} slot{preview.length - result.length === 1 ? "" : "s"} were
            skipped — they conflicted with something already on your calendar.
          </p>
        )}
        <Button onClick={onClose}>Done</Button>
      </div>
    );
  }

  const steps = ["Mode", "When", "Details", "Preview"];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                i <= step ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs ${i <= step ? "text-neutral-900" : "text-neutral-400"}`}>{label}</span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-neutral-200" />}
          </div>
        ))}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          {step === 0 && (
            <div>
              <Label>How do you want to schedule?</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode("range")}
                  className={`rounded-[14px] border px-4 py-4 text-left text-sm font-medium transition-all ${
                    mode === "range"
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  Date range
                  <p className={`mt-1 text-xs font-normal ${mode === "range" ? "text-neutral-300" : "text-neutral-400"}`}>
                    Recurring, e.g. every Mon/Wed/Fri
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("dates")}
                  className={`rounded-[14px] border px-4 py-4 text-left text-sm font-medium transition-all ${
                    mode === "dates"
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  Specific dates
                  <p className={`mt-1 text-xs font-normal ${mode === "dates" ? "text-neutral-300" : "text-neutral-400"}`}>
                    Pick individual dates and times
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 1 && mode === "range" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sb_start">Start date</Label>
                  <Input id="sb_start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sb_end">End date</Label>
                  <Input id="sb_end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((wd) => (
                    <button
                      key={wd.key}
                      type="button"
                      onClick={() => toggleWeekday(wd.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        weekdays.has(wd.key)
                          ? "bg-accent-600 text-white"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      {wd.label}
                    </button>
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={weekdays.has("sat") && weekdays.has("sun")}
                    onChange={(e) => toggleWeekends(e.target.checked)}
                    className="accent-accent-600"
                  />
                  Include weekends
                </label>
              </div>
              <div>
                <Label htmlFor="sb_time">Session time</Label>
                <Input id="sb_time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && mode === "dates" && (
            <div className="flex flex-col gap-2.5">
              {specificDates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={d.date}
                    onChange={(e) =>
                      setSpecificDates((prev) => prev.map((p, j) => (j === i ? { ...p, date: e.target.value } : p)))
                    }
                  />
                  <Input
                    type="time"
                    value={d.time}
                    onChange={(e) =>
                      setSpecificDates((prev) => prev.map((p, j) => (j === i ? { ...p, time: e.target.value } : p)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setSpecificDates((prev) => prev.filter((_, j) => j !== i))}
                    className="text-xs text-neutral-400 hover:text-accent-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button variant="secondary" className="!py-2 text-xs" onClick={addSpecificDate}>
                Add a date
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <div>
                <Label>Session type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "video" as const, label: "Video call", Icon: VideoCamera },
                      { value: "in_person" as const, label: "In-person", Icon: MapPin },
                      { value: "phone" as const, label: "Phone", Icon: Phone },
                    ]
                  ).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSessionType(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-[12px] border px-2 py-3 text-xs font-medium transition-all ${
                        sessionType === value
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" weight={sessionType === value ? "fill" : "regular"} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {sessionType === "video" && (
                <div>
                  <Label htmlFor="sb_provider">Video provider</Label>
                  <select
                    id="sb_provider"
                    value={videoProvider}
                    onChange={(e) => setVideoProvider(e.target.value as CalendarProviderKey)}
                    className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500"
                  >
                    <option value="">Choose a provider</option>
                    {connectedVideoProviders.map((i) => (
                      <option key={i.provider} value={i.provider}>
                        {PROVIDER_LABEL[i.provider]}
                      </option>
                    ))}
                    {connectedLinkProviders.map((i) => (
                      <option key={i.provider} value={i.provider}>
                        {PROVIDER_LABEL[i.provider]} (paste your own link)
                      </option>
                    ))}
                  </select>
                  {connectedVideoProviders.length === 0 && connectedLinkProviders.length === 0 && (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Nothing connected yet —{" "}
                      <a href="../calendar" className="font-medium text-accent-600 underline">
                        connect a provider
                      </a>{" "}
                      first.
                    </p>
                  )}
                  {videoProvider &&
                    videoProvider !== "google" &&
                    videoProvider !== "zoom" && (
                      <Input
                        className="mt-2"
                        placeholder="Paste your scheduling link"
                        value={manualMeetingUrl}
                        onChange={(e) => setManualMeetingUrl(e.target.value)}
                      />
                    )}
                </div>
              )}

              {sessionType === "in_person" && (
                <div>
                  <Label htmlFor="sb_location">Location</Label>
                  <Input
                    id="sb_location"
                    placeholder="e.g. Studio address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="sb_duration">Duration (minutes)</Label>
                <Input
                  id="sb_duration"
                  type="number"
                  min={5}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 60)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-neutral-700">
                This will create <span className="font-semibold text-neutral-900">{preview.length}</span> session
                {preview.length === 1 ? "" : "s"}
                {mode === "range" && startDate && endDate ? ` between ${startDate} and ${endDate}` : ""}.
              </p>
              <div className="max-h-56 overflow-y-auto rounded-[12px] border border-neutral-200">
                {preview.map((d, i) => (
                  <div
                    key={`${d.date}-${d.time}-${i}`}
                    className="flex items-center justify-between border-b border-neutral-100 px-3.5 py-2 text-xs last:border-0"
                  >
                    <span className="text-neutral-700">{d.date}</span>
                    <span className="text-neutral-500">{d.time}</span>
                  </div>
                ))}
                {preview.length === 0 && (
                  <p className="px-3.5 py-3 text-xs text-neutral-400">No sessions to preview yet.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2)}
          >
            Next
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} disabled={preview.length === 0}>
            Confirm & create
          </Button>
        )}
      </div>
    </div>
  );
}
