"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, ApiError, User } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";
import { NICHES } from "@/lib/niches";
import { COUNTRIES } from "@/lib/countries";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [slug, setSlug] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState<(typeof NICHES)[number]["value"]>("fitness");
  const [otherNiche, setOtherNiche] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        if (u.role !== "coach") {
          router.replace("/");
          return;
        }
        setUser(u);
        api
          .myProfile()
          .then((profile) => router.replace(`/${profile.portal_slug}/dashboard`))
          .catch(() => setChecking(false));
      })
      .catch(() => router.replace("/login"));
    // Pre-fill from best-effort IP geolocation — the coach confirms or
    // corrects it below rather than this being silently applied, unlike the
    // old registration-time-only assignment.
    api
      .getRegion()
      .then((r) => {
        if (r.country_code) setBillingCountry(r.country_code);
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile = await api.completeOnboarding({
        portal_slug: slug,
        business_name: businessName || undefined,
        niche: niche === "other" ? otherNiche || "other" : niche,
        timezone: user?.timezone,
        billing_country_code: billingCountry || undefined,
      });
      // Defensive — the onboarding form can take a while to fill out, so the
      // access token may be close to expiry by now. Touching an
      // authenticated endpoint here (while still in a known-good state)
      // triggers api.ts's existing refresh-on-401 retry proactively, rather
      // than the coach first discovering an expired token on the next page.
      await api.me().catch(() => {});
      router.push(`/${profile.portal_slug}/dashboard`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <Eyebrow className="mb-4">Almost there</Eyebrow>
        <h1 className="font-heading mb-2 text-[32px] leading-[1.02] font-semibold tracking-tight text-neutral-900">
          Set up your practice
        </h1>
        <p className="mb-7 text-sm text-neutral-600">
          A couple of details and you&apos;re on your dashboard.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <Label>Coaching niche</Label>
              <div className="grid max-h-64 grid-cols-3 gap-2.5 overflow-y-auto pr-1">
                {NICHES.map(({ value, label, Icon }) => {
                  const active = niche === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNiche(value)}
                      className={`flex flex-col items-center gap-2 rounded-[14px] border px-3 py-4 text-center text-xs font-medium transition-all duration-200 ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                          : "border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
                      }`}
                    >
                      <Icon
                        className="h-5 w-5"
                        weight={active ? "fill" : "regular"}
                        style={{ color: active ? "var(--color-accent-400)" : undefined }}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
              {niche === "other" && (
                <Input
                  className="mt-2.5"
                  placeholder="Tell us your niche"
                  value={otherNiche}
                  onChange={(e) => setOtherNiche(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="business_name">Business name (optional)</Label>
              <Input
                id="business_name"
                placeholder="e.g. Summit Coaching"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="billing_country">Where&apos;s your business based?</Label>
              <select
                id="billing_country"
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value)}
                className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="slug">Claim your portal link</Label>
              <div className="flex items-center overflow-hidden rounded-[12px] border border-neutral-200 bg-neutral-50/60 pl-3.5 transition-colors focus-within:border-accent-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent-100">
                <span className="text-sm text-neutral-400">coachevaos.com/</span>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="yourname"
                  required
                  className="w-full bg-transparent px-1 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                This becomes your permanent portal link, so choose carefully. It must be unique; we&apos;ll
                let you know if it&apos;s already taken.
              </p>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Setting up…" : "Continue to dashboard"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
