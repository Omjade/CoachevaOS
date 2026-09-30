"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AdminCoachRow } from "@/lib/api";
import { Card, Spinner, ErrorBanner, Input } from "@/components/ui";
import { formatMoney } from "@/lib/currency";

// This app's own accent brand color is coral/red, so it can't double as the
// "good" status color here — that would make "active" (paying, healthy) look
// visually identical to "trial_expired"/"restricted" (broken, bad). Green for
// good, amber for needs-attention, red only for genuinely broken states.
const STATUS_COLORS: Record<string, string> = {
  trialing: "bg-neutral-200 text-neutral-700",
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-amber-100 text-amber-700",
  trial_expired: "bg-red-100 text-red-700",
  restricted: "bg-red-100 text-red-700",
  canceled: "bg-neutral-200 text-neutral-500",
};

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<AdminCoachRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .listAdminCoaches({ search: search || undefined })
        .then((res) => setCoaches(res.coaches))
        .catch(() => setError(true));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Coaches</h1>
        <p className="text-sm text-neutral-500">{coaches ? `${coaches.length} coaches` : "Loading…"}</p>
      </div>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search by name, email, or business…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <ErrorBanner>Couldn&apos;t load coaches.</ErrorBanner>}

      {!coaches && !error && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {coaches && coaches.length === 0 && (
        <Card className="py-12 text-center text-sm text-neutral-500">
          {search ? `No coaches match "${search}".` : "No coaches have signed up yet."}
        </Card>
      )}

      {coaches && coaches.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Coach</th>
                <th className="px-4 py-3 font-medium">Niche</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Clients</th>
                <th className="px-4 py-3 font-medium">MRR</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="max-w-[220px] px-4 py-3">
                    <Link
                      href={`/admin/coaches/${c.id}`}
                      className="block truncate font-medium text-neutral-900 hover:text-accent-600"
                      title={c.business_name || c.name}
                    >
                      {c.business_name || c.name}
                    </Link>
                    <p className="truncate text-xs text-neutral-500">{c.email}</p>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-neutral-600" title={c.niche || undefined}>
                    {c.niche || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.country || "—"}</td>
                  <td className="px-4 py-3 capitalize text-neutral-600">{c.tier}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-neutral-200 text-neutral-700"}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {(c.current_period_end || c.trial_ends_at)
                      ? new Date((c.current_period_end || c.trial_ends_at)!).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.active_client_count}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{formatMoney(c.mrr, c.mrr_currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
