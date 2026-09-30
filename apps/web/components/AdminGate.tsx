"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Spinner } from "@/components/ui";
import AdminHeader from "@/components/AdminHeader";

// UX-only gate — the real enforcement is server-side: every /admin/* API
// call 404s for anyone but PLATFORM_OWNER_EMAIL (see apps/api/app/deps.py
// require_platform_owner). This just avoids flashing admin UI/API responses
// to someone who isn't the owner before the redirect fires. Deliberately
// does NOT check user.role — /admin is reachable independent of the
// coach/client role system by design.
const OWNER_EMAIL = process.env.NEXT_PUBLIC_PLATFORM_OWNER_EMAIL || "";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  const isOwner = !!user && (!OWNER_EMAIL || user.email === OWNER_EMAIL);

  useEffect(() => {
    if (loading) return;
    if (!isOwner) router.replace("/login");
  }, [isOwner, loading, router]);

  if (loading || !isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />
      {children}
    </div>
  );
}
