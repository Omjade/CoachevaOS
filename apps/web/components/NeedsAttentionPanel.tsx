"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChatCircleIcon as ChatCircle } from "@phosphor-icons/react";
import { api, AttentionItem } from "@/lib/api";
import { Card } from "@/components/ui";

const BUCKET_META: Record<AttentionItem["bucket"], { dot: string; label: string }> = {
  urgent: { dot: "bg-red-500", label: "Urgent" },
  behind: { dot: "bg-orange-500", label: "Falling behind" },
  minor: { dot: "bg-yellow-400", label: "Worth a look" },
};

export default function NeedsAttentionPanel() {
  const params = useParams<{ slug: string }>();
  const [items, setItems] = useState<AttentionItem[] | null>(null);

  useEffect(() => {
    api.getNeedsAttention().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  if (items === null || items.length === 0) return null;

  const groups: AttentionItem["bucket"][] = ["urgent", "behind", "minor"];

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "20ms" }}>
      <h2 className="font-heading mb-3 text-sm font-semibold text-neutral-900">
        {items.length} client{items.length === 1 ? "" : "s"} need{items.length === 1 ? "s" : ""}{" "}
        attention today
      </h2>
      <div className="flex flex-col gap-4">
        {groups.map((bucket) => {
          const bucketItems = items.filter((i) => i.bucket === bucket);
          if (bucketItems.length === 0) return null;
          const meta = BUCKET_META[bucket];
          return (
            <div key={bucket}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <p className="text-xs font-semibold text-neutral-500 uppercase">{meta.label}</p>
              </div>
              <div className="flex flex-col gap-2">
                {bucketItems.map((item) => (
                  <div
                    key={item.client_id}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{item.client_name}</p>
                      <p className="text-xs text-neutral-500">{item.reason}</p>
                      <p className="text-xs text-accent-600">→ {item.suggested_action}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.thread_id && (
                        <Link
                          href={`/${params.slug}/chat/${item.thread_id}`}
                          className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          <ChatCircle className="h-3.5 w-3.5" weight="bold" />
                          Message
                        </Link>
                      )}
                      <Link
                        href={`/${params.slug}/clients/${item.client_id}`}
                        className="rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
