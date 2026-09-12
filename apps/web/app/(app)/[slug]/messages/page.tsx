"use client";

import { useEffect, useState } from "react";
import { api, ApiError, ThreadData } from "@/lib/api";
import ChatThread from "@/components/ChatThread";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function ClientMessagesPage() {
  const ok = useRoleGuard("client");
  const { user } = useCurrentUser();
  const [thread, setThread] = useState<ThreadData | null>(null);
  // Distinguishes "still checking," "genuinely no thread yet" (a real 404),
  // and "the request itself failed" — collapsing all three into one bare
  // `.catch(() => {})` is what left this page silently stuck before.
  const [status, setStatus] = useState<"loading" | "none" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    api
      .getMyThread()
      .then((t) => {
        setThread(t);
        setStatus("ready");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setStatus("none");
        else setStatus("error");
      });
  }

  useEffect(() => {
    if (!ok) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  if (!ok) return null;
  if (status === "loading") return <FullScreenLoader fill />;

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-[22px] border border-neutral-300/50 bg-white shadow-[0_20px_44px_rgba(28,29,31,0.06)]">
      {status === "ready" && thread && user ? (
        <ChatThread
          threadId={thread.id}
          meId={user.id}
          otherName={thread.client_name}
          otherTimezone={thread.timezone}
          showSuggestReply
        />
      ) : status === "error" ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-neutral-500">
          <p>Couldn&apos;t load your conversation.</p>
          <button type="button" onClick={load} className="font-medium text-accent-600 hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
          No conversation yet.
        </div>
      )}
    </div>
  );
}
