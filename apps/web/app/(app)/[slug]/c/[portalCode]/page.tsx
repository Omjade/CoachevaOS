"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/useCurrentUser";

// A client's permanent personal bookmark link. Client identity in this app
// always comes from the session cookie, never a URL segment, so this page
// can't itself log anyone in — its only job is to resolve the code into a
// personalized redirect: straight to the dashboard if already signed in,
// otherwise into the normal (password-required) login flow, pre-filled.
export default function ClientPortalLinkPage({
  params,
}: {
  params: Promise<{ slug: string; portalCode: string }>;
}) {
  const { slug, portalCode } = use(params);
  const router = useRouter();
  // Shared with the layout's useViewerRole() call, which already runs on
  // every route under [slug] — reuses that result instead of a second fetch.
  const { user, loading, error } = useCurrentUser();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Already signed in — resolve their own client id so this lands
      // directly on the real nested dashboard rather than bouncing through
      // the flat /dashboard redirect-only page. Falls back to the flat
      // route (which itself redirects onward) if that lookup fails for any
      // reason — never leaves the user stranded.
      if (user.role === "client") {
        api
          .getMyClientProfile()
          .then((profile) => router.replace(`/${slug}/client/${profile.id}/dashboard`))
          .catch(() => router.replace(`/${slug}/dashboard`));
      } else {
        router.replace(`/${slug}/dashboard`);
      }
      return;
    }
    if (!error) return;
    api
      .getClientPortalPreview(slug, portalCode)
      .then((preview) => {
        router.replace(
          `/login?redirect=${encodeURIComponent(`/${slug}/dashboard`)}&email=${encodeURIComponent(preview.email)}`
        );
      })
      .catch(() => setNotFound(true));
  }, [slug, portalCode, user, loading, error, router]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-neutral-100 px-6">
        <div className="text-center">
          <p className="text-sm text-neutral-600">This link isn&apos;t available anymore.</p>
          <a
            href="/login"
            className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return null;
}
