"use client";

import { UserRole } from "@/lib/api";
import { useCurrentUser } from "@/lib/useCurrentUser";

export type ViewerRole = UserRole | "anonymous" | null;

export function useViewerRole(): ViewerRole {
  const { user, loading, error } = useCurrentUser();
  if (loading) return null;
  if (error) return "anonymous";
  return user?.role ?? "anonymous";
}
