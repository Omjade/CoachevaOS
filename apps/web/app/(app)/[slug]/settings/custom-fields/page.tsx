"use client";

import { useEffect, useState } from "react";
import {
  TextAaIcon as TextAa,
  ParagraphIcon as Paragraph,
  HashIcon as Hash,
  CurrencyDollarIcon as CurrencyDollar,
  PercentIcon as Percent,
  CalendarBlankIcon as CalendarBlank,
  ListChecksIcon as ListChecks,
  SquaresFourIcon as SquaresFour,
  CheckSquareIcon as CheckSquare,
  StarIcon as Star,
  LinkIcon as LinkI,
  EnvelopeSimpleIcon as EnvelopeSimple,
  PhoneIcon as Phone,
  SparkleIcon as Sparkle,
  TrashIcon as Trash,
  PlusIcon as Plus,
} from "@phosphor-icons/react";
import {
  api,
  ApiError,
  CustomFieldDefinition,
  CustomFieldGroup,
  CustomFieldType,
} from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";
import { useRoleGuard } from "@/lib/useRoleGuard";

const FIELD_TYPES: { type: CustomFieldType; label: string; Icon: typeof TextAa; hasOptions: boolean }[] = [
  { type: "text", label: "Short text", Icon: TextAa, hasOptions: false },
  { type: "textarea", label: "Long text", Icon: Paragraph, hasOptions: false },
  { type: "number", label: "Number", Icon: Hash, hasOptions: false },
  { type: "currency", label: "Currency", Icon: CurrencyDollar, hasOptions: false },
  { type: "percentage", label: "Percentage", Icon: Percent, hasOptions: false },
  { type: "date", label: "Date", Icon: CalendarBlank, hasOptions: false },
  { type: "dropdown", label: "Dropdown", Icon: ListChecks, hasOptions: true },
  { type: "multi_select", label: "Multi-select", Icon: SquaresFour, hasOptions: true },
  { type: "checkbox", label: "Checkbox", Icon: CheckSquare, hasOptions: false },
  { type: "rating", label: "Rating", Icon: Star, hasOptions: false },
  { type: "url", label: "URL", Icon: LinkI, hasOptions: false },
  { type: "email", label: "Email", Icon: EnvelopeSimple, hasOptions: false },
  { type: "phone", label: "Phone", Icon: Phone, hasOptions: false },
];

function fieldMeta(type: CustomFieldType) {
  return FIELD_TYPES.find((f) => f.type === type) ?? FIELD_TYPES[0];
}

