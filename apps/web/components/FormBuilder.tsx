"use client";

import { useState } from "react";
import {
  TextAaIcon as TextAa,
  ParagraphIcon as Paragraph,
  EnvelopeSimpleIcon as EnvelopeSimple,
  PhoneIcon as Phone,
  HashIcon as Hash,
  CalendarBlankIcon as CalendarBlank,
  ListChecksIcon as ListChecks,
  CircleIcon as Circle,
  CheckSquareIcon as CheckSquare,
  ShieldCheckIcon as ShieldCheck,
  PlusIcon as Plus,
  TrashIcon as Trash,
  ArrowUpIcon as ArrowUp,
  ArrowDownIcon as ArrowDown,
  XIcon as X,
} from "@phosphor-icons/react";
import { FormField, FormFieldType } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";

const FIELD_TYPES: { type: FormFieldType; label: string; Icon: typeof TextAa; hasOptions: boolean }[] = [
  { type: "text", label: "Short text", Icon: TextAa, hasOptions: false },
  { type: "textarea", label: "Long text", Icon: Paragraph, hasOptions: false },
  { type: "email", label: "Email", Icon: EnvelopeSimple, hasOptions: false },
  { type: "phone", label: "Phone", Icon: Phone, hasOptions: false },
  { type: "number", label: "Number", Icon: Hash, hasOptions: false },
  { type: "date", label: "Date", Icon: CalendarBlank, hasOptions: false },
  { type: "select", label: "Dropdown", Icon: ListChecks, hasOptions: true },
  { type: "radio", label: "Single choice", Icon: Circle, hasOptions: true },
  { type: "checkbox", label: "Multiple choice", Icon: CheckSquare, hasOptions: true },
  { type: "consent", label: "Agreement checkbox", Icon: ShieldCheck, hasOptions: false },
];

function fieldMeta(type: FormFieldType) {
  return FIELD_TYPES.find((f) => f.type === type) ?? FIELD_TYPES[0];
}

function newFieldId() {
  return Math.random().toString(36).slice(2, 10);
}

export function FormBuilder({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  fields,
  onFieldsChange,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function addField(type: FormFieldType) {
    const meta = fieldMeta(type);
    const field: FormField = {
      id: newFieldId(),
      type,
      label: meta.label,
      required: false,
      options: meta.hasOptions ? ["Option 1", "Option 2"] : undefined,
    };
    onFieldsChange([...fields, field]);
    setPickerOpen(false);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    onFieldsChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    onFieldsChange(fields.filter((f) => f.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const i = fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onFieldsChange(next);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="form_title">Form title</Label>
              <Input id="form_title" value={title} onChange={(e) => onTitleChange(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="form_description">Description (optional)</Label>
              <textarea
                id="form_description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={2}
                placeholder="A line explaining what this form is for"
                className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          {fields.map((field, i) => {
            const meta = fieldMeta(field.type);
            return (
              <Card key={field.id} className="!p-4">
                <div className="mb-3 flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                    <meta.Icon className="h-4 w-4" weight="bold" />
                  </span>
                  <div className="flex-1">
                    <input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="w-full border-b border-transparent bg-transparent text-sm font-medium text-neutral-900 outline-none focus:border-accent-500"
                    />
                    <p className="mt-0.5 text-xs text-neutral-500">{meta.label}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(field.id, -1)}
                      disabled={i === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(field.id, 1)}
                      disabled={i === fields.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-accent-100 hover:text-accent-600"
                      aria-label="Remove field"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {meta.hasOptions && (
                  <div className="mb-3 flex flex-col gap-2 pl-11">
                    {(field.options ?? []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={(e) => {
                            const next = [...(field.options ?? [])];
                            next[oi] = e.target.value;
                            updateField(field.id, { options: next });
                          }}
                          className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-2.5 py-1.5 text-xs outline-none focus:border-accent-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateField(field.id, {
                              options: (field.options ?? []).filter((_, x) => x !== oi),
                            })
                          }
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
                          aria-label="Remove option"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateField(field.id, {
                          options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`],
                        })
                      }
                      className="self-start text-xs font-medium text-accent-600 hover:text-accent-700"
                    >
                      + Add option
                    </button>
                  </div>
                )}

                <label className="ml-11 flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="h-3.5 w-3.5 accent-accent-600"
                  />
                  Required
                </label>
              </Card>
            );
          })}

          <div className="relative">
            <Button type="button" variant="secondary" onClick={() => setPickerOpen((v) => !v)}>
              <Plus className="h-4 w-4" weight="bold" />
              Add field
            </Button>
            {pickerOpen && (
              <div className="absolute top-full left-0 z-20 mt-2 grid w-72 grid-cols-2 gap-1 rounded-[16px] border border-neutral-200 bg-white p-2 shadow-[0_20px_44px_rgba(28,29,31,0.14)]">
                {FIELD_TYPES.map(({ type, label, Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type)}
                    className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    <Icon className="h-4 w-4 text-neutral-500" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-semibold text-neutral-500 uppercase">Live preview</p>
        <Card className="!bg-neutral-50/60">
          <h3 className="font-heading mb-1 text-lg font-semibold text-neutral-900">
            {title || "Untitled form"}
          </h3>
          {description && <p className="mb-5 text-sm text-neutral-600">{description}</p>}
          <div className="flex flex-col gap-4">
            {fields.length === 0 && (
              <p className="text-sm text-neutral-400">Add a field to see it here.</p>
            )}
            {fields.map((field) => (
              <div key={field.id}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-accent-600"> *</span>}
                </Label>
                <FieldPreview field={field} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  const base =
    "w-full rounded-[12px] border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-400 outline-none";
  if (field.type === "textarea") {
    return <textarea disabled rows={3} placeholder="Client's answer" className={base} />;
  }
  if (field.type === "select") {
    return (
      <select disabled className={base}>
        <option>Select…</option>
        {(field.options ?? []).map((o, i) => (
          <option key={i}>{o}</option>
        ))}
      </select>
    );
  }
  if (field.type === "radio" || field.type === "checkbox") {
    return (
      <div className="flex flex-col gap-1.5 pt-1">
        {(field.options ?? []).map((o, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-neutral-500">
            <input type={field.type === "radio" ? "radio" : "checkbox"} disabled />
            {o}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "consent") {
    return (
      <label className="flex items-center gap-2 text-sm text-neutral-500">
        <input type="checkbox" disabled />
        {field.placeholder || "I agree"}
      </label>
    );
  }
  return (
    <input
      disabled
      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
      placeholder="Client's answer"
      className={base}
    />
  );
}
