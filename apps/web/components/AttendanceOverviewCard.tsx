"use client";

import { useEffect, useState } from "react";
import { ChartLineUpIcon as ChartLineUp } from "@phosphor-icons/react";
import { api, AttendanceOverviewRow, AttendanceRange } from "@/lib/api";
import { Card } from "@/components/ui";

const RANGES: { value: AttendanceRange; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
];

// No dedicated /attendance page exists yet (flagged as a follow-up) — show
// everyone here rather than truncate to a "View all" link with nowhere to go.
const VISIBLE_ROWS = 50;

export default function AttendanceOverviewCard() {
  const [range, setRange] = useState<AttendanceRange>("this_month");
  const [rows, setRows] = useState<AttendanceOverviewRow[] | null>(null);

  useEffect(() => {
    api
      .getAttendanceOverview(range)
      .then(setRows)
      .catch(() => setRows([]));
  }, [range]);

  if (rows && rows.length === 0) return null;

  const overallAttended = rows?.reduce((sum, r) => sum + r.attended, 0) ?? 0;
  const overallMarked = rows?.reduce((sum, r) => sum + r.attended + r.no_show, 0) ?? 0;
  const overallRate = overallMarked > 0 ? Math.round((overallAttended / overallMarked) * 100) : null;

  return (
    <Card className="!p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <ChartLineUp className="h-4 w-4" weight="fill" />
          </span>
          <div>
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Attendance</h3>
            {overallRate !== null && (
              <p className="text-xs text-neutral-500">{overallRate}% overall</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                range === r.value ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {(rows ?? []).slice(0, VISIBLE_ROWS).map((row) => (
          <div key={row.client_id} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs font-medium text-neutral-700">
              {row.client_name}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${row.attendance_rate < 0.7 ? "bg-accent-700" : "bg-accent-500"}`}
                style={{ width: `${Math.round(row.attendance_rate * 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs text-neutral-500">
              {Math.round(row.attendance_rate * 100)}%
            </span>
          </div>
        ))}
      </div>

    </Card>
  );
}
