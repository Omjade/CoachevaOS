"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  BrainIcon as Brain,
  WarningIcon as Warning,
  UsersIcon as Users,
  TrendUpIcon as TrendUp,
  TrendDownIcon as TrendDown,
  ArrowUpRightIcon as ArrowUpRight,
  CalendarBlankIcon as CalendarBlank,
  CheckSquareIcon as CheckSquare,
  ArrowsClockwiseIcon as ArrowsClockwise,
  ChartLineUpIcon as ChartLineUp,
} from "@phosphor-icons/react";
import {
  api,
  AnalyticsSummary,
  AnalyticsTimeseries,
  BriefingData,
  ClientGoal,
  ClientSelfProfile,
  MeetingData,
  PrepMyDayData,
  Program,
  TaskData,
  WeeklyDigestData,
} from "@/lib/api";
import {
  CalendarCheckIcon as CalendarCheck,
  NewspaperIcon as Newspaper,
} from "@phosphor-icons/react";
import { Button, Card, Eyebrow } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Sparkline } from "@/components/DashboardCharts";
import NeedsAttentionPanel from "@/components/NeedsAttentionPanel";
import NewCoachChecklist from "@/components/NewCoachChecklist";
import AboutCoachCard from "@/components/AboutCoachCard";
import NewClientChecklist from "@/components/NewClientChecklist";
import ProgressCard from "@/components/ProgressCard";

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
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export default function DashboardPage() {
  const role = useViewerRole();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (role !== "client") return;
    api
      .getMyClientProfile()
      .then((p) => router.replace(`/${params.slug}/client/${p.id}/dashboard`))
      .catch(() => {});
  }, [role, router, params.slug]);

  if (role === null) return null;
  if (role === "client") return null; // redirecting via the effect above
  return <CoachDashboard />;
}

