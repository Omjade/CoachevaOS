"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon as Check } from "@phosphor-icons/react";
import { api, ApiError, Program, ProgramTemplate } from "@/lib/api";
import { Button, Card, ErrorBanner } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { NICHES } from "@/lib/niches";
import { programDateRange } from "@/lib/programDates";

// Same rationale as the nested dashboard/calendar/settings pages — a coach
// manages a client's programs from the existing client-detail page, not a
// separate per-client "packages" concept.
export default function NestedPackagesPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { slug, clientId } = use(params);
  const role = useViewerRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "coach") router.replace(`/${slug}/clients/${clientId}`);
  }, [role, slug, clientId, router]);

  if (role === null || role === "coach") return null;
  return <ClientPackagesView />;
}

function nicheLabel(niche: string | null): string | null {
  if (!niche) return null;
  return NICHES.find((n) => n.value === niche)?.label ?? niche;
}

function ClientPackagesView() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [available, setAvailable] = useState<ProgramTemplate[] | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.listMyPrograms().then(setPrograms).catch(() => setPrograms([]));
  }

  useEffect(() => {
    refresh();
    api.listMyAvailablePackages().then(setAvailable).catch(() => setAvailable([]));
  }, []);

  async function selectPackage(templateId: string) {
    setSelecting(templateId);
    setError(null);
    try {
      await api.selectMyPackage(templateId);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't select that package. Try again.");
    } finally {
      setSelecting(null);
    }
  }

  if (programs === null) return null;

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Your program
      </h1>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {programs.length > 0 ? (
        <div className="flex flex-col gap-4">
          {programs.map((p) => (
            <Card key={p.id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold text-neutral-900">{p.title}</h3>
                {p.duration_weeks && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                    {p.duration_weeks}-week program
                  </span>
                )}
              </div>
              {programDateRange(p.started_at, p.duration_weeks) && (
                <p className="mb-1 text-xs text-neutral-500">
                  {programDateRange(p.started_at, p.duration_weeks)}
                </p>
              )}
              {p.description && <p className="mb-3 text-sm text-neutral-600">{p.description}</p>}
              {p.checkin_cadence && (
                <p className="mb-3 text-xs text-neutral-500">Check-ins: {p.checkin_cadence}</p>
              )}
              <ol className="flex flex-col gap-1.5">
                {p.items.map((item) => (
                  <li key={item.id} className="text-sm text-neutral-700">
                    {item.week_number && (
                      <span className="mr-1.5 text-xs text-neutral-400">Wk {item.week_number}</span>
                    )}
                    <span className="font-medium text-neutral-900">{item.title}</span>
                    {item.description && <>: {item.description}</>}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      ) : available && available.length > 0 ? (
        <>
          <Card>
            <p className="text-sm text-neutral-600">
              No program assigned yet. Pick a package below to get started.
            </p>
          </Card>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {available.map((t) => (
              <Card key={t.id} className="flex flex-col justify-between">
                <div>
                  <h3 className="mb-1 font-medium text-neutral-900">{t.title}</h3>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {t.niche && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                        {nicheLabel(t.niche)}
                      </span>
                    )}
                    {t.duration_weeks && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                        {t.duration_weeks}-week
                      </span>
                    )}
                    {t.price_amount != null && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                        {t.price_currency ?? ""} {t.price_amount}
                        {t.billing_cadence && t.billing_cadence !== "one_time" ? ` / ${t.billing_cadence}` : ""}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="mb-3 text-sm text-neutral-600">{t.description}</p>}
                </div>
                <Button
                  onClick={() => selectPackage(t.id)}
                  loading={selecting === t.id}
                  disabled={selecting !== null}
                >
                  <Check className="h-4 w-4" weight="bold" />
                  Select this package
                </Button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-neutral-600">
            No program assigned yet. Your coach will set one up for you.
          </p>
        </Card>
      )}
    </div>
  );
}
