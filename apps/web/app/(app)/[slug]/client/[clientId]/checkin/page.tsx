"use client";

import { use, useEffect, useState } from "react";
import { CheckIcon as Check } from "@phosphor-icons/react";
import { api, ApiError, CheckinData, CurrentCheckins } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";

const MOODS = ["Low", "Okay", "Good", "Great"];

export default function CheckinPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { clientId } = use(params);
  const role = useViewerRole();

  if (role === null) return null;
  return role === "coach" ? <CoachCheckinHistory clientId={clientId} /> : <ClientCheckinForm />;
}

function CoachCheckinHistory({ clientId }: { clientId: string }) {
  const [checkins, setCheckins] = useState<CheckinData[] | null>(null);

  useEffect(() => {
    api.listClientCheckins(clientId).then(setCheckins).catch(() => setCheckins([]));
  }, [clientId]);

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Check-ins
      </h1>
      {checkins === null ? null : checkins.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">No check-ins submitted yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {checkins.map((c) => (
            <Card key={c.id}>
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 capitalize">
                  {c.type}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(c.submitted_at).toLocaleDateString()}
                </span>
              </div>
              {c.mood && <p className="text-sm text-neutral-900">Mood: {c.mood}</p>}
              {c.one_liner && <p className="text-sm text-neutral-700">{c.one_liner}</p>}
              {c.wins && <p className="text-sm text-neutral-700">Wins: {c.wins}</p>}
              {c.challenges && <p className="text-sm text-neutral-700">Challenges: {c.challenges}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCheckinForm() {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [current, setCurrent] = useState<CurrentCheckins | null>(null);

  function refresh() {
    api.getMyCurrentCheckins().then(setCurrent).catch(() => {});
  }

  useEffect(refresh, []);

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Check-in
      </h1>

      <div className="flex gap-2 border-b border-neutral-200">
        {(["daily", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "border-b-2 border-accent-600 text-neutral-900" : "text-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {current === null ? null : tab === "daily" ? (
        <DailyForm existing={current.daily} onSubmitted={refresh} />
      ) : (
        <WeeklyForm existing={current.weekly} onSubmitted={refresh} />
      )}
    </div>
  );
}

function DailyForm({
  existing,
  onSubmitted,
}: {
  existing: CurrentCheckins["daily"];
  onSubmitted: () => void;
}) {
  const [mood, setMood] = useState("Good");
  const [oneLiner, setOneLiner] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (existing || submitted) {
    return (
      <Card>
        <p className="flex items-center gap-1.5 text-sm text-neutral-600">
          <Check className="h-4 w-4 text-accent-600" weight="bold" />
          Submitted. See you tomorrow.
        </p>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.submitMyCheckin({ type: "daily", mood, one_liner: oneLiner || undefined });
      setSubmitted(true);
      onSubmitted();
    } catch {
      // no-op — form stays as-is on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs tracking-wide text-neutral-600 uppercase">How are you?</p>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  mood === m ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <Input
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="One line about today"
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </Card>
  );
}

function WeeklyForm({
  existing,
  onSubmitted,
}: {
  existing: CurrentCheckins["weekly"];
  onSubmitted: () => void;
}) {
  const [mood, setMood] = useState("Good");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existing || submitted) {
    return (
      <Card>
        <p className="flex items-center gap-1.5 text-sm text-neutral-600">
          <Check className="h-4 w-4 text-accent-600" weight="bold" />
          Submitted. See you next week.
        </p>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.submitMyCheckin({
        type: "weekly",
        mood,
        wins: wins || undefined,
        challenges: challenges || undefined,
      });
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs tracking-wide text-neutral-600 uppercase">
            How was your week?
          </p>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  mood === m ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <Input value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Biggest win" />
        <Input
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          placeholder="Any challenges? (optional)"
        />
        {error && <p className="text-sm text-accent-700">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </Card>
  );
}
