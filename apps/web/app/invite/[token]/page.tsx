"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { GoogleLogoIcon as GoogleLogo } from "@phosphor-icons/react";
import { api, ApiError, API_URL, InvitePreview } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";

type PreviewState = InvitePreview | "invalid" | "already_used" | null;

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewState>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .previewInvite(token)
      .then(setPreview)
      .catch((err) => setPreview(err instanceof ApiError && err.status === 409 ? "already_used" : "invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.acceptInvite(token, password);
      router.push(result.portal_slug ? `/${result.portal_slug}/onboarding` : "/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPreview("already_used");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  if (preview === null) return null;

  if (preview === "invalid") {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-neutral-600">This invite link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  if (preview === "already_used") {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <h1 className="font-heading mb-1.5 text-xl font-semibold text-neutral-900">
            You&apos;re already set up
          </h1>
          <p className="mb-6 text-sm text-neutral-600">
            This invite has already been accepted — log in to your account instead.
          </p>
          <Link href="/login">
            <Button className="w-full">Log in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-100 p-3 md:p-4">
      <div className="flex flex-1 items-center justify-center px-2 py-16">
        <div className="w-full max-w-sm">
          <Eyebrow className="mb-4">You&apos;re invited</Eyebrow>
          <Card>
            <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
              Welcome, {preview.name}
            </h1>
            <p className="mb-6 text-sm text-neutral-600">
              <span className="font-medium text-neutral-900">{preview.coach_name}</span> has
              invited you to their coaching practice on CoachevaOS. Set a password to get
              started.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={preview.email} disabled />
              </div>
              <div>
                <Label htmlFor="password">Create a password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <ErrorBanner>{error}</ErrorBanner>}
              <Button type="submit" loading={loading} className="mt-1">
                {loading ? "Setting up…" : "Get started"}
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
            <p className="mt-3 text-center text-xs text-neutral-500">
              Use the Google account tied to {preview.email}.
            </p>
          </Card>
        </div>
      </div>

      <div className="relative ml-4 hidden w-[42%] shrink-0 overflow-hidden rounded-[28px] bg-neutral-900 lg:block">
        <Image
          src="/m80ZhxX0AHAi3ZQzPq6jtq80gTA.png"
          alt=""
          aria-hidden
          fill
          sizes="42vw"
          className="object-cover"
          style={{ objectPosition: "78% 28%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/10 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-10">
          <p className="font-heading text-2xl leading-snug font-medium text-white">
            {preview.coach_name} is ready to get started with you.
          </p>
          <p className="mt-3 text-sm text-neutral-300">
            Your messages, sessions, and progress will all live in one calm place.
          </p>
        </div>
      </div>
    </div>
  );
}
