"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogoIcon as GoogleLogo } from "@phosphor-icons/react";
import { api, ApiError, API_URL } from "@/lib/api";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import AuthLayout from "@/components/AuthLayout";
import { RESERVED_SLUGS } from "@/lib/reservedSlugs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const googleError = searchParams.get("error") === "google_auth_failed";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{ name: string } | undefined>(undefined);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.login({ email, password });
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
          const { portal_slug } = await api.getMyPortal();
          router.push(portal_slug ? `/${portal_slug}/dashboard` : "/");
        } catch {
          router.push("/");
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the server right now — please try again in a moment."
      );
      setLoading(false);
    }
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
            <ErrorBanner>{error ?? "Google sign-in failed — please try again."}</ErrorBanner>
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
