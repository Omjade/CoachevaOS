"use client";

import { use, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CoachShell from "@/components/CoachShell";
import PortalShell from "@/components/PortalShell";
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
  const isRealAppRoute = nextSegment === undefined || RESERVED_SLUGS.includes(nextSegment);

  useEffect(() => {
    if (role === "anonymous" && isRealAppRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [role, isRealAppRoute, pathname, router]);

  if (role === null) return null;
  if (role === "anonymous") return isRealAppRoute ? null : <>{children}</>;
  if (role === "client") return <PortalShell slug={slug}>{children}</PortalShell>;
  return <CoachShell>{children}</CoachShell>;
}
