"use client";

import { useEffect, useState } from "react";
import { SparkleIcon as Sparkle, ArrowsClockwiseIcon as ArrowsClockwise } from "@phosphor-icons/react";
import { ProgressInsight } from "@/lib/api";
import { Card } from "@/components/ui";

export default function ProgressCard({
  fetchInsight,
  summaryLabel = "AI progress insight",
}: {
  fetchInsight: (force?: boolean) => Promise<ProgressInsight>;
  summaryLabel?: string;
}) {
  const [data, setData] = useState<ProgressInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsight().then(setData).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const fresh = await fetchInsight(true);
      setData(fresh);
    } catch {
      // Keep showing the previous insight — a failed refresh shouldn't blank the card.
    } finally {
      setRefreshing(false);
    }
  }

  if (!data) return null;

  const pct = data.tasks_total > 0 ? Math.round((data.tasks_done / data.tasks_total) * 100) : 0;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold">Progress</h3>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          title="Get a fresh summary"
          aria-label="Refresh progress summary"
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
        >
          <ArrowsClockwise className={`h-3.5 w-3.5 ${refreshing ? "animate-spin-slow" : ""}`} />
        </button>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-accent-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mb-4 text-xs text-neutral-600">
        {data.tasks_done} of {data.tasks_total} tasks complete ({pct}%)
      </p>
      <div className="flex items-start gap-2.5 rounded-[14px] bg-accent-50 px-3.5 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Sparkle className="h-3 w-3" weight="fill" />
        </span>
        <div>
          <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-accent-700 uppercase">
            {summaryLabel}
          </p>
          <p className="text-sm text-neutral-800">{data.insight}</p>
        </div>
      </div>
    </Card>
  );
}
