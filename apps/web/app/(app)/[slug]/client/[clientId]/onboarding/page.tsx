"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, IntakeResponseData } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { COUNTRIES } from "@/lib/countries";
import { listTimezones, timezoneLabel } from "@/lib/timezones";
import CustomFieldsCard from "@/components/CustomFieldsCard";
import Confetti from "@/components/Confetti";

const TIMEZONES = listTimezones();

export default function ClientOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { slug, clientId } = use(params);
  const role = useViewerRole();

  if (role === null) return null;
  return role === "coach" ? (
    <CoachIntakeView clientId={clientId} />
  ) : (
    <ClientOnboardingForm slug={slug} />
  );
}

function CoachIntakeView({ clientId }: { clientId: string }) {
  const [intake, setIntake] = useState<IntakeResponseData | null | "loading">("loading");

  useEffect(() => {
    api
      .getClientIntake(clientId)
      .then(setIntake)
      .catch((err) => setIntake(err instanceof ApiError && err.status === 404 ? null : null));
  }, [clientId]);

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Onboarding
      </h1>
      <Card>
        <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
          Intake responses
        </h3>
        {intake === "loading" ? null : intake === null ? (
          <p className="text-sm text-neutral-500">
            Not submitted yet. Sent with the client&apos;s invite link.
          </p>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-neutral-900">
            <p>
              <span className="text-neutral-500">Goal: </span>
              {intake.goals ?? "—"}
            </p>
            <p>
              <span className="text-neutral-500">Experience: </span>
              {intake.experience ?? "—"}
            </p>
            <p>
              <span className="text-neutral-500">Availability: </span>
              {intake.availability ?? "—"}
            </p>
            <p>
              <span className="text-neutral-500">Notes: </span>
              {intake.notes ?? "—"}
            </p>
          </div>
        )}
      </Card>
      <CustomFieldsCard fetchFields={() => api.getClientCustomFields(clientId)} editable={false} />
    </div>
  );
}

function ClientOnboardingForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [goals, setGoals] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getMyIntake()
      .then(() => api.getMyClientProfile())
      .then((p) => router.replace(`/${slug}/client/${p.id}/dashboard`))
      .catch(() => setChecking(false));
    // Pre-fill from the browser's own detected timezone — set client-side
    // only (not as the useState initializer) to avoid a server/client
    // hydration mismatch, since the server has no way to know the visitor's
    // real timezone.
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      // leave unset — the select still defaults to "Select…" below
    }
  }, [router, slug]);

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
        country_code: country || undefined,
        timezone: timezone || undefined,
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
        <Confetti />
        <h1 className="font-heading mb-1 text-xl font-semibold text-neutral-900">Thanks, you&apos;re all set!</h1>
        <p className="mb-4 text-sm text-neutral-600">
          Your coach can now see your goals and get started.
        </p>
        <Button
          onClick={async () => {
            const p = await api.getMyClientProfile().catch(() => null);
            router.push(p ? `/${slug}/client/${p.id}/dashboard` : `/${slug}/dashboard`);
          }}
        >
          Go to dashboard
        </Button>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up mx-auto max-w-lg">
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
        <div>
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
          >
            <option value="">Select…</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {timezoneLabel(tz)}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-neutral-500">
            Used to show session times and messages in your own local time.
          </p>
        </div>
        {error && <p className="text-sm text-accent-700">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      </form>

      <div className="mt-6">
        <CustomFieldsCard
          fetchFields={api.getMyCustomFields}
          onSetValue={api.setMyCustomFieldValue}
          editable
        />
      </div>
    </Card>
  );
}
