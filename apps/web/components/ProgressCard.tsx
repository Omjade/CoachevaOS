"use client";

import { useEffect, useState } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { ProgressInsight } from "@/lib/api";
import { Card } from "@/components/ui";

export default function ProgressCard({
  fetchInsight,
  summaryLabel = "AI progress insight",
}: {
  fetchInsight: () => Promise<ProgressInsight>;
  summaryLabel?: string;
}) {
  const [data, setData] = useState<ProgressInsight | null>(null);

  useEffect(() => {
    fetchInsight().then(setData).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const pct = data.tasks_total > 0 ? Math.round((data.tasks_done / data.tasks_total) * 100) : 0;

  return (
    <Card>
      <h3 className="font-heading mb-3 text-lg font-semibold">Progress</h3>
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
