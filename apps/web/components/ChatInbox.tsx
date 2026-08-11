"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatCircleIcon as ChatCircle } from "@phosphor-icons/react";
import { api, ThreadData, User } from "@/lib/api";
import { useChatSocket } from "@/lib/useChatSocket";
import { Card } from "@/components/ui";
import ChatThread from "@/components/ChatThread";
import Avatar from "@/components/Avatar";

export default function ChatInbox({ activeThreadId }: { activeThreadId?: string }) {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [presenceByThread, setPresenceByThread] = useState<Record<string, boolean>>({});
  const [userIdByThread, setUserIdByThread] = useState<Record<string, string>>({});

  function refresh() {
    api.listThreads().then((list) => {
      setThreads(list);
      if (!activeThreadId && list.length > 0) {
        router.replace(`/${params.slug}/chat/${list[0].id}`);
      }
      Promise.all(
        list.map((t) => api.getThreadPresence(t.id).then((p) => ({ threadId: t.id, p })).catch(() => null))
      ).then((results) => {
        const presence: Record<string, boolean> = {};
        const userIds: Record<string, string> = {};
        results.forEach((r) => {
          if (!r) return;
          presence[r.threadId] = r.p.online;
          userIds[r.threadId] = r.p.user_id;
        });
        setPresenceByThread(presence);
        setUserIdByThread(userIds);
      });
    });
  }

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useChatSocket({
    onMessage: () => refresh(),
    onPresence: (event) => {
      setPresenceByThread((prev) => {
        const next = { ...prev };
        for (const [threadId, userId] of Object.entries(userIdByThread)) {
          if (userId === event.user_id) next[threadId] = event.online;
        }
        return next;
      });
    },
  });

  const active = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-[22px] border border-neutral-300/50 bg-white shadow-[0_20px_44px_rgba(28,29,31,0.06)]">
      <div className="w-70 shrink-0 overflow-y-auto border-r border-neutral-200/70">
        {threads.length === 0 ? (
          <div className="p-4">
            <Card className="!shadow-none">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <ChatCircle className="h-4.5 w-4.5" weight="fill" />
              </div>
              <p className="text-sm text-neutral-600">
                No conversations yet — once you add clients, their chat threads will show up
                here.
              </p>
            </Card>
          </div>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/${params.slug}/chat/${t.id}`)}
              className={`flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors ${
                activeThreadId === t.id
                  ? "border-l-accent-600 bg-accent-100"
                  : "border-l-transparent hover:bg-neutral-100/60"
              }`}
            >
              <div className="relative shrink-0">
                {userIdByThread[t.id] ? (
                  <Avatar
                    userId={userIdByThread[t.id]}
                    name={t.client_name}
                    className="h-9 w-9 text-xs"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                    {t.client_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {presenceByThread[t.id] && (
                  <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{t.client_name}</p>
                <p className="truncate text-xs text-neutral-500">
                  {t.last_message_preview ?? "No messages yet"}
                </p>
              </div>
              {t.unread_count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-600 px-1.5 text-[10px] font-semibold text-white">
                  {t.unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
      <div className="flex-1">
        {active && user ? (
          <ChatThread
            key={active.id}
            threadId={active.id}
            meId={user.id}
            otherName={active.client_name}
            otherTimezone={active.timezone}
            showSuggestReply
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            {threads.length === 0 ? "" : "Select a conversation"}
          </div>
        )}
      </div>
    </div>
  );
}
