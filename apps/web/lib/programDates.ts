// duration_weeks on a Program is relative — this turns it into an actual
// calendar date range, given a real started_at anchor. Shared by
// ProgramGenerator.tsx (coach view) and the client packages page so both
// render the same computed dates from the same logic.
export function programDateRange(
  startedAt: string | null,
  durationWeeks: number | null
): string | null {
  if (!startedAt) return null;
  const start = new Date(`${startedAt}T00:00:00`);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!durationWeeks) return `Started ${startLabel}`;
  const end = new Date(start);
  end.setDate(end.getDate() + durationWeeks * 7);
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Started ${startLabel} · Ends ${endLabel}`;
}
