"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, AdminOverview, AdminTimeseries, AdminBreakdowns } from "@/lib/api";
import { Card, Spinner, ErrorBanner } from "@/components/ui";
import { formatMoney } from "@/lib/currency";

const ACCENT = "#ff6650";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="font-heading mt-1.5 text-3xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [timeseries, setTimeseries] = useState<AdminTimeseries | null>(null);
  const [breakdowns, setBreakdowns] = useState<AdminBreakdowns | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.getAdminOverview(), api.getAdminTimeseries(30), api.getAdminBreakdowns()])
      .then(([o, t, b]) => {
        setOverview(o);
        setTimeseries(t);
        setBreakdowns(b);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <ErrorBanner>Couldn&apos;t load admin data.</ErrorBanner>
      </div>
    );
  }

  if (!overview || !timeseries || !breakdowns) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500">Platform-wide view — visible only to you.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Visits today" value={String(overview.visits_today)} sub={`${overview.unique_visits_today} unique`} />
        <StatTile label="Signups today" value={String(overview.signups_today)} />
        <StatTile label="Total coaches" value={String(overview.total_coaches)} />
        <StatTile label="Trialing" value={String(overview.trialing_count)} />
        <StatTile label="Active paid" value={String(overview.active_paid_count)} />
        <StatTile label="Past due" value={String(overview.past_due_count)} />
        <StatTile label="Canceled" value={String(overview.canceled_count)} sub={`${overview.churned_this_month} this month`} />
        <StatTile label="Platform MRR (USD)" value={formatMoney(overview.mrr, overview.mrr_currency)} />
        {overview.mrr_inr > 0 && (
          <StatTile label="Platform MRR (INR)" value={formatMoney(overview.mrr_inr, "inr")} sub="Shown separately — not converted" />
        )}
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Daily visits &amp; signups (30 days)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={timeseries.points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="visits" name="Visits" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} />
            <Area type="monotone" dataKey="unique_visits" name="Unique visits" stroke="#1a1412" fill="#1a1412" fillOpacity={0.08} />
            <Line type="monotone" dataKey="signups" name="Signups" stroke="#5a4a44" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Coaches by country</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdowns.by_country.slice(0, 8)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Coaches by niche</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdowns.by_niche.slice(0, 8)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a1412" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Coaches by timezone</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdowns.by_timezone.slice(0, 8)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#ffb199" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Coaches by plan tier</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdowns.by_tier}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
