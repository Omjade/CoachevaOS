"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useViewerRole } from "@/lib/useViewerRole";

// Superseded by /{slug}/client/{clientId}/onboarding — this flat route only
// exists to catch old links/bookmarks (and the invite-accept flow prior to
// this restructuring) and bounce them to the real one.
export default function OnboardingRedirectPage() {
  const role = useViewerRole();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (role === "client") {
      api
        .getMyClientProfile()
        .then((p) => router.replace(`/${params.slug}/client/${p.id}/onboarding`))
        .catch(() => router.replace(`/${params.slug}/dashboard`));
    } else if (role === "coach") {
      router.replace(`/${params.slug}/dashboard`);
    }
  }, [role, router, params.slug]);

  return null;
}
