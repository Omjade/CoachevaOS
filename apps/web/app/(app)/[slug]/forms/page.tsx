"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PlusIcon as Plus,
  CopySimpleIcon as CopySimple,
  CheckIcon as Check,
  PencilSimpleIcon as PencilSimple,
  ListChecksIcon as ListChecks,
} from "@phosphor-icons/react";
import { api, ApiError, CoachForm } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Card, Eyebrow } from "@/components/ui";
import { useRoleGuard } from "@/lib/useRoleGuard";

export default function FormsPage() {
  const ok = useRoleGuard("coach");
  const params = useParams<{ slug: string }>();
  const [forms, setForms] = useState<CoachForm[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.listForms().then(setForms).catch(() => setForms([]));
  }

  useEffect(refresh, []);

  async function toggleActive(form: CoachForm) {
    setError(null);
    setForms(
      (prev) =>
        prev?.map((f) => (f.id === form.id ? { ...f, is_active: !f.is_active } : f)) ?? prev
    );
    try {
      await api.updateForm(form.id, { is_active: !form.is_active });
    } catch (err) {
      // Revert the optimistic toggle — a failed save shouldn't leave the
      // form looking active/inactive when the server never confirmed it.
      setForms(
        (prev) =>
          prev?.map((f) => (f.id === form.id ? { ...f, is_active: form.is_active } : f)) ?? prev
      );
      setError(err instanceof ApiError ? err.message : "Couldn't update that form. Try again.");
    }
  }

  async function toggleFeatured(form: CoachForm) {
    setError(null);
    const next = !form.featured_on_public_profile;
    // Setting one featured form unsets any other — mirror that locally too,
    // matching what update_form actually does server-side.
    const prevState = forms;
    setForms(
      (prev) =>
        prev?.map((f) => ({
          ...f,
          featured_on_public_profile: f.id === form.id ? next : false,
        })) ?? prev
    );
    try {
      await api.updateForm(form.id, { featured_on_public_profile: next });
    } catch (err) {
      setForms(prevState);
      setError(err instanceof ApiError ? err.message : "Couldn't update that form. Try again.");
    }
  }

  async function copyLink(form: CoachForm) {
    const url = `${window.location.origin}/${params.slug}/${form.slug}`;
    const ok = await copyText(url);
    if (ok) {
      setCopiedId(form.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  if (!ok) return null;

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Lead capture</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Forms
          </h1>
        </div>
        <Link href={`/${params.slug}/forms/new`}>
          <Button>
            <Plus className="h-4 w-4" weight="bold" />
            New form
          </Button>
        </Link>
      </div>

      {error && <p className="mb-4 text-xs text-accent-600">{error}</p>}

      {forms === null ? null : forms.length === 0 ? (
        <Card>
          <p className="mb-4 text-sm text-neutral-600">
            Create a form in seconds with AI: describe what you need, adjust the fields if you
            want, then share the link with a client to fill it out.
          </p>
          <Link href={`/${params.slug}/forms/new`}>
            <Button variant="secondary">
              <Plus className="h-4 w-4" weight="bold" />
              Create your first form
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-medium text-neutral-900">{form.title}</h3>
                <button
                  type="button"
                  onClick={() => toggleActive(form)}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    form.is_active
                      ? "bg-accent-100 text-accent-700"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {form.is_active ? "Active" : "Inactive"}
                </button>
              </div>
              <p className="mb-2 text-xs text-neutral-500">
                {form.submission_count} submission{form.submission_count === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => toggleFeatured(form)}
                title="Show this form's link instead of the built-in contact card on your public profile"
                className={`mb-4 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  form.featured_on_public_profile
                    ? "bg-accent-600 text-white"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                {form.featured_on_public_profile ? "Featured on public profile" : "Feature on public profile"}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(form)}
                  className="flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {copiedId === form.id ? (
                    <>
                      <Check className="h-3 w-3" weight="bold" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopySimple className="h-3 w-3" weight="bold" />
                      Copy link
                    </>
                  )}
                </button>
                <Link
                  href={`/${params.slug}/forms/${form.id}/edit`}
                  className="flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <PencilSimple className="h-3 w-3" weight="bold" />
                  Edit
                </Link>
                <Link
                  href={`/${params.slug}/forms/${form.id}/submissions`}
                  className="flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <ListChecks className="h-3 w-3" weight="bold" />
                  Submissions
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
