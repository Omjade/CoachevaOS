"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PaperclipIcon as Paperclip,
  SparkleIcon as Sparkle,
  PaperPlaneRightIcon as PaperPlaneRight,
  CalendarBlankIcon as CalendarBlank,
  FileTextIcon as FileText,
  MicrophoneIcon as Microphone,
} from "@phosphor-icons/react";
import { api, API_URL, ApiError, MessageData } from "@/lib/api";
import { useChatSocket } from "@/lib/useChatSocket";
import { Button, Input } from "@/components/ui";
import Avatar from "@/components/Avatar";
import MediaLightbox, { LightboxMedia } from "@/components/MediaLightbox";

const MEDIA_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  voice: Microphone,
};

function formatPresence(online: boolean, lastSeenAt: string | null): string {
  if (online) return "Online";
  if (!lastSeenAt) return "";
  const date = new Date(lastSeenAt);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? `Last seen ${time}` : `Last seen ${date.toLocaleDateString()}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function otherLocalTime(timezone: string | undefined): string | null {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date());
  } catch {
    return null;
  }
}

export default function ChatThread({
  threadId,
  meId,
  otherName,
  otherTimezone,
  showSuggestReply = false,
}: {
  threadId: string;
  meId: string;
  otherName: string;
  otherTimezone?: string;
  showSuggestReply?: boolean;
}) {
  const params = useParams<{ slug: string }>();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [text, setText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);
  // Tracks the optimistic local message waiting to be reconciled with the
  // real one, whichever arrives first — the POST response or the websocket
  // echo — so the send never has to wait for a round-trip to appear.
  const pendingTempIdRef = useRef<string | null>(null);

  function refresh() {
    api.listMessages(threadId).then(setMessages).catch(() => {});
  }

  useEffect(() => {
    // Switching threads (no remount, per the fix in ChatInbox.tsx) — reset
    // per-thread local state explicitly so an unsent draft or a stale error
    // for the previous conversation doesn't carry over into this one.
    setText("");
    setSendError(null);
    setTyping(false);
    setMessages([]);
    pendingTempIdRef.current = null;
    refresh();
    api
      .getThreadPresence(threadId)
      .then((p) => {
        setOtherId(p.user_id);
        setOnline(p.online);
        setLastSeenAt(p.last_seen_at);
      })
      .catch(() => {});
    api.markThreadRead(threadId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const { state: socketState, send } = useChatSocket({
    onMessage: (message) => {
      if (message.thread_id !== threadId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const tempId = message.sender_id === meId ? pendingTempIdRef.current : null;
        const withoutTemp = tempId ? prev.filter((m) => m.id !== tempId) : prev;
        return [...withoutTemp, message];
      });
      if (message.sender_id === meId) pendingTempIdRef.current = null;
      if (message.sender_id !== meId) {
        api.markThreadRead(threadId).catch(() => {});
      }
    },
    onPresence: (event) => {
      if (event.user_id !== otherId) return;
      setOnline(event.online);
      if (!event.online && event.last_seen_at) setLastSeenAt(event.last_seen_at);
    },
    onTyping: (event) => {
      if (event.thread_id !== threadId) return;
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
    },
    onReconnect: refresh,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function handleTyping() {
    if (typingSentRef.current) return;
    typingSentRef.current = true;
    send({ event: "typing", thread_id: threadId });
    setTimeout(() => {
      typingSentRef.current = false;
    }, 2000);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    setSendError(null);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingTempIdRef.current = tempId;
    const optimistic: MessageData = {
      id: tempId,
      thread_id: threadId,
      sender_id: meId,
      type: "text",
      body,
      media_url: null,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const message = await api.sendMessage(threadId, body);
      if (pendingTempIdRef.current === tempId) pendingTempIdRef.current = null;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === message.id) ? withoutTemp : [...withoutTemp, message];
      });
    } catch (err) {
      if (pendingTempIdRef.current === tempId) pendingTempIdRef.current = null;
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      // Restore what they typed — a failed send shouldn't silently lose it.
      setText(body);
      setSendError(err instanceof ApiError ? err.message : "Couldn't send. Try again.");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSendError(null);
    try {
      const message = await api.sendMediaMessage(threadId, file);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Couldn't send that file. Try again.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSuggestReply() {
    setSuggesting(true);
    try {
      const { draft } = await api.suggestReply(threadId);
      if (draft) setText(draft);
    } catch (err) {
      if (err instanceof ApiError) console.error(err.message);
    } finally {
      setSuggesting(false);
    }
  }

  const mediaBaseUrl = API_URL;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {otherId ? (
              <Avatar userId={otherId} name={otherName} className="h-10 w-10 text-sm" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {otherName.charAt(0).toUpperCase()}
              </div>
            )}
            {online && (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">{otherName}</p>
            <p className="text-xs text-neutral-500">
              {typing ? "Typing…" : formatPresence(online, lastSeenAt)}
              {otherLocalTime(otherTimezone) && (
                <> · {otherLocalTime(otherTimezone)} their time</>
              )}
            </p>
          </div>
        </div>
        {params?.slug && (
          <Link
            href={`/${params.slug}/calendar`}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <CalendarBlank className="h-3.5 w-3.5" />
            Book a session
          </Link>
        )}
      </div>

      {socketState !== "open" && (
        <div className="bg-neutral-100 px-4 py-1.5 text-center text-xs text-neutral-500">
          Reconnecting…
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          const pending = m.id.startsWith("temp-");
          const Icon = MEDIA_ICON[m.type];
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-sm transition-opacity ${
                  mine ? "bg-accent-600 text-white" : "bg-neutral-100 text-neutral-900"
                } ${pending ? "opacity-60" : ""}`}
              >
                {m.type === "text" && <p>{m.body}</p>}

                {m.type === "image" && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMedia({
                        url: `${mediaBaseUrl}/threads/messages/${m.id}/media`,
                        type: "image",
                        caption: m.body,
                      })
                    }
                    className="block cursor-zoom-in"
                  >
                    <img
                      src={`${mediaBaseUrl}/threads/messages/${m.id}/media`}
                      alt={m.body ?? "Image"}
                      className="max-h-64 rounded-lg"
                    />
                  </button>
                )}

                {m.type === "video" && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMedia({
                        url: `${mediaBaseUrl}/threads/messages/${m.id}/media`,
                        type: "video",
                        caption: m.body,
                      })
                    }
                    className="relative block cursor-zoom-in"
                  >
                    <video
                      src={`${mediaBaseUrl}/threads/messages/${m.id}/media`}
                      className="pointer-events-none max-h-64 rounded-lg"
                    />
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900">
                        ▶
                      </span>
                    </span>
                  </button>
                )}

                {(m.type === "pdf" || m.type === "voice") && Icon && (
                  <a
                    href={`${mediaBaseUrl}/threads/messages/${m.id}/media`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 underline ${mine ? "text-white" : "text-neutral-900"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {m.body ?? "Attachment"}
                  </a>
                )}

                <p className={`mt-1 text-right text-[10px] ${mine ? "text-white/70" : "text-neutral-400"}`}>
                  {pending ? "Sending…" : formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="border-t border-neutral-200/70 px-3 pt-2 text-xs text-accent-600">{sendError}</p>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-200/70 p-3">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} id="chat-attach" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          aria-label="Attach file"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>
        {showSuggestReply && (
          <button
            type="button"
            onClick={handleSuggestReply}
            disabled={suggesting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent-600 hover:bg-accent-100 disabled:opacity-50"
            aria-label="Suggest reply"
          >
            <Sparkle className={`h-4.5 w-4.5 ${suggesting ? "animate-spin-slow" : ""}`} weight="fill" />
          </button>
        )}
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" className="!h-9 !w-9 !rounded-full !p-0" aria-label="Send">
          <PaperPlaneRight className="h-4 w-4" weight="fill" />
        </Button>
      </form>

      <MediaLightbox media={lightboxMedia} onClose={() => setLightboxMedia(null)} />
    </div>
  );
}
