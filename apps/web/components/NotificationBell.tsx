"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BellIcon as Bell } from "@phosphor-icons/react";
import { api, NotificationData } from "@/lib/api";
import { useChatSocket } from "@/lib/useChatSocket";
import { useViewerRole } from "@/lib/useViewerRole";

const TYPE_LABEL: Record<string, string> = {
  meeting_soon: "Meeting soon",
  task_due: "Task due",
  subscription_expiring: "Subscription expiring",
  unread_message: "Unread message",
  new_message: "New message",
  form_submitted: "New form submission",
  lead_followup: "Lead follow-up",
  new_lead: "New lead",
  invoice_overdue: "Invoice overdue",
  client_onboarded: "Client onboarded",
  package_selected: "Package selected",
  ai_assistant_escalation: "Escalated question",
  trial_reminder: "Trial reminder",
  client_cap_exceeded: "Plan limit reached",
  client_subscription_lapsed: "Subscription lapsed",
};

// Every notification type that carries enough context to know where it's
// "about" gets a real link — clicking it should land on the specific
// client/thread/form/lead it concerns, not just mark it read and sit there.
function buildHref(
  n: NotificationData,
  slug: string,
  role: "coach" | "client" | "anonymous" | null
): string | null {
  const p = n.payload_json;
  switch (n.type) {
    case "meeting_soon":
    case "task_due":
    case "subscription_expiring":
    case "invoice_overdue":
    case "client_onboarded":
    case "package_selected":
    case "ai_assistant_escalation":
    case "client_subscription_lapsed":
      return p.client_id ? `/${slug}/clients/${p.client_id}` : null;
    case "unread_message":
      return p.thread_id ? `/${slug}/chat/${p.thread_id}` : `/${slug}/chat`;
    case "new_message":
      if (role === "coach") return p.thread_id ? `/${slug}/chat/${p.thread_id}` : `/${slug}/chat`;
      return `/${slug}/messages`;
    case "lead_followup":
    case "new_lead":
      return `/${slug}/leads`;
    case "form_submitted":
      return p.form_id ? `/${slug}/forms/${p.form_id}/submissions` : `/${slug}/forms`;
    case "trial_reminder":
    case "client_cap_exceeded":
      return `/${slug}/billing`;
    default:
      return null;
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const role = useViewerRole();

  function refresh() {
    api.listNotifications().then(setNotifications).catch(() => {});
  }

  useEffect(() => {
    refresh();
    // Kept as a fallback for any missed WebSocket event (e.g. a connection
    // drop between reconnect attempts) — the socket below is what makes
    // this feel instant in the common case.
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  // A new chat message also creates a "new_message" Notification row
  // server-side (threads.py's _create_and_broadcast), so a "message" event
  // is just as much a signal to refresh as the dedicated "notification"
  // event other notification types broadcast.
  useChatSocket({
    onMessage: () => refresh(),
    onNotification: () => refresh(),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function handleOpen() {
    setOpen((v) => !v);
  }

  function handleItemClick(n: NotificationData) {
    setOpen(false);
    const href = buildHref(n, params.slug, role);
    if (href) router.push(href);
    if (!n.read_at) {
      // Navigate first, mark-read in the background — clicking a
      // notification shouldn't wait on two sequential network round-trips
      // before it moves. Low-stakes action: on failure it just stays
      // unread, so this silently no-ops rather than surfacing an error UI.
      api
        .markNotificationRead(n.id)
        .then(refresh)
        .catch(() => {});
    }
  }

  async function handleMarkAll() {
    await api.markAllNotificationsRead().catch(() => {});
    refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200/60"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[10px] text-neutral-100">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-(--radius-md) border border-divider bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-accent-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="scrollbar-thin-light max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-600">
                Nothing to see here.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`block w-full border-b border-divider px-4 py-3 text-left text-sm last:border-b-0 hover:bg-neutral-100/60 ${
                    n.read_at ? "text-neutral-600" : "font-medium text-text"
                  }`}
                >
                  <p className="mb-0.5 text-xs text-accent-700 uppercase tracking-wide">
                    {TYPE_LABEL[n.type] ?? n.type}
                  </p>
                  <p>{n.payload_json.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
