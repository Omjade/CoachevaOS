"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckIcon as Check,
  CopySimpleIcon as CopySimple,
  ShareNetworkIcon as ShareNetwork,
} from "@phosphor-icons/react";
import { api, ApiError, ClientListItem, CoachForm, FormField } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Eyebrow, ErrorBanner } from "@/components/ui";
import Dialog from "@/components/Dialog";
import { FormBuilder } from "@/components/FormBuilder";
import { useRoleGuard } from "@/lib/useRoleGuard";

export default function EditFormPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { id } = use(params);
  const ok = useRoleGuard("coach");
  const urlParams = useParams<{ slug: string }>();
  const [form, setForm] = useState<CoachForm | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shareResult, setShareResult] = useState<number | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

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

  function openShare() {
    setShareResult(null);
    setShareError(null);
    setSelectedClientIds(new Set());
    setShareOpen(true);
    if (clients === null) {
      api.listClients().then(setClients).catch(() => setClients([]));
    }
  }

  function toggleClient(id: string) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleShare() {
    if (selectedClientIds.size === 0) return;
    setSharing(true);
    setShareError(null);
    try {
      const res = await api.shareForm(id, Array.from(selectedClientIds));
      setShareResult(res.sent);
    } catch (err) {
      setShareError(err instanceof ApiError ? err.message : "Couldn't share this form. Try again.");
    } finally {
      setSharing(false);
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

  if (!ok || !form) return null;

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
            onClick={openShare}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <ShareNetwork className="h-3.5 w-3.5" weight="bold" />
            Share with clients
          </button>
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
        formId={form.id}
        hasImage={form.has_image}
        onImageChange={(hasImage) => setForm((f) => (f ? { ...f, has_image: hasImage } : f))}
      />

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title="Share with clients">
        {shareResult !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-700">
              Sent to {shareResult} client{shareResult === 1 ? "" : "s"}.
            </p>
            <Button onClick={() => setShareOpen(false)}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Sends this form&apos;s link as a chat message to each client you select.
            </p>
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {clients === null ? (
                <p className="text-sm text-neutral-400">Loading clients…</p>
              ) : clients.length === 0 ? (
                <p className="text-sm text-neutral-400">No clients yet.</p>
              ) : (
                clients.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.has(c.id)}
                      onChange={() => toggleClient(c.id)}
                      className="h-3.5 w-3.5 accent-accent-600"
                    />
                    <span className="text-sm text-neutral-800">{c.name}</span>
                  </label>
                ))
              )}
            </div>
            {shareError && <ErrorBanner>{shareError}</ErrorBanner>}
            <Button
              onClick={handleShare}
              loading={sharing}
              disabled={selectedClientIds.size === 0}
            >
              {sharing
                ? "Sending…"
                : `Send to ${selectedClientIds.size} client${selectedClientIds.size === 1 ? "" : "s"}`}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
