"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, AdminCoachDetail } from "@/lib/api";
import { Card, Spinner, ErrorBanner } from "@/components/ui";
import { formatMoney } from "@/lib/currency";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export default function AdminCoachDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminCoachDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api
      .getAdminCoachDetail(params.id)
      .then(setDetail)
      .catch(() => setError(true));
  }, [params.id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorBanner>Couldn&apos;t load this coach.</ErrorBanner>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const { coach } = detail;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link href="/admin/coaches" className="mb-4 inline-block text-sm font-medium text-accent-600 hover:text-accent-700">
        &larr; Coaches
      </Link>

      <h1 className="font-heading mb-1 text-2xl font-semibold text-neutral-900">
        {coach.business_name || coach.name}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">{coach.email}</p>

      <Card>
        <Row label="Name" value={coach.name} />
        <Row label="Niche" value={coach.niche || "—"} />
        <Row label="Country" value={coach.country || "—"} />
        <Row label="Timezone" value={detail.timezone} />
        <Row label="Portal slug" value={detail.portal_slug || "—"} />
        <Row label="Signed up" value={new Date(coach.signed_up_at).toLocaleDateString()} />
      </Card>

      <Card className="mt-4">
        <Row label="Tier" value={<span className="capitalize">{coach.tier}</span>} />
        <Row label="Status" value={<span className="capitalize">{coach.status.replace("_", " ")}</span>} />
        <Row
          label="Trial ends"
          value={coach.trial_ends_at ? new Date(coach.trial_ends_at).toLocaleDateString() : "—"}
        />
        <Row
          label="Current period ends"
          value={coach.current_period_end ? new Date(coach.current_period_end).toLocaleDateString() : "—"}
        />
        <Row label="Payment provider" value={detail.provider || "—"} />
        <Row label="MRR" value={formatMoney(coach.mrr, coach.mrr_currency)} />
      </Card>

      <Card className="mt-4">
        <Row label="Active clients" value={coach.active_client_count} />
      </Card>
    </div>
  );
}
