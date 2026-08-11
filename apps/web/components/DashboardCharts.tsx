"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CheckinWeekPoint, FunnelPoint, WeekPoint } from "@/lib/api";
import { Card } from "@/components/ui";

const FUNNEL_RAMP = [
  "var(--color-accent-200)",
  "var(--color-accent-400)",
  "var(--color-accent-500)",
  "var(--color-accent-700)",
  "var(--color-accent-900)",
];

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow up",
  booked: "Booked",
  converted: "Converted",
};

function weekLabel(week: string) {
  const d = new Date(week + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TooltipCard({ label, rows }: { label: string; rows: { name: string; value: string | number }[] }) {
  return (
    <div className="rounded-[12px] border border-neutral-300/60 bg-white px-3.5 py-2.5 text-xs shadow-[0_14px_28px_rgba(28,29,31,0.12)]">
      <p className="mb-1 font-semibold text-neutral-900">{label}</p>
      {rows.map((r) => (
        <p key={r.name} className="text-neutral-600">
          {r.name}: <span className="font-medium text-neutral-900">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ClientGrowthChart({ data }: { data: WeekPoint[] }) {
  const empty = data.length === 0 || data.every((d) => d.count === 0);
  return (
    <Card>
      <h3 className="font-heading text-sm font-semibold text-neutral-900">Client growth</h3>
      <p className="mt-0.5 text-xs text-neutral-500">Active roster over the last 12 weeks</p>
      <div className="mt-4 h-[180px]">
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            No client history yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clientGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-neutral-200)" strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={weekLabel}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={{ stroke: "var(--color-neutral-300)" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      label={weekLabel(String(label))}
                      rows={[{ name: "Clients", value: payload[0].value as number }]}
                    />
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-accent-600)"
                strokeWidth={2}
                fill="url(#clientGrowthFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function EngagementTrendChart({ data }: { data: CheckinWeekPoint[] }) {
  const empty = data.length === 0 || data.every((d) => d.checkins === 0);
  return (
    <Card>
      <h3 className="font-heading text-sm font-semibold text-neutral-900">Engagement trend</h3>
      <p className="mt-0.5 text-xs text-neutral-500">Check-ins per active client, by week</p>
      <div className="mt-4 h-[180px]">
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            No check-ins logged yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-neutral-200)" strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={weekLabel}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={{ stroke: "var(--color-neutral-300)" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                width={34}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      label={weekLabel(String(label))}
                      rows={[
                        {
                          name: "Check-in rate",
                          value: `${Math.round(Number(payload[0].payload.rate) * 100)}%`,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--color-neutral-800)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--color-neutral-800)" }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function LeadFunnelChart({ data }: { data: FunnelPoint[] }) {
  const empty = data.every((d) => d.count === 0);
  return (
    <Card>
      <h3 className="font-heading text-sm font-semibold text-neutral-900">Lead pipeline funnel</h3>
      <p className="mt-0.5 text-xs text-neutral-500">Where leads sit right now</p>
      <div className="mt-4 h-[180px]">
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            No leads yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-neutral-200)" strokeDasharray="3 3" />
              <XAxis
                dataKey="stage"
                tickFormatter={(s) => STAGE_LABELS[s] ?? s}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={{ stroke: "var(--color-neutral-300)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      label={STAGE_LABELS[String(label)] ?? String(label)}
                      rows={[{ name: "Leads", value: payload[0].value as number }]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {data.map((entry, i) => (
                  <Cell key={entry.stage} fill={FUNNEL_RAMP[i % FUNNEL_RAMP.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function Sparkline({ data }: { data: WeekPoint[] }) {
  if (data.length < 2) return null;
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-accent-600)"
            strokeWidth={1.5}
            fill="url(#sparklineFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
