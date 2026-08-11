"use client";

import { useEffect, useState } from "react";
import { api, ThreadData, User } from "@/lib/api";
import ChatThread from "@/components/ChatThread";

export default function ClientMessagesPage() {
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api.getMyThread().then(setThread).catch(() => {});
  }, []);

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-[22px] border border-neutral-300/50 bg-white shadow-[0_20px_44px_rgba(28,29,31,0.06)]">
      {thread && user ? (
        <ChatThread
          threadId={thread.id}
          meId={user.id}
          otherName={thread.client_name}
          otherTimezone={thread.timezone}
          showSuggestReply
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
          No conversation yet.
        </div>
      )}
    </div>
  );
}
