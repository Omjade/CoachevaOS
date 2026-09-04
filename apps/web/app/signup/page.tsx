"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogoIcon as GoogleLogo } from "@phosphor-icons/react";
import { api, ApiError, API_URL } from "@/lib/api";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import AuthLayout from "@/components/AuthLayout";
import FullScreenLoader from "@/components/FullScreenLoader";
import { invalidateCurrentUser } from "@/lib/useCurrentUser";
import { invalidateOwnSlug } from "@/lib/useOwnSlug";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const prefillEmail = searchParams.get("email");
    if (prefillEmail) setEmail(prefillEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.register({
        name,
        email,
        password,
        role: "coach",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      invalidateCurrentUser();
      invalidateOwnSlug();
      setRedirecting(true);
      router.push("/onboarding");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the server right now. Please try again in a moment."
      );
      setLoading(false);
    }
  }

  if (redirecting) {
    return <FullScreenLoader message={`Welcome, ${name.split(" ")[0] || "there"}! Setting up your account…`} />;
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <h1 className="font-heading mb-1 text-2xl font-semibold tracking-tight text-neutral-900">
          Create your account
        </h1>
        <p className="mb-3 text-sm text-neutral-600">Free for 14 days, no card required.</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3"
          >
            <ErrorBanner>{error}</ErrorBanner>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} className="mt-0.5">
            {loading ? "Creating account…" : "Get started"}
          </Button>
        </form>

        <div className="my-2.5 flex items-center gap-3 text-xs text-neutral-500">
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

        <p className="mt-3 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700">
            Log in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
