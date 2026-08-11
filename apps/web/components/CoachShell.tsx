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
} from "@phosphor-icons/react";
import { api, User } from "@/lib/api";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar, { NavItem } from "@/components/Sidebar";

const NAV: NavItem[] = [
  { seg: "dashboard", label: "Dashboard", Icon: Gauge },
  { seg: "leads", label: "Leads", Icon: UsersThree },
  { seg: "forms", label: "Forms", Icon: NotePencil },
  { seg: "clients", label: "Clients", Icon: UserCircle },
  { seg: "chat", label: "Chat", Icon: ChatCircle },
  { seg: "calendar", label: "Calendar", Icon: CalendarBlank },
  { seg: "documents", label: "Documents", Icon: FileText },
  { seg: "settings", label: "Profile", Icon: GearSix },
];

export default function CoachShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        if (u.role !== "coach") {
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
            setUser(u);
            setChecking(false);
          })
          .catch(() => router.replace("/onboarding"));
      })
      .catch(() => router.replace("/login"));
  }, [router, params.slug]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (checking || !user) return null;

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-100">
      <Sidebar
        slug={params.slug}
        brandLabel="CoachevaOS"
        navItems={NAV}
        identityUserId={user.id}
        identityName={user.name}
        identityRole="Coach"
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
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto w-full max-w-320 flex-1 px-6 py-9 md:px-9">
          <SubscriptionBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
