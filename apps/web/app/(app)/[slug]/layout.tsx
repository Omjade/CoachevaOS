"use client";

import { use, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CoachShell from "@/components/CoachShell";
import PortalShell from "@/components/PortalShell";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useViewerRole } from "@/lib/useViewerRole";
import { RESERVED_SLUGS } from "@/lib/reservedSlugs";

export default function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const role = useViewerRole();
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const nextSegment = segments[1];
  // A bare /{slug} (nextSegment undefined) is deliberately NOT forced through
  // login for an anonymous visitor — it's the public coach portfolio page
  // (Phase 52), same "anonymous renders children with no shell" treatment
  // already given to public form pages below.
  const isRealAppRoute = nextSegment !== undefined && RESERVED_SLUGS.includes(nextSegment);

  useEffect(() => {
    if (role === "anonymous" && isRealAppRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [role, isRealAppRoute, pathname, router]);

  // Keyed by pathname so navigating between two instances of the SAME page
  // component (e.g. one client's profile to another's) forces a real remount
  // and replays each page's own animate-fade-up entrance — different page
  // components already remount naturally on navigation, this only matters
  // for the same-component/different-params case that wouldn't otherwise.
  const keyedChildren = <div key={pathname}>{children}</div>;

  if (role === null) return <FullScreenLoader />;
  if (role === "anonymous") return isRealAppRoute ? <FullScreenLoader /> : keyedChildren;
  if (role === "client") return <PortalShell slug={slug}>{keyedChildren}</PortalShell>;
  return <CoachShell>{keyedChildren}</CoachShell>;
}
