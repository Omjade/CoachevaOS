"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ListChecksIcon as ListChecks,
  GaugeIcon as Gauge,
  ChatCircleIcon as ChatCircle,
  CheckSquareIcon as CheckSquare,
  CalendarBlankIcon as CalendarBlank,
  FileTextIcon as FileText,
  ChartLineUpIcon as ChartLineUp,
  ClipboardTextIcon as ClipboardText,
  GearSixIcon as GearSix,
  ListIcon as ListMenu,
  SparkleIcon as Sparkle,
  PackageIcon as Package,
  UserCircleIcon as UserCircle,
} from "@phosphor-icons/react";
import { api, PortalPublic, User } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import Sidebar, { NavItem } from "@/components/Sidebar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import FullScreenLoader from "@/components/FullScreenLoader";

// Segments relative to the client's own /{slug}/client/{clientId}/ root —
// the clientId is only known once the profile fetch below resolves, so the
// nav array is built dynamically instead of being a static constant.
function buildNav(clientId: string): NavItem[] {
  const base = `client/${clientId}`;
  return [
    { seg: `${base}/onboarding`, label: "Onboarding", Icon: ListChecks },
    { seg: `${base}/dashboard`, label: "Dashboard", Icon: Gauge },
    { seg: `${base}/tasks`, label: "Tasks", Icon: CheckSquare },
    { seg: `${base}/calendar`, label: "Calendar", Icon: CalendarBlank },
    { seg: `${base}/files`, label: "Files", Icon: FileText },
    { seg: `${base}/progress`, label: "Progress", Icon: ChartLineUp },
    { seg: `${base}/packages`, label: "Packages", Icon: Package },
    { seg: `${base}/checkin`, label: "Check-In", Icon: ClipboardText },
    // Not nested under client/{id} — the coach's own bio/socials aren't
    // client-specific data, same page regardless of which client views it.
    { seg: "coach", label: "Know your coach", Icon: UserCircle },
    { seg: `${base}/settings`, label: "Settings", Icon: GearSix },
  ];
}

export default function PortalShell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Shared with the layout's useViewerRole() and any other consumer on this
  // page — dedupes the /auth/me call instead of every shell/page fetching it
  // independently.
  const { user: currentUser, loading: userLoading, error: userError } = useCurrentUser();
  const [portal, setPortal] = useState<PortalPublic | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantEnabled, setAssistantEnabled] = useState(false);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [myClientId, setMyClientId] = useState<string | null>(null);

  useEffect(() => {
    api.portalBySlug(slug).then(setPortal).catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (userLoading) return;
    if (userError || !currentUser) {
      router.replace(`/login?redirect=/${slug}/dashboard`);
      return;
    }
    if (currentUser.role !== "client") {
      router.replace("/");
      return;
    }
    setUser(currentUser);
    // No client-safe "is enabled" check exists — the message-list endpoint
    // itself enforces the enabled flag server-side, so a successful call is
    // the signal to show the nav item at all.
    api
      .listMyAssistantMessages()
      .then(() => setAssistantEnabled(true))
      .catch(() => setAssistantEnabled(false));
    // Every nav link is built from the client's own id — resolve it before
    // letting the shell (and its nav) render at all. The Messages nav item
    // itself points at the static /messages page, which resolves its own
    // thread, so no thread id needs to be pre-fetched here.
    api
      .getMyClientProfile()
      .then((p) => setMyClientId(p.id))
      .catch(() => {});
  }, [currentUser, userLoading, userError, slug, router]);

  useEffect(() => {
    if (myClientId) setChecking(false);
  }, [myClientId]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (checking) return;
    function refreshBadge() {
      api
        .getMyThread()
        .then((t) => setMessagesUnread(t.unread_count))
        .catch(() => {});
    }
    refreshBadge();
    const interval = setInterval(refreshBadge, 30000);
    return () => clearInterval(interval);
  }, [checking]);

  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100">
        <p className="text-neutral-600">No coach found at coachevaos.com/{slug}</p>
      </div>
    );
  }

  if (checking || !user || !myClientId) return <FullScreenLoader />;

  const base = buildNav(myClientId);
  const withAssistant = assistantEnabled
    ? [
        ...base.slice(0, 2),
        { seg: `client/${myClientId}/assistant`, label: "AI Assistant", Icon: Sparkle },
        ...base.slice(2),
      ]
    : base;
  // Points at the real client-only messages page (self-resolves its own
  // thread via getMyThread()) rather than the coach-only /chat/[threadId]
  // route — that route is guarded useRoleGuard("coach") and would silently
  // bounce a client back to /dashboard. Spliced in right after Dashboard,
  // same position it held in the old flat nav.
  const messagesItem: NavItem = {
    seg: "messages",
    label: "Messages",
    Icon: ChatCircle,
    badgeCount: messagesUnread,
  };
  const dashboardIdx = withAssistant.findIndex((i) => i.label === "Dashboard");
  const navItems: NavItem[] = [
    ...withAssistant.slice(0, dashboardIdx + 1),
    messagesItem,
    ...withAssistant.slice(dashboardIdx + 1),
  ];

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-100">
      <Sidebar
        slug={slug}
        brandLabel={portal?.business_name ?? portal?.coach_name ?? "CoachevaOS"}
        navItems={navItems}
        identityUserId={user.id}
        identityName={user.name}
        identityRole="Client"
        mobileNavOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        expandedWidth="w-58"
      />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-divider bg-neutral-100 px-6">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200/60 md:hidden"
            aria-label="Open menu"
          >
            <ListMenu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto w-full max-w-240 flex-1 px-6 py-5 md:px-9 md:py-6">{children}</main>
      </div>
    </div>
  );
}
