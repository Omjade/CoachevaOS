"use client";

import { use, useEffect, useRef, useState } from "react";
import { PaperPlaneRightIcon as PaperPlaneRight, SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, AssistantMessage } from "@/lib/api";
import { Button, Card, Eyebrow } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";

export default function AssistantPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { clientId } = use(params);
  const role = useViewerRole();

  if (role === null) return null;
  return role === "coach" ? (
    <CoachAssistantAudit clientId={clientId} />
  ) : (
    <ClientAssistantChat />
  );
}

function CoachAssistantAudit({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<AssistantMessage[] | null>(null);

  useEffect(() => {
    api.listClientAssistantMessages(clientId).then(setMessages).catch(() => setMessages([]));
  }, [clientId]);

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <div>
        <Eyebrow className="mb-2">Read-only</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          AI Assistant conversation
        </h1>
      </div>
      <Card className="flex h-[calc(100vh-14rem)] flex-col !p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages?.length === 0 && (
            <p className="text-sm text-neutral-500">No conversation yet.</p>
          )}
          {messages?.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-sm rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === "user" ? "bg-accent-600 text-white" : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.content}
                {m.escalated && (
                  <p className="mt-1 text-xs opacity-70">Escalated to you.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ClientAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .listMyAssistantMessages()
      .then(setMessages)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setUnavailable(true);
        setMessages([]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const question = text.trim();
    setText("");
    setSending(true);
    setError(null);
    try {
      const result = await api.sendMyAssistantMessage(question);
      setMessages((prev) => [
        ...(prev ?? []),
        { id: `local-${Date.now()}`, role: "user", content: question, escalated: false, created_at: new Date().toISOString() },
        result.reply,
      ]);
      setRemaining(result.remaining_today);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (unavailable) {
    return (
      <div className="animate-fade-up flex flex-col gap-6">
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          AI Assistant
        </h1>
        <Card>
          <p className="text-sm text-neutral-600">
            Your coach hasn&apos;t enabled the AI assistant yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Between check-ins</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            AI Assistant
          </h1>
        </div>
        {remaining !== null && (
          <p className="text-xs text-neutral-500">{remaining} question{remaining === 1 ? "" : "s"} left today</p>
        )}
      </div>

      <Card className="flex h-[calc(100vh-14rem)] flex-col !p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages?.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <Sparkle className="h-4.5 w-4.5" weight="fill" />
              </span>
              <p className="max-w-xs text-sm text-neutral-500">
                Ask about your goals, program, or progress. I&apos;ll loop your coach in on
                anything outside that.
              </p>
            </div>
          )}
          {messages?.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-sm rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === "user" ? "bg-accent-600 text-white" : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.content}
                {m.escalated && (
                  <p className="mt-1 text-xs opacity-70">Your coach has been notified about this.</p>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {error && <p className="px-5 pb-2 text-xs text-accent-700">{error}</p>}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-200/70 p-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-full border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-accent-500"
          />
          <Button type="submit" disabled={sending || !text.trim()} className="!rounded-full !p-3">
            <PaperPlaneRight className="h-4 w-4" weight="fill" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
