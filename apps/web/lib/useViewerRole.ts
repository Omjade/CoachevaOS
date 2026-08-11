"use client";

import { useEffect, useState } from "react";
import { api, UserRole } from "@/lib/api";

export type ViewerRole = UserRole | "anonymous" | null;

export function useViewerRole(): ViewerRole {
  const [role, setRole] = useState<ViewerRole>(null);

  useEffect(() => {
    api
      .me()
      .then((u) => setRole(u.role))
      .catch(() => setRole("anonymous"));
  }, []);

  return role;
}
