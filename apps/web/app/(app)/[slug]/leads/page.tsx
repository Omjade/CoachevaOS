"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { Button, Eyebrow, Input, Label } from "@/components/ui";
import Dialog from "@/components/Dialog";
import { useRoleGuard } from "@/lib/useRoleGuard";

// @dnd-kit is only needed for the board view — dynamically imported so its JS
// doesn't ship on every visit to this page (the list view doesn't need it at all).
const LeadsBoard = dynamic(() => import("@/components/LeadsBoard"), { ssr: false });

const STAGES: { key: LeadStage; label: string; borderClass: string }[] = [
  { key: "new", label: "New", borderClass: "border-t-neutral-300" },
  { key: "contacted", label: "Contacted", borderClass: "border-t-accent-200" },
  { key: "follow_up", label: "Follow Up", borderClass: "border-t-accent-400" },
  { key: "booked", label: "Booked", borderClass: "border-t-accent-600" },
  { key: "lost", label: "Lost", borderClass: "border-t-neutral-200" },
];

const STALE_DAYS = 7;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  website: "Website",
  referral: "Referral",
  other: "Other",
  form: "Form",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? (source.charAt(0).toUpperCase() + source.slice(1));
}

// Simple relevance score, not a search-library dependency — exact/prefix
// matches on name rank above a substring match, which in turn ranks above a
// match on a secondary field. 0 means "doesn't match at all" (filtered out).
function leadMatchScore(lead: Lead, q: string): number {
  const name = lead.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (lead.email?.toLowerCase().includes(q)) return 40;
  if (lead.phone?.toLowerCase().includes(q)) return 40;
  if (lead.interested_in?.toLowerCase().includes(q)) return 30;
  if (lead.notes?.toLowerCase().includes(q)) return 20;
  return 0;
}

// Wraps the first matching substring in an accent-highlighted <mark> —
// case-insensitive, leaves the text untouched when there's no query or no
// match.
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-accent-200 px-0.5 text-inherit">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

type SortKey = "name" | "stage" | "days";

function LeadsTable({
  leads,
  onMoveStage,
  onConvert,
  converting,
  onView,
  query,
}: {
  leads: Lead[];
  onMoveStage: (lead: Lead, stage: LeadStage) => void;
  onConvert: (lead: Lead) => void;
  converting: string | null;
  onView: (lead: Lead) => void;
  query: string;
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
      lost: 5,
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
                      <p className="truncate font-medium text-neutral-900">
                        <HighlightMatch text={lead.name} query={query} />
                      </p>
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
                    <span className="text-xs text-neutral-400">{sourceLabel(lead.source)}</span>
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
                      size="sm"
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
  const ok = useRoleGuard("coach");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");
  const [convertedToast, setConvertedToast] = useState<{ leadId: string; name: string } | null>(
    null
  );
  const [restoring, setRestoring] = useState(false);

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
        source: source || undefined,
      });
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setInterestedIn("");
      setNotes("");
      setSource("");
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
      setConvertedToast({ leadId: lead.id, name: lead.name });
      setTimeout(() => setConvertedToast((t) => (t?.leadId === lead.id ? null : t)), 8000);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't convert this lead");
    } finally {
      setConverting(null);
    }
  }

  async function undoConvert(leadId: string) {
    setRestoring(true);
    try {
      await api.restoreLead(leadId);
      setConvertedToast(null);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't undo. Try again.");
    } finally {
      setRestoring(false);
    }
  }

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads
      .map((l) => ({ lead: l, score: leadMatchScore(l, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.lead);
  }, [leads, query]);

  if (!ok) return null;

  return (
    <div className="animate-fade-up">
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

      {leads !== null && leads.length === 0 && (
        <div className="mb-5 rounded-[14px] border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm text-neutral-600">
          No leads yet. Add one manually, share a lead-capture form, or import a spreadsheet of
          existing contacts from the Clients page.
        </div>
      )}

      {view === "board" ? (
        <LeadsBoard
          leads={filtered}
          onMoveStage={moveStage}
          onConvert={convert}
          converting={converting}
          onView={setViewingLead}
        />
      ) : (
        <LeadsTable
          leads={filtered}
          onMoveStage={moveStage}
          onConvert={convert}
          converting={converting}
          onView={setViewingLead}
          query={query}
        />
      )}

      {convertedToast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-900 px-4 py-2.5 text-sm text-white shadow-lg">
          <span>
            Moved <span className="font-medium">{convertedToast.name}</span> to Clients
          </span>
          <button
            type="button"
            onClick={() => undoConvert(convertedToast.leadId)}
            disabled={restoring}
            className="font-semibold text-accent-300 hover:text-accent-200 disabled:opacity-50"
          >
            {restoring ? "Undoing…" : "Undo"}
          </button>
        </div>
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
          <div>
            <Label htmlFor="l_source">How did they find you?</Label>
            <select
              id="l_source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
            >
              <option value="manual">Not specified</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
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
        title={viewingLead ? `${viewingLead.name}: form submission` : "Submission"}
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
