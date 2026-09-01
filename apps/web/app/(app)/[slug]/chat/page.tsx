"use client";

import ChatInbox from "@/components/ChatInbox";
import { useRoleGuard } from "@/lib/useRoleGuard";

export default function ChatPage() {
  const ok = useRoleGuard("coach");
  if (!ok) return null;
  return <ChatInbox />;
}
