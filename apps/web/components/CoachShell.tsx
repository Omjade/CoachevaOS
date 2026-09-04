"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  GaugeIcon as Gauge,
  UsersThreeIcon as UsersThree,
  UserCircleIcon as UserCircle,
  ChatCircleIcon as ChatCircle,
  CalendarBlankIcon as CalendarBlank,
  FileTextIcon as FileText,
  NotePencilIcon as NotePencil,
  GearSixIcon as GearSix,
  ListIcon as ListMenu,
  SlidersHorizontalIcon as SlidersHorizontal,
  StackIcon as Stack,
} from "@phosphor-icons/react";
import { api, User } from "@/lib/api";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import NotificationBell from "@/components/NotificationBell";
import Sidebar, { NavItem } from "@/components/Sidebar";
import { SubscriptionProvider } from "@/lib/useSubscription";
import { useCurrentUser } from "@/lib/useCurrentUser";
import FullScreenLoader from "@/components/FullScreenLoader";
import { nicheDisplayLabel } from "@/lib/niche";

const NAV: NavItem[] = [
  { seg: "dashboard", label: "Dashboard", Icon: Gauge },
  { seg: "leads", label: "Leads", Icon: UsersThree },
  { seg: "forms", label: "Forms", Icon: NotePencil },
  { seg: "clients", label: "Clients", Icon: UserCircle },
  { seg: "programs", label: "Programs", Icon: Stack },
  { seg: "chat", label: "Chat", Icon: ChatCircle },
  { seg: "calendar", label: "Calendar", Icon: CalendarBlank },
  { seg: "documents", label: "Documents", Icon: FileText },
  { seg: "settings/custom-fields", label: "Custom Fields", Icon: SlidersHorizontal },
  { seg: "settings", label: "Profile", Icon: GearSix },
];

export default function CoachShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  // Shared with the layout's useViewerRole() and any other consumer on this
  // page — the first caller during a page load fetches /auth/me once, every
  // other useCurrentUser() call (including this one) reuses that same result
  // instead of firing a redundant request.
  const { user: currentUser, loading: userLoading, error: userError } = useCurrentUser();
  const [user, setUser] = useState<User | null>(null);
  const [niche, setNiche] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [formsUnread, setFormsUnread] = useState(0);

  useEffect(() => {
    if (userLoading) return;
    if (userError || !currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "coach") {
      router.replace("/");
      return;
    }
    api
      .myProfile()
      .then((profile) => {
        if (profile.portal_slug !== params.slug) {
          router.replace(`/${profile.portal_slug}/dashboard`);
          return;
        }
        setNiche(profile.niche);
        setLogoUrl(profile.logo_url ? api.coachLogoUrl(profile.portal_slug) : null);
        setUser(currentUser);
        setChecking(false);
      })
      .catch(() => router.replace("/onboarding"));
  }, [currentUser, userLoading, userError, router, params.slug]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (checking) return;
    function refreshBadges() {
      api
        .listThreads()
        .then((threads) => setChatUnread(threads.reduce((sum, t) => sum + t.unread_count, 0)))
        .catch(() => {});
      api
        .listNotifications()
        .then((ns) =>
          setFormsUnread(ns.filter((n) => n.type === "form_submitted" && !n.read_at).length)
        )
        .catch(() => {});
    }
    refreshBadges();
    const interval = setInterval(refreshBadges, 30000);
    return () => clearInterval(interval);
  }, [checking]);

  if (checking || !user) return <FullScreenLoader />;

  const navItems: NavItem[] = NAV.map((item) => {
    if (item.seg === "chat") return { ...item, badgeCount: chatUnread };
    if (item.seg === "forms") return { ...item, badgeCount: formsUnread };
    return item;
  });

  return (
    <SubscriptionProvider>
      <div className="flex min-h-screen flex-1 bg-neutral-100">
        <Sidebar
          slug={params.slug}
          brandLabel="CoachevaOS"
          logoUrl={logoUrl}
          navItems={navItems}
          identityUserId={user.id}
          identityName={user.name}
          identityRole={nicheDisplayLabel(niche)}
          mobileNavOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          expandedWidth="w-62"
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
          <main className="mx-auto w-full max-w-320 flex-1 px-6 py-5 md:px-9 md:py-6">
            <SubscriptionBanner />
            {children}
          </main>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
