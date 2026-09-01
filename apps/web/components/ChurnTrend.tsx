"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { api, ChurnTrend as ChurnTrendData } from "@/lib/api";
import { Card } from "@/components/ui";

export default function ChurnTrend({ clientId }: { clientId: string }) {
  const [trend, setTrend] = useState<ChurnTrendData | null>(null);

  useEffect(() => {
    api.getChurnTrend(clientId).then(setTrend).catch(() => {});
  }, [clientId]);

  if (!trend || trend.points.length === 0) return null;

  const latest = trend.points[trend.points.length - 1];
  const color =
    latest.score >= 60
      ? "var(--color-accent-700)"
      : latest.score >= 30
        ? "var(--color-accent-500)"
        : "var(--color-neutral-800)";

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-neutral-900">Churn risk</h3>
          <p className="mt-0.5 text-2xl font-semibold" style={{ color }}>
            {latest.score}
            <span className="text-sm font-normal text-neutral-400">/100</span>
          </p>
          {latest.explanation && (
            <p className="mt-1 max-w-xs text-xs text-neutral-600">{latest.explanation}</p>
          )}
        </div>
        {trend.points.length > 1 && (
          <div className="h-12 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.points}>
                <defs>
                  <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={color}
                  strokeWidth={1.5}
                  fill="url(#churnFill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
