"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckIcon as Check, CopySimpleIcon as CopySimple } from "@phosphor-icons/react";
import { api, ApiError, CoachForm, FormField } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Eyebrow, ErrorBanner } from "@/components/ui";
import { FormBuilder } from "@/components/FormBuilder";

export default function EditFormPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { id } = use(params);
  const urlParams = useParams<{ slug: string }>();
  const [form, setForm] = useState<CoachForm | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getForm(id).then((f) => {
      setForm(f);
      setTitle(f.title);
      setDescription(f.description ?? "");
      setFields(f.fields);
    });
  }, [id]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateForm(id, {
        title,
        description: description || undefined,
        fields,
      });
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!form) return;
    const url = `${window.location.origin}/${urlParams.slug}/${form.slug}`;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!form) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow className="mb-2">Lead capture</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Edit form
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            coachevaos.com/{urlParams.slug}/{form.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" weight="bold" />
                Copied
              </>
            ) : (
              <>
                <CopySimple className="h-3.5 w-3.5" weight="bold" />
                Copy link
              </>
            )}
          </button>
          <Button onClick={handleSave} loading={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
              <Check className="h-3.5 w-3.5" weight="bold" />
              Saved
            </span>
          )}
        </div>
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
