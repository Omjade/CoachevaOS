"use client";

import { useEffect, useMemo, useState } from "react";
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
  UserPlusIcon as UserPlus,
  NotePencilIcon as NotePencil,
  MagnifyingGlassIcon as MagnifyingGlass,
  PhoneIcon as Phone,
  EnvelopeSimpleIcon as EnvelopeSimple,
  ClockIcon as Clock,
  WarningIcon as Warning,
  SquaresFourIcon as SquaresFour,
  ListIcon as ListView,
  CaretDownIcon as CaretDown,
  CaretUpDownIcon as CaretUpDown,
} from "@phosphor-icons/react";
import { api, ApiError, Lead, LeadStage } from "@/lib/api";
import { Button, Card, Eyebrow, Input, Label } from "@/components/ui";
import Dialog from "@/components/Dialog";

const STAGES: { key: LeadStage; label: string; borderClass: string }[] = [
  { key: "new", label: "New", borderClass: "border-t-neutral-300" },
  { key: "contacted", label: "Contacted", borderClass: "border-t-accent-200" },
  { key: "follow_up", label: "Follow Up", borderClass: "border-t-accent-400" },
  { key: "booked", label: "Booked", borderClass: "border-t-accent-600" },
];

const STALE_DAYS = 7;

function daysSince(iso: string): number {
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
      className="touch-none"
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
              className="!px-2.5 !py-1 text-xs"
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

type SortKey = "name" | "stage" | "days";

function LeadsTable({
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
  const [sortKey, setSortKey] = useState<SortKey>("days");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = useMemo(() => {
    const stageOrder: Record<LeadStage, number> = {
      new: 0,
      contacted: 1,
      follow_up: 2,
      booked: 3,
      converted: 4,
    };
    const withDays = leads.map((l) => ({
      lead: l,
      days: daysSince(l.last_contacted_at ?? l.created_at),
    }));
    withDays.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.lead.name.localeCompare(b.lead.name);
      else if (sortKey === "stage") cmp = stageOrder[a.lead.stage] - stageOrder[b.lead.stage];
      else cmp = a.days - b.days;
      return sortAsc ? cmp : -cmp;
    });
    return withDays;
  }, [leads, sortKey, sortAsc]);

  const headerBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-700"
    >
      {label}
      <CaretUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="overflow-x-auto rounded-[16px] border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/60">
            <th className="px-4 py-3">{headerBtn("name", "Name")}</th>
            <th className="px-4 py-3">{headerBtn("stage", "Stage")}</th>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Source</th>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Contact</th>
            <th className="px-4 py-3">{headerBtn("days", "Days in stage")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ lead, days }) => {
            const stale = days >= STALE_DAYS;
            const stageMeta = STAGES.find((s) => s.key === lead.stage);
            return (
              <tr key={lead.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">{lead.name}</p>
                      {lead.interested_in && (
                        <p className="truncate text-xs text-neutral-500">{lead.interested_in}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <select
                      value={lead.stage}
                      onChange={(e) => onMoveStage(lead, e.target.value as LeadStage)}
                      className="appearance-none rounded-full border border-neutral-200 bg-neutral-50/60 py-1 pr-6 pl-2.5 text-xs text-neutral-700 outline-none focus:border-accent-500"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <CaretDown className="pointer-events-none absolute top-1/2 right-2 h-2.5 w-2.5 -translate-y-1/2 text-neutral-400" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  {lead.source === "form" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700">
                      <NotePencil className="h-2.5 w-2.5" weight="bold" />
                      Form
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Manual</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="text-neutral-500 hover:text-accent-600">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-neutral-500 hover:text-accent-600"
                      >
                        <EnvelopeSimple className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      stale ? "font-medium text-accent-600" : "text-neutral-500"
                    }`}
                  >
                    {stale ? (
                      <Warning className="h-3 w-3" weight="fill" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {days === 0 ? "Today" : `${days}d`}
                    {stageMeta && lead.form_submission_id && (
                      <button
                        type="button"
                        onClick={() => onView(lead)}
                        className="ml-2 font-medium text-accent-600 hover:text-accent-700"
                      >
                        View
                      </button>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {lead.stage === "booked" && (
                    <Button
                      variant="secondary"
                      className="!px-2.5 !py-1 text-xs"
                      onClick={() => onConvert(lead)}
                      disabled={converting === lead.id}
                    >
                      {converting === lead.id ? "Converting…" : "Convert"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="p-6 text-center text-sm text-neutral-500">No leads match your search.</p>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function refresh() {
    api.listLeads().then(setLeads).catch(() => setLeads([]));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createLead({
        name,
        email: email || undefined,
        phone: phone || undefined,
        interested_in: interestedIn || undefined,
        notes: notes || undefined,
      });
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setInterestedIn("");
      setNotes("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function moveStage(lead: Lead, stage: LeadStage) {
    if (lead.stage === stage) return;
    setLeads((prev) => prev?.map((l) => (l.id === lead.id ? { ...l, stage } : l)) ?? prev);
    try {
      await api.updateLeadStage(lead.id, stage);
    } catch {
      refresh();
    }
  }

  async function convert(lead: Lead) {
    setConverting(lead.id);
    try {
      await api.convertLead(lead.id);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't convert this lead");
    } finally {
      setConverting(null);
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const lead = leads?.find((l) => l.id === active.id);
    if (!lead) return;
    moveStage(lead, over.id as LeadStage);
  }

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) => l.name.toLowerCase().includes(q) || l.interested_in?.toLowerCase().includes(q)
    );
  }, [leads, query]);

  const byStage = (stage: LeadStage) => filtered.filter((l) => l.stage === stage);
  const activeLead = leads?.find((l) => l.id === activeId) ?? null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow className="mb-2">Pipeline</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Leads
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-neutral-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "board" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <SquaresFour className="h-3.5 w-3.5" weight={view === "board" ? "fill" : "regular"} />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <ListView className="h-3.5 w-3.5" weight={view === "list" ? "fill" : "regular"} />
              List
            </button>
          </div>
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads…"
              className="w-48 rounded-full border border-neutral-200 bg-white py-2 pr-3 pl-8 text-xs outline-none focus:border-accent-500"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" weight="bold" />
            Add lead
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <StageColumn
                key={stage.key}
                stage={stage}
                leads={byStage(stage.key)}
                onConvert={convert}
                converting={converting}
                onView={setViewingLead}
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
      ) : (
        <LeadsTable
          leads={filtered}
          onMoveStage={moveStage}
          onConvert={convert}
          converting={converting}
          onView={setViewingLead}
        />
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add lead">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="l_name">Name</Label>
            <Input id="l_name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="l_email">Email</Label>
            <Input
              id="l_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="l_phone">Phone</Label>
            <Input id="l_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="l_interest">Interested in</Label>
            <Input
              id="l_interest"
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="l_notes">Notes</Label>
            <Input id="l_notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-accent-700">{error}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add lead"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={viewingLead !== null}
        onClose={() => setViewingLead(null)}
        title={viewingLead ? `${viewingLead.name} — form submission` : "Submission"}
      >
        <div className="flex flex-col gap-2.5">
          {viewingLead?.notes?.split("\n").map((line, i) => {
            const [label, ...rest] = line.split(": ");
            return (
              <p key={i} className="text-sm">
                <span className="text-neutral-500">{label}: </span>
                <span className="text-neutral-900">{rest.join(": ")}</span>
              </p>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
