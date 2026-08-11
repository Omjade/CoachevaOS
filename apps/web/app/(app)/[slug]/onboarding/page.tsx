"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";

export default function ClientOnboardingPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [checking, setChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [goals, setGoals] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getMyIntake()
      .then(() => router.replace(`/${params.slug}/dashboard`))
      .catch(() => setChecking(false));
  }, [router, params.slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.submitMyIntake({
        goals: goals || undefined,
        experience: experience || undefined,
        availability: availability || undefined,
        notes: notes || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (checking) return null;

  if (submitted) {
    return (
      <Card>
        <h1 className="font-heading mb-1 text-xl font-semibold text-neutral-900">Thanks — you&apos;re all set!</h1>
        <p className="mb-4 text-sm text-neutral-600">
          Your coach can now see your goals and get started.
        </p>
        <Button onClick={() => router.push(`/${params.slug}/dashboard`)}>Go to dashboard</Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="font-heading mb-1 text-xl font-semibold text-neutral-900">Let&apos;s get you set up</h1>
      <p className="mb-6 text-sm text-neutral-600">
        A few quick questions so your coach can hit the ground running.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="goals">Primary goal</Label>
          <Input id="goals" value={goals} onChange={(e) => setGoals(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="experience">Experience level</Label>
          <select
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
          >
            <option value="">Select…</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <Label htmlFor="availability">Availability</Label>
          <Input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. weekday evenings"
          />
        </div>
        <div>
          <Label htmlFor="notes">Anything else your coach should know?</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-accent-700">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </Card>
  );
}
