"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatCircleIcon as ChatCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useViewerRole } from "@/lib/useViewerRole";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card } from "@/components/ui";
import Avatar from "@/components/Avatar";
import FullScreenLoader from "@/components/FullScreenLoader";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  at_risk: "At risk",
  paused: "Paused",
  churned: "Churned",
};

interface Identity {
  userId: string;
  name: string;
  email: string;
  status?: string;
  threadId?: string | null;
}

// Shared sticky-left identity panel for every /{slug}/client/{clientId}/*
// sub-page (dashboard/tasks/calendar/progress/checkin/files/assistant/
// settings/onboarding) — one implementation instead of nine copies. The URL's
// clientId is purely a display/bookmark convenience: identity/authorization
// still comes entirely from the session (coach-owned lookup vs the client's
// own profile), and a client whose own id doesn't match the URL is corrected
// via redirect rather than ever trusting the URL for access control.
export default function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { slug, clientId } = use(params);
  const role = useViewerRole();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (role === null || role === "anonymous") return;
    if (role === "coach") {
      api
        .getClient(clientId)
        .then((c) =>
          setIdentity({
            userId: c.user_id,
            name: c.name,
            email: c.email,
            status: c.status,
            threadId: c.thread_id,
          })
        )
        .catch(() => setNotFound(true));
    } else {
      api
        .getMyClientProfile()
        .then((p) => {
          if (p.id !== clientId) {
            // Stale/incorrect id in the URL (e.g. an old bookmark) — the
            // session is still the source of truth, so correct the address
            // rather than showing someone else's data or a dead end.
            router.replace(`/${slug}/client/${p.id}/dashboard`);
            return;
          }
          setIdentity({ userId: currentUser?.id ?? "", name: p.name, email: p.email });
        })
        .catch(() => router.replace(`/${slug}/dashboard`));
    }
  }, [role, clientId, slug, router, currentUser]);

  if (role === null || (role !== "anonymous" && !identity && !notFound)) {
    return <FullScreenLoader fill />;
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-neutral-600">This client couldn&apos;t be found.</p>
        <Link href={`/${slug}/clients`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
          Back to clients
        </Link>
      </div>
    );
  }

  if (!identity) return null;

  // The identity card (name/email/avatar) only earns its place for the
  // COACH's view — it tells them which of their many clients they're
  // looking at. A client viewing their own pages already sees their own
  // name once, in the sidebar's identity footer (PortalShell.tsx); repeating
  // it in the main content area of every single page was pure redundancy,
  // not a helpful reminder of who they are.
  if (role !== "coach") {
    return <div className="flex flex-col gap-6">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:sticky lg:top-9 lg:h-fit lg:w-64">
        <Card className="flex flex-col items-center text-center">
          <Avatar userId={identity.userId} name={identity.name} className="mb-3 h-20 w-20 text-2xl" />
          <p className="font-heading text-base font-semibold text-neutral-900">{identity.name}</p>
          <p className="mb-3 truncate text-xs text-neutral-500">{identity.email}</p>
          {identity.status && (
            <span className="mb-3 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
              {STATUS_LABEL[identity.status] ?? identity.status}
            </span>
          )}
          <div className="flex w-full flex-col gap-2">
            <Link
              href={`/${slug}/clients/${clientId}`}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Full client profile
            </Link>
            {identity.threadId && (
              <Link
                href={`/${slug}/chat/${identity.threadId}`}
                className="flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:-translate-y-0.5 transition-transform"
              >
                <ChatCircle className="h-3.5 w-3.5" weight="fill" />
                Message
              </Link>
            )}
          </div>
        </Card>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
