"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon as Bell } from "@phosphor-icons/react";
import { api, NotificationData } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  meeting_soon: "Meeting soon",
  task_due: "Task due",
  subscription_expiring: "Subscription expiring",
  unread_message: "Unread message",
  lead_followup: "Lead follow-up",
  invoice_overdue: "Invoice overdue",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function refresh() {
    api.listNotifications().then(setNotifications).catch(() => {});
  }

  useEffect(refresh, []);

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

  async function handleItemClick(n: NotificationData) {
    if (!n.read_at) {
      await api.markNotificationRead(n.id);
      refresh();
    }
  }

  async function handleMarkAll() {
    await api.markAllNotificationsRead();
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
          <div className="max-h-80 overflow-y-auto">
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
