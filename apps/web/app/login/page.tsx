"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogoIcon as GoogleLogo } from "@phosphor-icons/react";
import {
  api,
  ApiError,
  API_URL,
  CoachChoice,
  isCoachChoiceRequired,
  isMfaRequired,
} from "@/lib/api";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import AuthLayout from "@/components/AuthLayout";
import FullScreenLoader from "@/components/FullScreenLoader";
import { RESERVED_SLUGS } from "@/lib/reservedSlugs";
import { invalidateCurrentUser } from "@/lib/useCurrentUser";
import { invalidateOwnSlug } from "@/lib/useOwnSlug";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const googleError = searchParams.get("error") === "google_auth_failed";
  // Pre-filled by a client's personal bookmark link (/{slug}/c/{code}) so
  // returning to a familiar login screen doesn't also mean retyping the
  // email — the password is still required, this is a convenience only.
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{ name: string } | undefined>(undefined);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  // Set when a client's login is ambiguous (they're a client of more than
  // one coach) — either from the inline POST /auth/login response, or from
  // arriving via Google OAuth's ?coach_choice=<token> redirect (which can't
  // return the choices list directly, so it's fetched separately below).
  const [coachChoice, setCoachChoice] = useState<{
    challengeToken: string;
    choices: CoachChoice[];
  } | null>(null);
  const [selectingCoach, setSelectingCoach] = useState(false);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    if (!redirect) return;
    const match = redirect.match(new RegExp(`^/([^/]+)/(${RESERVED_SLUGS.join("|")})(/|$)`));
    if (!match) return;
    api
      .portalBySlug(match[1])
      .then((p) => setBrand({ name: p.business_name ?? p.coach_name }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirect]);

  useEffect(() => {
    const token = searchParams.get("coach_choice");
    if (!token) return;
    api
      .getLoginCoachChoices(token)
      .then((result) => setCoachChoice({ challengeToken: result.challenge_token, choices: result.choices }))
      .catch(() => setError("That login link has expired. Please log in again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function afterLogin(user: { role: string; name?: string }) {
    invalidateCurrentUser();
    invalidateOwnSlug();
    setRedirecting(user.name ? `Welcome back, ${user.name.split(" ")[0]}!` : "Welcome back!");
    if (user.role === "coach") {
      if (redirect) {
        router.push(redirect);
        return;
      }
      try {
        const profile = await api.myProfile();
        router.push(`/${profile.portal_slug}/dashboard`);
      } catch {
        router.push("/onboarding");
      }
    } else {
      if (redirect) {
        router.push(redirect);
        return;
      }
      try {
        const profile = await api.getMyClientProfile();
        router.push(profile.portal_slug ? `/${profile.portal_slug}/client/${profile.id}/dashboard` : "/");
      } catch {
        router.push("/");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      if (isCoachChoiceRequired(result)) {
        setCoachChoice({ challengeToken: result.challenge_token, choices: result.choices });
        setLoading(false);
        return;
      }
      if (isMfaRequired(result)) {
        setChallengeToken(result.challenge_token);
        setLoading(false);
        return;
      }
      await afterLogin(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the server right now. Please try again in a moment."
      );
      setLoading(false);
    }
  }

  async function handleSelectCoach(coachId: string) {
    if (!coachChoice) return;
    setError(null);
    setSelectingCoach(true);
    try {
      const result = await api.selectLoginCoach(coachChoice.challengeToken, coachId);
      if (isMfaRequired(result)) {
        setCoachChoice(null);
        setChallengeToken(result.challenge_token);
        setSelectingCoach(false);
        return;
      }
      await afterLogin(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setSelectingCoach(false);
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setLoading(true);
    try {
      const user = await api.verifyMfa(challengeToken, mfaCode);
      await afterLogin(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (redirecting) {
    return <FullScreenLoader message={redirecting} />;
  }

  if (coachChoice) {
    return (
      <AuthLayout brand={brand}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="w-full">
            <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
              Which coach?
            </h1>
            <p className="mb-6 text-sm text-neutral-600">
              You&apos;re a client of more than one coach on CoachevaOS. Pick which one to log in to.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4"
              >
                <ErrorBanner>{error}</ErrorBanner>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              {coachChoice.choices.map((c) => (
                <button
                  key={c.coach_id}
                  type="button"
                  disabled={selectingCoach}
                  onClick={() => handleSelectCoach(c.coach_id)}
                  className="rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-left text-sm font-medium text-neutral-900 transition-colors hover:border-accent-500 hover:bg-accent-50 disabled:opacity-60"
                >
                  {c.business_name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setCoachChoice(null);
                setError(null);
              }}
              className="mt-5 text-center text-xs text-neutral-500 hover:text-accent-600"
            >
              Back to log in
            </button>
          </Card>
        </motion.div>
      </AuthLayout>
    );
  }

  if (challengeToken) {
    return (
      <AuthLayout brand={brand}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
        <Card className="w-full">
          <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
            Two-factor code
          </h1>
          <p className="mb-6 text-sm text-neutral-600">
            Enter the 6-digit code from your authenticator app, or one of your backup codes.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4"
            >
              <ErrorBanner>{error}</ErrorBanner>
            </motion.div>
          )}

          <form onSubmit={handleVerifyMfa} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="mfa-code">Code</Label>
              <Input
                id="mfa-code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" loading={loading} className="mt-1">
              {loading ? "Verifying…" : "Verify"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setChallengeToken(null);
                setMfaCode("");
                setError(null);
              }}
              className="text-center text-xs text-neutral-500 hover:text-accent-600"
            >
              Back to log in
            </button>
          </form>
        </Card>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout brand={brand}>
      <Card className="w-full">
        <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
          Log in
        </h1>
        <p className="mb-6 text-sm text-neutral-600">Good to see you again.</p>

        {(error || googleError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <ErrorBanner>{error ?? "Google sign-in failed. Please try again."}</ErrorBanner>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} className="mt-1">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-neutral-500">
          <div className="h-px flex-1 bg-divider" />
          or
          <div className="h-px flex-1 bg-divider" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => (window.location.href = `${API_URL}/auth/google/login`)}
        >
          <GoogleLogo className="h-4 w-4" weight="bold" />
          Continue with Google
        </Button>

        <p className="mt-5 text-center text-sm text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent-600 hover:text-accent-700">
            Get started
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
