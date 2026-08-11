"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogoIcon as GoogleLogo } from "@phosphor-icons/react";
import { api, ApiError, API_URL } from "@/lib/api";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import AuthLayout from "@/components/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register({
        name,
        email,
        password,
        role: "coach",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      router.push("/onboarding");
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
    <AuthLayout>
      <Card className="w-full">
        <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-neutral-600">Free for 14 days, no card required.</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <ErrorBanner>{error}</ErrorBanner>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Button type="submit" loading={loading} className="mt-1">
            {loading ? "Creating account…" : "Get started"}
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700">
            Log in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
