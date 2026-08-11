"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, FormField } from "@/lib/api";
import { Button, Eyebrow, ErrorBanner } from "@/components/ui";
import { FormBuilder } from "@/components/FormBuilder";

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
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("New client intake");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>(STARTER_FIELDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
