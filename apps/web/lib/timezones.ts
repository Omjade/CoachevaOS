// Real IANA timezone list for the timezone <select> fields (coach + client
// settings, client onboarding) — replacing the previous free-text input.
// Uses the browser's own Intl.supportedValuesOf("timeZone") (supported in
// every evergreen browser) rather than hand-maintaining a ~400-entry IANA
// list by hand, so it's always complete and never goes stale. Falls back to
// a short curated list only in the rare case the API isn't available.
const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function listTimezones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // fall through to the static list
  }
  return FALLBACK_TIMEZONES;
}

// A short, human-readable label alongside the raw IANA id, e.g.
// "America/New_York (UTC-05:00)" — computed once per zone using the
// browser's own offset calculation so it's always accurate, not hardcoded.
export function timezoneLabel(tz: string): string {
  try {
    const offsetMinutes = -new Date().getTimezoneOffset(); // fallback only if formatting fails
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? `${offsetMinutes}`;
    return `${tz.replace(/_/g, " ")} (${offset})`;
  } catch {
    return tz;
  }
}