export default function CustomFieldsSettingsPage() {
  const ok = useRoleGuard("coach");
  const [groups, setGroups] = useState<CustomFieldGroup[] | null>(null);
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [addingFieldGroup, setAddingFieldGroup] = useState<string | "ungrouped" | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldVisible, setNewFieldVisible] = useState(false);

  function refresh() {
    api.listCustomFieldGroups().then(setGroups).catch(() => setGroups([]));
    api.listCustomFieldDefinitions().then(setDefinitions).catch(() => setDefinitions([]));
  }

  useEffect(refresh, []);

  async function applyTemplate() {
    setApplyingTemplate(true);
    setError(null);
    try {
      await api.applyCustomFieldTemplate();
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setApplyingTemplate(false);
    }
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError(null);
    try {
      await api.createCustomFieldGroup({ name: newGroupName.trim(), order: groups?.length ?? 0 });
      setNewGroupName("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that group. Try again.");
    }
  }

  async function removeGroup(id: string) {
    setError(null);
    try {
      await api.deleteCustomFieldGroup(id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that group. Try again.");
    }
  }

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const meta = fieldMeta(newFieldType);
    try {
      await api.createCustomFieldDefinition({
        group_id: addingFieldGroup === "ungrouped" ? null : addingFieldGroup,
        name: newFieldName.trim(),
        field_type: newFieldType,
        options: meta.hasOptions
          ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
          : null,
        visible_to_client: newFieldVisible,
      });
      setAddingFieldGroup(null);
      setNewFieldName("");
      setNewFieldType("text");
      setNewFieldOptions("");
      setNewFieldVisible(false);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function removeField(id: string) {
    setError(null);
    try {
      await api.deleteCustomFieldDefinition(id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that field. Try again.");
    }
  }

  async function toggleVisible(def: CustomFieldDefinition) {
    setError(null);
    try {
      await api.updateCustomFieldDefinition(def.id, { visible_to_client: !def.visible_to_client });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that field. Try again.");
    }
  }

  if (!ok || !groups || !definitions) return null;

  const ungrouped = definitions.filter((d) => !d.group_id);

  function fieldForm(groupId: string | "ungrouped") {
    return (
      <form onSubmit={addField} className="mt-3 flex flex-col gap-2.5 rounded-[12px] bg-neutral-50/60 p-3.5">
        <Input
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          placeholder="Field name, e.g. Body fat %"
          autoFocus
        />
        <div className="flex flex-wrap gap-1.5">
          {FIELD_TYPES.map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setNewFieldType(type)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                newFieldType === type
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        {fieldMeta(newFieldType).hasOptions && (
          <Input
            value={newFieldOptions}
            onChange={(e) => setNewFieldOptions(e.target.value)}
            placeholder="Options, comma-separated"
          />
        )}
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={newFieldVisible}
            onChange={(e) => setNewFieldVisible(e.target.checked)}
          />
          Visible to client
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={!newFieldName.trim()}>
            Add field
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAddingFieldGroup(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Eyebrow className="mb-2">Workspace</Eyebrow>
      <h1 className="font-heading mb-1 text-[26px] font-semibold tracking-tight text-neutral-900">
        Custom fields
      </h1>
      <p className="mb-6 text-xs text-neutral-500">
        New fields default to coach-only. Toggle a field to &ldquo;Visible to client&rdquo; below to
        have it appear on that client&apos;s own onboarding and profile.
      </p>

      {error && (
        <div className="mb-6">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {definitions.length === 0 && (
        <Card className="mb-6 !border-accent-200 !bg-accent-100">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-600">
              <Sparkle className="h-4.5 w-4.5" weight="fill" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Use a starter template for your niche
              </p>
              <p className="text-xs text-neutral-600">
                One click sets up a useful starting profile. Edit or remove anything after.
              </p>
            </div>
            <Button onClick={applyTemplate} loading={applyingTemplate}>
              Use template
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const groupFields = definitions.filter((d) => d.group_id === group.id);
          return (
            <Card key={group.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold text-neutral-900">{group.name}</h3>
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="text-neutral-400 hover:text-accent-600"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {groupFields.map((def) => (
                  <div
                    key={def.id}
                    className="flex items-center justify-between rounded-[10px] bg-neutral-50/60 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-neutral-800">
                      {(() => {
                        const Icon = fieldMeta(def.field_type).Icon;
                        return <Icon className="h-3.5 w-3.5 text-neutral-400" />;
                      })()}
                      {def.name}
                      {def.unit && <span className="text-xs text-neutral-400">({def.unit})</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleVisible(def)}
                        className={`text-xs ${def.visible_to_client ? "text-accent-600" : "text-neutral-400"}`}
                      >
                        {def.visible_to_client ? "Visible to client" : "Coach only"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(def.id)}
                        className="text-neutral-400 hover:text-accent-600"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {addingFieldGroup === group.id ? (
                fieldForm(group.id)
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingFieldGroup(group.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" weight="bold" />
                  Add field
                </button>
              )}
            </Card>
          );
        })}

        {ungrouped.length > 0 && (
          <Card>
            <h3 className="font-heading mb-2 text-sm font-semibold text-neutral-900">Ungrouped</h3>
            <div className="flex flex-col gap-1.5">
              {ungrouped.map((def) => (
                <div
                  key={def.id}
                  className="flex items-center justify-between rounded-[10px] bg-neutral-50/60 px-3 py-2 text-sm"
                >
                  <span className="text-neutral-800">{def.name}</span>
                  <button
                    type="button"
                    onClick={() => removeField(def.id)}
                    className="text-neutral-400 hover:text-accent-600"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">Add a group</h3>
          <form onSubmit={addGroup} className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Business Profile"
              className="flex-1"
            />
            <Button type="submit" disabled={!newGroupName.trim()}>
              Add group
            </Button>
          </form>
          {addingFieldGroup === "ungrouped" ? (
            fieldForm("ungrouped")
          ) : (
            <button
              type="button"
              onClick={() => setAddingFieldGroup("ungrouped")}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              Add an ungrouped field
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
