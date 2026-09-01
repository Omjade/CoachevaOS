"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, FormField, FormFieldType } from "@/lib/api";
import { Button, Eyebrow, ErrorBanner, Input, Card } from "@/components/ui";
import { FormBuilder } from "@/components/FormBuilder";
import { useRoleGuard } from "@/lib/useRoleGuard";

let draftIdCounter = 0;
function nextDraftId() {
  draftIdCounter += 1;
  return `ai_${Date.now()}_${draftIdCounter}`;
}

const STARTER_FIELDS: FormField[] = [
  { id: "f_name", type: "text", label: "Full name", required: true },
  { id: "f_email", type: "email", label: "Email", required: true },
  { id: "f_phone", type: "phone", label: "Phone number", required: true },
  { id: "f_goal", type: "textarea", label: "Primary goal", required: true },
  {
    id: "f_experience",
    type: "select",
    label: "Experience level",
    required: true,
    options: ["Beginner", "Intermediate", "Advanced"],
  },
  { id: "f_availability", type: "text", label: "Preferred availability", required: false },
  {
    id: "f_source",
    type: "select",
    label: "How did you hear about us?",
    required: false,
    options: ["Instagram", "Referral", "Google", "Other"],
  },
  {
    id: "f_notes",
    type: "textarea",
    label: "Anything else we should know?",
    required: false,
  },
  {
    id: "f_consent",
    type: "consent",
    label: "I agree to be contacted about coaching services",
    required: true,
  },
];

export default function NewFormPage() {
  const ok = useRoleGuard("coach");
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("New client intake");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>(STARTER_FIELDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiDraft() {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setError(null);
    try {
      const draft = await api.getFormAiDraft(aiDescription.trim());
      setTitle(draft.title);
      setDescription(draft.description);
      setFields(
        draft.fields.map((f) => ({
          id: nextDraftId(),
          type: f.type as FormFieldType,
          label: f.label,
          required: f.required,
          options: f.options ?? undefined,
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const form = await api.createForm({ title, description: description || undefined, fields });
      router.push(`/${params.slug}/forms/${form.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  if (!ok) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Lead capture</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            New form
          </h1>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saving ? "Creating…" : "Create form"}
        </Button>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkle className="h-4 w-4 text-accent-600" weight="fill" />
          <h3 className="font-heading text-sm font-semibold text-neutral-900">
            Describe your form
          </h3>
        </div>
        <p className="mb-3 text-xs text-neutral-500">
          Replaces the fields below with an AI-drafted list. You can still edit everything
          before publishing.
        </p>
        <div className="flex gap-2">
          <Input
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. intake form for a new nutrition client"
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAiDraft}
            loading={aiLoading}
            disabled={!aiDescription.trim()}
          >
            Draft with AI
          </Button>
        </div>
      </Card>

      <FormBuilder
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        fields={fields}
        onFieldsChange={setFields}
      />
    </div>
  );
}
