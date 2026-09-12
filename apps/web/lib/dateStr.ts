/** "YYYY-MM-DD" for a Date's own local calendar date. Never use
    `date.toISOString().slice(0, 10)` for this — it converts to UTC first,
    which silently shifts the date backward for anyone in a timezone ahead
    of UTC (India, most of Asia, Australia) during part of every day. This
    was a real, confirmed bug: a coach in Asia/Calcutta selecting Mon/Wed/Fri
    for the Schedule Builder got 0 sessions, because date arithmetic never
    advanced past the start date. */
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date, in the browser's own local timezone. */
export function todayStr(): string {
  return localDateStr(new Date());
}
