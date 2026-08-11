"use client";

import { useEffect, useState } from "react";
import { api, ProgressInsight } from "@/lib/api";
import { Card } from "@/components/ui";

export default function ProgressCard({
  fetchInsight,
}: {
  fetchInsight: () => Promise<ProgressInsight>;
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
      <p className="text-sm text-neutral-700">{data.insight}</p>
    </Card>
  );
}
