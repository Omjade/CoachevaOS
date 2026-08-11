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
} from "@phosphor-icons/react";
import { api, PortalPublic, User } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar, { NavItem } from "@/components/Sidebar";

const NAV: NavItem[] = [
  { seg: "onboarding", label: "Onboarding", Icon: ListChecks },
  { seg: "dashboard", label: "Dashboard", Icon: Gauge },
  { seg: "messages", label: "Messages", Icon: ChatCircle },
  { seg: "tasks", label: "Tasks", Icon: CheckSquare },
  { seg: "calendar", label: "Calendar", Icon: CalendarBlank },
  { seg: "files", label: "Files", Icon: FileText },
  { seg: "progress", label: "Progress", Icon: ChartLineUp },
  { seg: "checkin", label: "Check-In", Icon: ClipboardText },
  { seg: "settings", label: "Settings", Icon: GearSix },
];

export default function PortalShell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [portal, setPortal] = useState<PortalPublic | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api
      .portalBySlug(slug)
      .then(setPortal)
      .catch(() => setNotFound(true));
    api
      .me()
      .then((u) => {
        if (u.role !== "client") {
          router.replace("/");
          return;
        }
        setUser(u);
        setChecking(false);
      })
      .catch(() => router.replace(`/login?redirect=/${slug}/dashboard`));
  }, [slug, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100">
        <p className="text-neutral-600">No coach found at coachevaos.com/{slug}</p>
      </div>
    );
  }

  if (checking || !user) return null;

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-100">
      <Sidebar
        slug={slug}
        brandLabel={portal?.business_name ?? portal?.coach_name ?? "CoachevaOS"}
        navItems={NAV}
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
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto w-full max-w-240 flex-1 px-6 py-9 md:px-9">{children}</main>
      </div>
    </div>
  );
}
