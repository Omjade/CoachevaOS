"use client";

import { use } from "react";
import ChatInbox from "@/components/ChatInbox";

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { threadId } = use(params);
  return <ChatInbox activeThreadId={threadId} />;
}