function CoachDashboard() {
  const params = useParams<{ slug: string }>();
  const { user } = useCurrentUser();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [refreshingBriefing, setRefreshingBriefing] = useState(false);
  const [prepMyDay, setPrepMyDay] = useState<PrepMyDayData | null>(null);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigestData | null>(null);
  const [refreshingDigest, setRefreshingDigest] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseries | null>(null);
  const [hasClients, setHasClients] = useState<boolean | null>(null);

  async function refreshBriefing() {
    setRefreshingBriefing(true);
    try {
      const fresh = await api.getBriefing(true);
      setBriefing(fresh);
    } catch {
      // leave the existing briefing showing — a failed refresh isn't worth
      // an error banner over
    } finally {
      setRefreshingBriefing(false);
    }
  }

  async function refreshDigest() {
    setRefreshingDigest(true);
    try {
      const fresh = await api.getWeeklyDigest(true);
      setWeeklyDigest(fresh);
    } catch {
      // leave the existing digest showing — a failed refresh isn't worth an
      // error banner over
    } finally {
      setRefreshingDigest(false);
    }
  }

  useEffect(() => {
    api.getBriefing().then(setBriefing).catch(() => {});
    api.getPrepMyDay().then(setPrepMyDay).catch(() => {});
    api.getWeeklyDigest().then(setWeeklyDigest).catch(() => {});
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

  const leadsWaiting = analytics
    ? analytics.leads_total - analytics.leads_converted - analytics.leads_lost
    : 0;
  const growth = timeseries?.client_growth ?? [];
  const trendDelta =
    growth.length >= 2 ? growth[growth.length - 1].count - growth[growth.length - 2].count : 0;

  const stats = [
    { label: "MRR", value: "$0", Icon: TrendUp },
    { label: "At-risk", value: String(analytics?.at_risk_clients ?? 0), Icon: Warning },
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

      <NewCoachChecklist />

      <Card
        className="animate-fade-up relative overflow-hidden !border-neutral-900 !bg-neutral-900"
        style={{ animationDelay: "40ms" }}
      >
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent-600) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-accent-400">
                <Brain className="h-3.5 w-3.5" weight="fill" />
              </span>
              <h2 className="font-heading text-sm font-semibold text-white">AI daily briefing</h2>
            </div>
            {hasClients !== false && (
              <button
                type="button"
                onClick={refreshBriefing}
                disabled={refreshingBriefing}
                title="Get a fresh briefing"
                aria-label="Refresh briefing"
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <ArrowsClockwise className={`h-3.5 w-3.5 ${refreshingBriefing ? "animate-spin-slow" : ""}`} />
              </button>
            )}
          </div>
          {hasClients === false ? (
            <p className="text-sm text-neutral-400">
              You don&apos;t have any clients yet. Once you do, your AI daily briefing will
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

      <NeedsAttentionPanel />

      {prepMyDay && prepMyDay.items.length > 0 && (
        <Card className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <CalendarCheck className="h-3.5 w-3.5" weight="fill" />
            </span>
            <h2 className="font-heading text-sm font-semibold text-neutral-900">
              Prep for today&apos;s sessions
            </h2>
          </div>
          <ul className="flex flex-col gap-2.5">
            {prepMyDay.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-neutral-700">
                  <span className="font-medium text-neutral-900">{item.client_name}:</span>{" "}
                  {item.reminder}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">{item.meeting_time}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {weeklyDigest && weeklyDigest.bullets.length > 0 && (
        <Card className="animate-fade-up" style={{ animationDelay: "70ms" }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <Newspaper className="h-3.5 w-3.5" weight="fill" />
              </span>
              <h2 className="font-heading text-sm font-semibold text-neutral-900">Weekly digest</h2>
            </div>
            <button
              type="button"
              onClick={refreshDigest}
              disabled={refreshingDigest}
              title="Get a fresh digest"
              aria-label="Refresh weekly digest"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              <ArrowsClockwise className={`h-3.5 w-3.5 ${refreshingDigest ? "animate-spin-slow" : ""}`} />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {weeklyDigest.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-600" />
                {bullet}
              </li>
            ))}
          </ul>
        </Card>
      )}

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

// Exported so the new /{slug}/client/[clientId]/dashboard route can render
// the exact same client-facing content — the URL's clientId is a display
// convenience only, the data here is still entirely session-derived.
export function ClientDashboard() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user } = useCurrentUser();
  const [checking, setChecking] = useState(true);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [goals, setGoals] = useState<ClientGoal[]>([]);
  const [myClientId, setMyClientId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [profile, setProfile] = useState<ClientSelfProfile | null>(null);

  useEffect(() => {
    api
      .getMyIntake()
      .then(() => api.getMyClientProfile())
      .then((p) => {
        setMyClientId(p.id);
        setProfile(p);
        setChecking(false);
      })
      .catch(() =>
        api
          .getMyClientProfile()
          .then((p) => router.replace(`/${params.slug}/client/${p.id}/onboarding`))
          .catch(() => router.replace(`/${params.slug}/dashboard`))
      );
  }, [router, params.slug]);

  useEffect(() => {
    if (checking) return;
    api.listMyTasks().then(setTasks).catch(() => {});
    api.listMyMeetings().then(setMeetings).catch(() => {});
    api.listMyGoals().then(setGoals).catch(() => {});
    api.listMyPrograms().then(setPrograms).catch(() => {});
  }, [checking]);

  if (checking) return null;

  const upcomingTasks = tasks.filter((t) => !t.done).slice(0, 5);
  const now = Date.now();
  const nextMeeting = meetings
    .filter((m) => m.status === "scheduled" && new Date(m.starts_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  const doneGoals = goals.filter((g) => g.done).length;

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        {greetingForHour(new Date().getHours())}
        {user ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>

      <NewClientChecklist />

      <ProgressCard fetchInsight={api.getMyProgressInsight} summaryLabel="Your coach's AI summary" />

      {programs.length > 0 && (
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Your program</h3>
            <Link
              href={`/${params.slug}/client/${myClientId}/packages`}
              className="text-xs font-medium text-accent-600 hover:underline"
            >
              View details
            </Link>
          </div>
          <p className="text-sm text-neutral-700">{programs[0].title}</p>
          <p className="text-xs text-neutral-500">
            {programs[0].duration_weeks ? `${programs[0].duration_weeks}-week` : ""}
            {programs[0].niche ? `${programs[0].duration_weeks ? " · " : ""}${programs[0].niche}` : ""}
          </p>
        </Card>
      )}

      {profile?.subscription_valid_until && (
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Your plan</h3>
            {profile.billing_status !== "active" && profile.billing_status !== "not_set" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  profile.billing_status === "overdue"
                    ? "bg-red-100 text-red-700"
                    : "bg-accent-100 text-accent-700"
                }`}
              >
                {profile.billing_status === "overdue" ? "Overdue" : "Renewal due soon"}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-700">
            {profile.billing_status === "overdue" ? "Was active through" : "Active through"}{" "}
            {new Date(`${profile.subscription_valid_until}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </p>
          {profile.billing_status === "overdue" && (
            <p className="mt-1 text-xs text-neutral-500">
              Reach out to {profile.coach_name} to renew.
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <CalendarBlank className="h-4 w-4 text-accent-600" weight="fill" />
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Next session</h3>
          </div>
          {nextMeeting ? (
            <p className="text-sm text-neutral-700">
              {new Date(nextMeeting.starts_at).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">Nothing booked yet.</p>
          )}
          <Link
            href={`/${params.slug}/client/${myClientId}/calendar`}
            className="mt-2 inline-block text-xs font-medium text-accent-600 hover:underline"
          >
            View calendar
          </Link>
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-accent-600" weight="fill" />
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Tasks</h3>
          </div>
          {upcomingTasks.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="truncate text-sm text-neutral-700">
                  {t.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Nothing outstanding. Nice work.</p>
          )}
          <Link
            href={`/${params.slug}/client/${myClientId}/tasks`}
            className="mt-2 inline-block text-xs font-medium text-accent-600 hover:underline"
          >
            View all tasks
          </Link>
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <ChartLineUp className="h-4 w-4 text-accent-600" weight="fill" />
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Goals</h3>
          </div>
          {goals.length > 0 ? (
            <p className="text-sm text-neutral-700">
              {doneGoals} of {goals.length} goals complete
            </p>
          ) : (
            <p className="text-sm text-neutral-500">No goals set yet.</p>
          )}
          <Link
            href={`/${params.slug}/client/${myClientId}/progress`}
            className="mt-2 inline-block text-xs font-medium text-accent-600 hover:underline"
          >
            View progress
          </Link>
        </Card>
      </div>

      <AboutCoachCard />
    </div>
  );
}
