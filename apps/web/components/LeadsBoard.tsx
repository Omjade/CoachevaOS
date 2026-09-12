"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  NotePencilIcon as NotePencil,
  PhoneIcon as Phone,
  EnvelopeSimpleIcon as EnvelopeSimple,
  ClockIcon as Clock,
  WarningIcon as Warning,
} from "@phosphor-icons/react";
import { Lead, LeadStage } from "@/lib/api";
import { Button, Card } from "@/components/ui";

export const STAGES: { key: LeadStage; label: string; borderClass: string }[] = [
  { key: "new", label: "New", borderClass: "border-t-neutral-300" },
  { key: "contacted", label: "Contacted", borderClass: "border-t-accent-200" },
  { key: "follow_up", label: "Follow Up", borderClass: "border-t-accent-400" },
  { key: "booked", label: "Booked", borderClass: "border-t-accent-600" },
  // A holding shelf for a cold/dead-looking lead — deliberately muted, not
  // part of the coral pipeline-progression gradient the 4 active stages use,
  // since it isn't a step forward. Dragging a lead back out of it works
  // exactly like moving between any other two stages.
  { key: "lost", label: "Lost", borderClass: "border-t-neutral-200" },
];

const STALE_DAYS = 7;

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function LeadCard({
  lead,
  onConvert,
  converting,
  onView,
  dragging,
}: {
  lead: Lead;
  onConvert: (lead: Lead) => void;
  converting: boolean;
  onView: (lead: Lead) => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const days = daysSince(lead.last_contacted_at ?? lead.created_at);
  const stale = days >= STALE_DAYS;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`touch-none ${isDragging ? "" : "animate-fade-up"}`}
    >
      <Card
        className={`!p-4 !shadow-[0_10px_20px_rgba(28,29,31,0.05)] ${
          dragging ? "" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="mb-2 flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-neutral-900">{lead.name}</p>
            {lead.interested_in && (
              <p className="truncate text-xs text-neutral-500">{lead.interested_in}</p>
            )}
          </div>
          {lead.source === "form" && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700">
              <NotePencil className="h-2.5 w-2.5" weight="bold" />
              Form
            </span>
          )}
        </div>

        {(lead.phone || lead.email) && (
          <div className="mb-2 flex items-center gap-3">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-accent-600"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-accent-600"
              >
                <EnvelopeSimple className="h-3 w-3" />
                Email
              </a>
            )}
          </div>
        )}

        {lead.notes && <p className="mb-2 line-clamp-2 text-xs text-neutral-500">{lead.notes}</p>}

        {lead.form_submission_id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(lead);
            }}
            className="mb-2 text-xs font-medium text-accent-600 hover:text-accent-700"
          >
            View full submission
          </button>
        )}

        <div className="flex items-center justify-between gap-2">
          <span
            className={`flex items-center gap-1 text-[11px] ${
              stale ? "font-medium text-accent-600" : "text-neutral-400"
            }`}
          >
            {stale ? <Warning className="h-3 w-3" weight="fill" /> : <Clock className="h-3 w-3" />}
            {days === 0 ? "Today" : `${days}d in stage`}
          </span>
          {lead.stage === "booked" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
              disabled={converting}
            >
              {converting ? "Converting…" : "Convert"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function StageColumn({
  stage,
  leads,
  ...cardProps
}: {
  stage: (typeof STAGES)[number];
  leads: Lead[];
  onConvert: (lead: Lead) => void;
  converting: string | null;
  onView: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div>
      <div
        className={`mb-3 flex items-center justify-between border-t-2 pt-2 pb-1 ${stage.borderClass}`}
      >
        <h2 className="text-sm font-semibold text-neutral-900">{stage.label}</h2>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-col gap-3 rounded-[16px] p-1 transition-colors ${
          isOver ? "bg-accent-100/60" : ""
        }`}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onConvert={cardProps.onConvert}
            converting={cardProps.converting === lead.id}
            onView={cardProps.onView}
          />
        ))}
      </div>
    </div>
  );
}

export default function LeadsBoard({
  leads,
  onMoveStage,
  onConvert,
  converting,
  onView,
}: {
  leads: Lead[];
  onMoveStage: (lead: Lead, stage: LeadStage) => void;
  onConvert: (lead: Lead) => void;
  converting: string | null;
  onView: (lead: Lead) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;
    onMoveStage(lead, over.id as LeadStage);
  }

  const byStage = (stage: LeadStage) => leads.filter((l) => l.stage === stage);
  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage.key}
            stage={stage}
            leads={byStage(stage.key)}
            onConvert={onConvert}
            converting={converting}
            onView={onView}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && (
          <div className="w-64 rotate-2">
            <LeadCard
              lead={activeLead}
              onConvert={() => {}}
              converting={false}
              onView={() => {}}
              dragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
