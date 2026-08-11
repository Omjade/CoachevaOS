"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  SparkleIcon as Sparkle,
  UsersIcon as Users,
  TrendUpIcon as TrendUp,
  TrendDownIcon as TrendDown,
  ArrowUpRightIcon as ArrowUpRight,
} from "@phosphor-icons/react";
import { api, AnalyticsSummary, AnalyticsTimeseries, BriefingData, User } from "@/lib/api";
import { Button, Card, Eyebrow } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { Sparkline } from "@/components/DashboardCharts";

const ClientGrowthChart = dynamic(() => import("@/components/DashboardCharts").then((m) => m.ClientGrowthChart), {
  ssr: false,
});
const EngagementTrendChart = dynamic(
  () => import("@/components/DashboardCharts").then((m) => m.EngagementTrendChart),
  { ssr: false }
);
const LeadFunnelChart = dynamic(() => import("@/components/DashboardCharts").then((m) => m.LeadFunnelChart), {
  ssr: false,
});

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const role = useViewerRole();
  if (role === null) return null;
  return role === "client" ? <ClientDashboard /> : <CoachDashboard />;
}

function CoachDashboard() {
  const params = useParams<{ slug: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseries | null>(null);
  const [hasClients, setHasClients] = useState<boolean | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api.getBriefing().then(setBriefing).catch(() => {});
    api.getAnalyticsTimeseries().then(setTimeseries).catch(() => {});
    api
      .getAnalyticsSummary()
      .then((a) => {
        setAnalytics(a);
        setHasClients(
          a.active_clients + a.at_risk_clients + a.paused_clients + a.churned_clients > 0
        );
      })
      .catch(() => setHasClients(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const leadsWaiting = analytics ? analytics.leads_total - analytics.leads_converted : 0;
  const growth = timeseries?.client_growth ?? [];
  const trendDelta =
    growth.length >= 2 ? growth[growth.length - 1].count - growth[growth.length - 2].count : 0;

  const stats = [
    { label: "MRR", value: "$0", Icon: TrendUp },
    { label: "At-risk", value: String(analytics?.at_risk_clients ?? 0), Icon: Sparkle },
    { label: "Leads waiting", value: String(leadsWaiting), Icon: ArrowUpRight },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <Eyebrow className="mb-3">{today}</Eyebrow>
        <h1 className="font-heading text-[28px] font-semibold tracking-tight text-neutral-900 md:text-[32px]">
          {greetingForHour(new Date().getHours())}
          {user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">Here&apos;s what&apos;s happening today.</p>
      </div>

      <Card
        className="animate-fade-up relative overflow-hidden !border-neutral-900 !bg-neutral-900"
        style={{ animationDelay: "40ms" }}
      >
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent-600) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-accent-400">
              <Sparkle className="h-3.5 w-3.5" weight="fill" />
            </span>
            <h2 className="font-heading text-sm font-semibold text-white">AI daily briefing</h2>
          </div>
          {hasClients === false ? (
            <p className="text-sm text-neutral-400">
              You don&apos;t have any clients yet — once you do, your AI daily briefing will
              appear here every morning with exactly what needs your attention.
            </p>
          ) : briefing ? (
            <ul className="flex flex-col gap-2">
              {briefing.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">Generating your morning briefing…</p>
          )}
        </div>
      </Card>

      <div
        className="animate-fade-up grid grid-cols-2 gap-3 sm:grid-cols-4"
        style={{ animationDelay: "80ms" }}
      >
        <Card className="!p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <Users className="h-4 w-4" weight="fill" />
              </span>
              <p className="font-heading text-2xl font-semibold text-neutral-900">
                {analytics?.active_clients ?? 0}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                Active clients
                {trendDelta !== 0 && (
                  <span
                    className={`flex items-center gap-0.5 font-medium ${trendDelta > 0 ? "text-neutral-800" : "text-accent-700"}`}
                  >
                    {trendDelta > 0 ? (
                      <TrendUp className="h-3 w-3" weight="bold" />
                    ) : (
                      <TrendDown className="h-3 w-3" weight="bold" />
                    )}
                    {Math.abs(trendDelta)}
                  </span>
                )}
              </p>
            </div>
            <Sparkline data={growth} />
          </div>
        </Card>
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-5">
            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <stat.Icon className="h-4 w-4" weight="fill" />
            </span>
            <p className="font-heading text-2xl font-semibold text-neutral-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {hasClients && (
        <div
          className="animate-fade-up grid grid-cols-1 gap-4 lg:grid-cols-3"
          style={{ animationDelay: "100ms" }}
        >
          <ClientGrowthChart data={growth} />
          <EngagementTrendChart data={timeseries?.checkin_rate ?? []} />
          <LeadFunnelChart data={timeseries?.lead_funnel ?? []} />
        </div>
      )}

      {analytics && hasClients && (
        <div
          className="animate-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2"
          style={{ animationDelay: "120ms" }}
        >
          <Card>
            <p className="font-heading text-2xl font-semibold text-neutral-900">
              {Math.round(analytics.lead_conversion_rate * 100)}%
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Lead conversion ({analytics.leads_converted}/{analytics.leads_total})
            </p>
          </Card>
          <Card>
            <p className="font-heading text-2xl font-semibold text-neutral-900">
              {Math.round(analytics.task_completion_rate * 100)}%
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Task completion ({analytics.tasks_done}/{analytics.tasks_total})
            </p>
          </Card>
        </div>
      )}

      {hasClients === false && (
        <Card
          className="animate-fade-up flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
          style={{ animationDelay: "120ms" }}
        >
          <div>
            <h2 className="font-heading text-lg font-semibold text-neutral-900">
              Add your first client
            </h2>
            <p className="text-sm text-neutral-600">
              Get their record started so your AI briefing has something to work with.
            </p>
          </div>
          <Link href={`/${params.slug}/clients`}>
            <Button>Add client</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function ClientDashboard() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api
      .getMyIntake()
      .then(() => setChecking(false))
      .catch(() => router.replace(`/${params.slug}/onboarding`));
  }, [router, params.slug]);

  if (checking) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        {greetingForHour(new Date().getHours())}
        {user ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>
      <Card>
        <p className="text-sm text-neutral-600">
          Your tasks, next session and progress will show up here.
        </p>
      </Card>
    </div>
  );
}
