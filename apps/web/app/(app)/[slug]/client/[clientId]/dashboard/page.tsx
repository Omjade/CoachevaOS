"use client";

import { use } from "react";
import { useViewerRole } from "@/lib/useViewerRole";
import { ClientDashboard } from "@/app/(app)/[slug]/dashboard/page";
import ClientProfilePage from "@/app/(app)/[slug]/clients/[id]/page";

// A coach doesn't have a separate per-client "dashboard" concept distinct
// from the existing full client-detail page — rather than render a thin
// duplicate (or bounce away, which this used to do), the coach branch
// renders that same real, already-built view directly at this nested URL
// too, so no address in the client/{id}/* family is ever a dead end.
export default function NestedDashboardPage({
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
  return <ClientDashboard />;
}
