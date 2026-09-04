"use client";

import { useEffect, useState } from "react";
import {
  TargetIcon as Target,
  CheckSquareIcon as CheckSquare,
  CameraIcon as Camera,
  SmileyIcon as Smiley,
  NotebookIcon as Notebook,
  FileTextIcon as FileText,
  ChartLineUpIcon as ChartLineUp,
  ClockCounterClockwiseIcon as ClockCounterClockwise,
  CurrencyDollarIcon as CurrencyDollar,
  WarningIcon as Warning,
} from "@phosphor-icons/react";
import { Timeline, TimelineEvent } from "@/lib/api";
import { Card } from "@/components/ui";

const TYPE_META: Partial<Record<TimelineEvent["type"], { Icon: typeof Target; label: string }>> = {
  goal: { Icon: Target, label: "Goal" },
  task: { Icon: CheckSquare, label: "Task" },
  progress: { Icon: Camera, label: "Progress" },
  checkin: { Icon: Smiley, label: "Check-in" },
  session: { Icon: Notebook, label: "Session" },
  document: { Icon: FileText, label: "Document" },
  metric: { Icon: ChartLineUp, label: "Metric" },
  payment: { Icon: CurrencyDollar, label: "Payment" },
  risk: { Icon: Warning, label: "Risk alert" },
};

const COLLAPSED_COUNT = 6;

export default function TimelineCard({ fetchTimeline }: { fetchTimeline: () => Promise<Timeline> }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTimeline()
      .then(setTimeline)
      .catch(() => setTimeline({ events: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!timeline) return null;

  const visibleEvents = expanded ? timeline.events : timeline.events.slice(0, COLLAPSED_COUNT);
  const hiddenCount = timeline.events.length - visibleEvents.length;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <ClockCounterClockwise className="h-4 w-4 text-accent-600" weight="fill" />
        <h3 className="font-heading text-sm font-semibold text-neutral-900">Timeline</h3>
      </div>
      {timeline.events.length === 0 ? (
        <p className="text-xs text-neutral-500">Nothing logged yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleEvents.map((event, i) => {
            const meta = TYPE_META[event.type] ?? { Icon: ClockCounterClockwise, label: event.type };
            const Icon = meta.Icon;
            return (
              <div key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <Icon className="h-3.5 w-3.5" weight="bold" />
                </span>
                <div className="min-w-0 flex-1 border-b border-neutral-100 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                    <p className="shrink-0 text-xs text-neutral-400">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {meta.label}
                    {event.summary ? `: ${event.summary}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
          {(hiddenCount > 0 || expanded) && timeline.events.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="self-start text-xs font-medium text-accent-600 hover:underline"
            >
              {expanded ? "Show less" : `See ${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
