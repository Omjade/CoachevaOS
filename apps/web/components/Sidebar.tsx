"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  XIcon as X,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Avatar from "@/components/Avatar";

export interface NavItem {
  seg: string;
  label: string;
  Icon: PhosphorIcon;
  badgeCount?: number;
}

export default function Sidebar({
  slug,
  brandLabel,
  logoUrl,
  navItems,
  identityUserId,
  identityName,
  identityRole,
  mobileNavOpen,
  onCloseMobile,
  expandedWidth = "w-62",
}: {
  slug: string;
  brandLabel: string;
  /** Coach's own uploaded logo, if set — falls back to the platform mark. */
  logoUrl?: string | null;
  navItems: NavItem[];
  identityUserId: string;
  identityName: string;
  identityRole: string;
  mobileNavOpen: boolean;
  onCloseMobile: () => void;
  expandedWidth?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  // Longest matching href wins — otherwise a nested item like
  // "settings/custom-fields" would also satisfy the plain "settings" item's
  // startsWith check and both would light up as active at once.
  let bestSeg: string | null = null;
  let bestLen = -1;
  for (const item of navItems) {
    const href = `/${slug}/${item.seg}`;
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && href.length > bestLen) {
      bestSeg = item.seg;
      bestLen = href.length;
    }
  }

  const navContent = (isCollapsed: boolean) => (
    <>
      <div className={`mb-8 flex items-center gap-2 px-2 ${isCollapsed ? "justify-center px-0" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- same reasoning as Avatar.tsx: backend-served URL with an unpredictable host, needs onError fallback next/image can't give us */}
          <img
            src={logoUrl || "/coachevaos-logo.png"}
            alt=""
            onError={(e) => {
              if (e.currentTarget.src.endsWith("/coachevaos-logo.png")) return;
              e.currentTarget.src = "/coachevaos-logo.png";
            }}
            className="h-full w-full object-cover"
          />
        </span>
        {!isCollapsed && (
          <span className="font-heading truncate text-sm font-bold text-white">{brandLabel}</span>
        )}
      </div>
      <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const href = `/${slug}/${item.seg}`;
          const active = item.seg === bestSeg;
          return (
            <Link
              key={item.seg}
              href={href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isCollapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_var(--color-accent-500)]"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <span className="relative shrink-0">
                <item.Icon
                  className="h-4 w-4"
                  weight={active ? "fill" : "regular"}
                  style={{ color: active ? "var(--color-accent-500)" : undefined }}
                />
                {isCollapsed && !!item.badgeCount && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-600 text-[8px] font-semibold text-white">
                    {item.badgeCount > 9 ? "9+" : item.badgeCount}
                  </span>
                )}
              </span>
              {!isCollapsed && (
                <span className="flex flex-1 items-center justify-between gap-2">
                  {item.label}
                  {!!item.badgeCount && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold text-white">
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        className={`mb-2 hidden items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 md:flex ${
          isCollapsed ? "justify-center px-0" : ""
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <CaretRight className="h-4 w-4" /> : <CaretLeft className="h-4 w-4" />}
        {!isCollapsed && "Collapse"}
      </button>

      <div
        className={`flex items-center gap-2 border-t border-white/10 px-2 pt-4 ${
          isCollapsed ? "justify-center px-0" : ""
        }`}
      >
        <Avatar userId={identityUserId} name={identityName} className="h-9 w-9 text-sm shrink-0" />
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{identityName}</p>
            <p className="truncate text-xs text-neutral-500">{identityRole}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-neutral-900 px-4 py-6 transition-[width] duration-200 md:flex ${
          ready && collapsed ? "w-16" : expandedWidth
        }`}
      >
        {navContent(ready && collapsed)}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={onCloseMobile} />
          <aside className={`relative flex ${expandedWidth} flex-col bg-neutral-900 px-4 py-6`}>
            <button
              onClick={onCloseMobile}
              className="absolute top-6 right-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {navContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
