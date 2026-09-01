"use client";

import { use } from "react";
import { useViewerRole } from "@/lib/useViewerRole";
import { ClientSettings } from "@/app/(app)/[slug]/settings/page";
import ClientProfilePage from "@/app/(app)/[slug]/clients/[id]/page";

// Same rationale as the nested dashboard page — a coach manages a client's
// profile from the existing client-detail page, so the coach branch renders
// that real view directly here too instead of bouncing away.
export default function NestedSettingsPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { slug, clientId } = use(params);
  const role = useViewerRole();

  if (role === null) return null;
  if (role === "coach") {
    return <ClientProfilePage params={Promise.resolve({ slug, id: clientId })} />;
  }
  return <ClientSettings />;
}
