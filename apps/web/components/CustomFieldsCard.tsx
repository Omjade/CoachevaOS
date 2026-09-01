"use client";

import { useEffect, useState } from "react";
import { ListChecksIcon as ListChecks } from "@phosphor-icons/react";
import { ClientCustomFields, ClientFieldValue, CustomFieldDefinition } from "@/lib/api";
import { Card, Input, Label } from "@/components/ui";

function FieldInput({
  definition,
  value,
  onChange,
}: {
  definition: CustomFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
}) {
  switch (definition.field_type) {
    case "textarea":
      return (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
        />
      );
    case "number":
    case "currency":
    case "percentage":
    case "rating":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "date":
      return <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      );
    case "dropdown":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
        >
          <option value="">—</option>
          {(definition.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "multi_select": {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {(definition.options ?? []).map((o) => {
            const active = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() =>
                  onChange(active ? selected.filter((s) => s !== o) : [...selected, o])
                }
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

function displayValue(field: ClientFieldValue): string {
  const { value, definition } = field;
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (definition.field_type === "checkbox") return value ? "Yes" : "No";
  if (definition.unit) return `${value} ${definition.unit}`;
  return String(value);
}

export default function CustomFieldsCard({
  fetchFields,
  onSetValue,
  editable,
}: {
  fetchFields: () => Promise<ClientCustomFields>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSetValue?: (definitionId: string, value: any) => Promise<void>;
  editable: boolean;
}) {
  const [data, setData] = useState<ClientCustomFields | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields().then(setData).catch(() => setData({ groups: [], fields: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChange(definitionId: string, value: unknown) {
    const previous = data;
    setData((prev) =>
      prev
        ? {
            ...prev,
            fields: prev.fields.map((f) =>
              f.definition.id === definitionId ? { ...f, value } : f
            ),
          }
        : prev
    );
    if (!onSetValue) return;
    try {
      await onSetValue(definitionId, value);
      setSaveError(null);
    } catch {
      // Revert the optimistic update — a network/server failure shouldn't
      // leave the field looking saved when it wasn't.
      setData(previous);
      setSaveError("Couldn't save that change. Try again.");
    }
  }

  if (!data || data.fields.length === 0) return null;

  const grouped = data.groups
    .map((group) => ({
      group,
      fields: data.fields.filter((f) => f.definition.group_id === group.id),
    }))
    .filter((g) => g.fields.length > 0);
  const ungrouped = data.fields.filter((f) => !f.definition.group_id);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-accent-600" weight="fill" />
        <h3 className="font-heading text-sm font-semibold text-neutral-900">
          {editable ? "Custom fields" : "About"}
        </h3>
      </div>
      <div className="flex flex-col gap-5">
        {grouped.map(({ group, fields }) => (
          <div key={group.id}>
            <p className="mb-2 text-xs font-semibold text-neutral-500 uppercase">{group.name}</p>
            <div className="flex flex-col gap-3">
              {fields.map((f) => (
                <div key={f.definition.id}>
                  {editable ? (
                    <>
                      <Label>{f.definition.name}</Label>
                      <FieldInput
                        definition={f.definition}
                        value={f.value}
                        onChange={(v) => handleChange(f.definition.id, v)}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">{f.definition.name}</span>
                      <span className="font-medium text-neutral-900">{displayValue(f)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {ungrouped.length > 0 && (
          <div className="flex flex-col gap-3">
            {ungrouped.map((f) => (
              <div key={f.definition.id}>
                {editable ? (
                  <>
                    <Label>{f.definition.name}</Label>
                    <FieldInput
                      definition={f.definition}
                      value={f.value}
                      onChange={(v) => handleChange(f.definition.id, v)}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">{f.definition.name}</span>
                    <span className="font-medium text-neutral-900">{displayValue(f)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {saveError && <p className="text-xs text-accent-600">{saveError}</p>}
      </div>
    </Card>
  );
}
