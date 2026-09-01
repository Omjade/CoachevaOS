"use client";

import { useEffect, useState } from "react";
import {
  PlusIcon as Plus,
  SparkleIcon as Sparkle,
  TrashIcon as Trash,
  PencilSimpleIcon as PencilSimple,
  ArrowUpIcon as ArrowUp,
  ArrowDownIcon as ArrowDown,
  XIcon as X,
} from "@phosphor-icons/react";
import { api, ApiError, CoachForm, ProgramItemInput, ProgramTemplate, ProgramTemplateInput } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";
import Dialog from "@/components/Dialog";
import { NICHES } from "@/lib/niches";
import { useRoleGuard } from "@/lib/useRoleGuard";

const ITEM_KIND_LABEL: Record<string, string> = {
  milestone: "Milestone",
  task: "Task",
  goal: "Goal",
  form: "Form",
};

function emptyTemplate(): ProgramTemplateInput {
  return {
    title: "",
    niche: "",
    duration_weeks: undefined,
    description: "",
    checkin_cadence: "",
    price_amount: undefined,
    price_currency: "USD",
    billing_cadence: "one_time",
    client_selectable: false,
    items: [],
  };
}

export default function ProgramsPage() {
  const ok = useRoleGuard("coach");
  const [templates, setTemplates] = useState<ProgramTemplate[] | null>(null);
  const [forms, setForms] = useState<CoachForm[]>([]);
  const [editing, setEditing] = useState<ProgramTemplate | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.listTemplates().then(setTemplates).catch(() => setTemplates([]));
  }

  useEffect(() => {
    refresh();
    api.listForms().then(setForms).catch(() => {});
  }, []);

  function openNew() {
    setEditing(null);
    setBuilderOpen(true);
  }

  function openEdit(template: ProgramTemplate) {
    setEditing(template);
    setBuilderOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? Clients already assigned to it keep their own copy.")) return;
    setError(null);
    try {
      await api.deleteTemplate(id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete that template. Try again.");
    }
  }

  async function toggleSelectable(template: ProgramTemplate) {
    setError(null);
    setTemplates(
      (prev) =>
        prev?.map((t) => (t.id === template.id ? { ...t, client_selectable: !t.client_selectable } : t)) ??
        prev
    );
    try {
      await api.updateTemplate(template.id, { client_selectable: !template.client_selectable });
    } catch (err) {
      setTemplates(
        (prev) =>
          prev?.map((t) => (t.id === template.id ? { ...t, client_selectable: template.client_selectable } : t)) ??
          prev
      );
      setError(err instanceof ApiError ? err.message : "Couldn't update that template. Try again.");
    }
  }

  if (!ok) return null;

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Programs & packages</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Programs
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Reusable templates you can assign to clients or offer as selectable packages.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" weight="bold" />
          New template
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {templates === null ? null : templates.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No templates yet. Create one to start assigning reusable programs to clients.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-medium text-neutral-900">{t.title}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
                      aria-label="Edit template"
                    >
                      <PencilSimple className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-accent-100 hover:text-accent-600"
                      aria-label="Delete template"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {t.niche && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                      {NICHES.find((n) => n.value === t.niche)?.label ?? t.niche}
                    </span>
                  )}
                  {t.duration_weeks && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                      {t.duration_weeks}-week
                    </span>
                  )}
                  {t.price_amount != null && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                      {t.price_currency ?? ""} {t.price_amount}
                      {t.billing_cadence && t.billing_cadence !== "one_time" ? ` / ${t.billing_cadence}` : ""}
                    </span>
                  )}
                </div>
                {t.description && <p className="mb-3 text-xs text-neutral-500">{t.description}</p>}
                <p className="text-xs text-neutral-500">
                  {t.items.length} item{t.items.length === 1 ? "" : "s"} · assigned to {t.assigned_count}{" "}
                  client{t.assigned_count === 1 ? "" : "s"}
                </p>
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={t.client_selectable}
                  onChange={() => toggleSelectable(t)}
                  className="h-3.5 w-3.5 accent-accent-600"
                />
                Client-selectable
              </label>
            </Card>
          ))}
        </div>
      )}

      <TemplateBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        template={editing}
        forms={forms}
        onSaved={() => {
          setBuilderOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

function TemplateBuilderDialog({
  open,
  onClose,
  template,
  forms,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  template: ProgramTemplate | null;
  forms: CoachForm[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<ProgramTemplateInput>(emptyTemplate());
  const [aiNiche, setAiNiche] = useState("");
  const [aiWeeks, setAiWeeks] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowBuilder(!!template);
    if (template) {
      setDraft({
        title: template.title,
        niche: template.niche ?? "",
        duration_weeks: template.duration_weeks ?? undefined,
        description: template.description ?? "",
        checkin_cadence: template.checkin_cadence ?? "",
        price_amount: template.price_amount ?? undefined,
        price_currency: template.price_currency ?? "USD",
        billing_cadence: template.billing_cadence ?? "one_time",
        client_selectable: template.client_selectable,
        items: template.items.map((i) => ({
          title: i.title,
          description: i.description ?? undefined,
          target_metric: i.target_metric ?? undefined,
          week_number: i.week_number ?? undefined,
          item_kind: i.item_kind,
          linked_form_id: i.linked_form_id ?? undefined,
        })),
      });
    } else {
      setDraft(emptyTemplate());
      setAiNiche("");
      setAiWeeks("");
      setAiHint("");
    }
  }, [open, template]);

  async function handleAiDraft() {
    if (!aiNiche) return;
    setDrafting(true);
    setError(null);
    try {
      const result = await api.getProgramTemplateDraft(
        aiNiche,
        aiWeeks ? Number(aiWeeks) : undefined,
        aiHint
      );
      setDraft({
        ...emptyTemplate(),
        title: result.title,
        niche: aiNiche,
        duration_weeks: aiWeeks ? Number(aiWeeks) : undefined,
        description: result.description ?? "",
        items: result.items.map((i) => ({
          title: i.title,
          description: i.description ?? undefined,
          target_metric: i.target_metric ?? undefined,
          week_number: i.week_number ?? undefined,
          item_kind: i.item_kind,
        })),
      });
      setShowBuilder(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setDrafting(false);
    }
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [...(d.items ?? []), { title: "New item", item_kind: "milestone" }],
    }));
  }

  function updateItem(i: number, patch: Partial<ProgramItemInput>) {
    setDraft((d) => ({
      ...d,
      items: (d.items ?? []).map((item, idx) => (idx === i ? { ...item, ...patch } : item)),
    }));
  }

  function removeItem(i: number) {
    setDraft((d) => ({ ...d, items: (d.items ?? []).filter((_, idx) => idx !== i) }));
  }

  function moveItem(i: number, dir: -1 | 1) {
    setDraft((d) => {
      const items = [...(d.items ?? [])];
      const j = i + dir;
      if (j < 0 || j >= items.length) return d;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, items };
    });
  }

  async function handleSave() {
    if (!draft.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: ProgramTemplateInput = {
        ...draft,
        niche: draft.niche || undefined,
        description: draft.description || undefined,
        checkin_cadence: draft.checkin_cadence || undefined,
        price_currency: draft.price_amount != null ? draft.price_currency || "USD" : undefined,
        billing_cadence: draft.price_amount != null ? draft.billing_cadence || "one_time" : undefined,
      };
      if (template) await api.updateTemplate(template.id, body);
      else await api.createTemplate(body);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={template ? "Edit template" : "New template"}
      widthClassName="max-w-2xl"
    >
      {error && (
        <div className="mb-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {!showBuilder ? (
        <div className="flex flex-col gap-5">
          <Card className="!bg-neutral-50/60">
            <div className="mb-2 flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent-600" weight="fill" />
              <h3 className="font-heading text-sm font-semibold text-neutral-900">Generate with AI</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="ai_niche">Niche</Label>
                <select
                  id="ai_niche"
                  value={aiNiche}
                  onChange={(e) => setAiNiche(e.target.value)}
                  className="w-full rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
                >
                  <option value="">Select…</option>
                  {NICHES.filter((n) => n.value !== "other").map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ai_weeks">Duration (weeks, optional)</Label>
                <Input
                  id="ai_weeks"
                  type="number"
                  min={1}
                  value={aiWeeks}
                  onChange={(e) => setAiWeeks(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ai_hint">Anything specific this should cover? (optional)</Label>
                <textarea
                  id="ai_hint"
                  rows={2}
                  value={aiHint}
                  onChange={(e) => setAiHint(e.target.value)}
                  className="w-full resize-none rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
                />
              </div>
              <Button onClick={handleAiDraft} loading={drafting} disabled={!aiNiche}>
                Draft with AI
              </Button>
            </div>
          </Card>
          <Button variant="ghost" onClick={() => setShowBuilder(true)}>
            Build manually instead
          </Button>
        </div>
      ) : (
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <Label htmlFor="t_title">Title</Label>
            <Input
              id="t_title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t_niche">Niche</Label>
              <select
                id="t_niche"
                value={draft.niche ?? ""}
                onChange={(e) => setDraft({ ...draft, niche: e.target.value })}
                className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
              >
                <option value="">None</option>
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="t_weeks">Duration (weeks)</Label>
              <Input
                id="t_weeks"
                type="number"
                min={1}
                value={draft.duration_weeks ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, duration_weeks: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="t_desc">Description</Label>
            <textarea
              id="t_desc"
              rows={2}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <Label htmlFor="t_cadence">Check-in cadence (informational)</Label>
            <Input
              id="t_cadence"
              placeholder="e.g. Weekly"
              value={draft.checkin_cadence ?? ""}
              onChange={(e) => setDraft({ ...draft, checkin_cadence: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="t_price">Price (optional)</Label>
              <Input
                id="t_price"
                type="number"
                step="0.01"
                value={draft.price_amount ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, price_amount: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
            <div>
              <Label htmlFor="t_currency">Currency</Label>
              <Input
                id="t_currency"
                value={draft.price_currency ?? ""}
                onChange={(e) => setDraft({ ...draft, price_currency: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="t_billing">Billing cadence</Label>
              <select
                id="t_billing"
                value={draft.billing_cadence ?? "one_time"}
                onChange={(e) => setDraft({ ...draft, billing_cadence: e.target.value })}
                className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
              >
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="per_program">Per program</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Pricing shown here is informational only. No charge is created automatically.
          </p>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={draft.client_selectable ?? false}
              onChange={(e) => setDraft({ ...draft, client_selectable: e.target.checked })}
              className="h-3.5 w-3.5 accent-accent-600"
            />
            Let clients select this package themselves
          </label>

          <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
            <Label>Items</Label>
            {(draft.items ?? []).map((item, i) => (
              <div key={i} className="rounded-[10px] bg-neutral-50/60 p-2.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    className="flex-1 bg-transparent text-sm font-medium text-neutral-900 outline-none"
                  />
                  <select
                    value={item.item_kind ?? "milestone"}
                    onChange={(e) => updateItem(i, { item_kind: e.target.value as ProgramItemInput["item_kind"] })}
                    className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 outline-none"
                  >
                    {Object.entries(ITEM_KIND_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Wk"
                    value={item.week_number ?? ""}
                    onChange={(e) =>
                      updateItem(i, { week_number: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="!w-14 !py-1 text-xs"
                  />
                  <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="text-neutral-400 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === (draft.items?.length ?? 0) - 1}
                    className="text-neutral-400 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeItem(i)} className="text-neutral-400 hover:text-accent-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.item_kind === "form" && (
                  <select
                    value={item.linked_form_id ?? ""}
                    onChange={(e) => updateItem(i, { linked_form_id: e.target.value || undefined })}
                    className="w-full rounded-[8px] border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 outline-none"
                  >
                    <option value="">Select a form…</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                )}
                <textarea
                  value={item.description ?? ""}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  rows={1}
                  placeholder="Description (optional)"
                  className="mt-1.5 w-full resize-none bg-transparent text-xs text-neutral-600 outline-none"
                />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem} className="self-start">
              <Plus className="h-3.5 w-3.5" weight="bold" />
              Add item
            </Button>
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!draft.title.trim()}>
              Save template
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
