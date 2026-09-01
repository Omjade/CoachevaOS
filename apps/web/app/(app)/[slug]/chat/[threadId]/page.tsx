"use client";

import { use } from "react";
import ChatInbox from "@/components/ChatInbox";
import { useRoleGuard } from "@/lib/useRoleGuard";

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { threadId } = use(params);
  const ok = useRoleGuard("coach");
  if (!ok) return null;
  return <ChatInbox activeThreadId={threadId} />;
}
