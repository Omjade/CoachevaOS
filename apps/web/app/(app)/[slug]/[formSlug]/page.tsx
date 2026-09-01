"use client";

import { use, useEffect, useState } from "react";
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react";
import { api, ApiError, PublicForm, publicFormImageUrl } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";

export default function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const { slug, formSlug } = use(params);
  const [form, setForm] = useState<PublicForm | "not_found" | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicForm(slug, formSlug)
      .then(setForm)
      .catch(() => setForm("not_found"));
  }, [slug, formSlug]);

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id: string, option: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [id]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.submitPublicForm(slug, formSlug, answers);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (form === null) return null;

  if (form === "not_found") {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-neutral-600">This form isn&apos;t available.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CheckCircle className="h-6 w-6" weight="fill" />
          </span>
          <h1 className="font-heading mb-1.5 text-xl font-semibold text-neutral-900">
            Thanks, you&apos;re all set
          </h1>
          <p className="text-sm text-neutral-600">
            {form.coach_name} will be in touch soon.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
      <div className="w-full max-w-md">
        <Eyebrow className="mb-4">{form.business_name ?? form.coach_name}</Eyebrow>
        <Card>
          <div className="mb-5 -mx-7 -mt-7 aspect-[3/1] overflow-hidden rounded-t-[22px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.has_image ? publicFormImageUrl(slug, formSlug) : "/5N22TgsC5COekVNfTUPjl3WiMQ.png"}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="font-heading mb-1.5 text-2xl font-semibold tracking-tight text-neutral-900">
            {form.title}
          </h1>
          {form.description && <p className="mb-6 text-sm text-neutral-600">{form.description}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {form.fields.map((field) => (
              <div key={field.id}>
                {field.type !== "consent" && (
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-accent-600"> *</span>}
                  </Label>
                )}

                {field.type === "textarea" && (
                  <textarea
                    id={field.id}
                    required={field.required}
                    rows={3}
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
                  />
                )}

                {field.type === "select" && (
                  <select
                    id={field.id}
                    required={field.required}
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500"
                  >
                    <option value="">Select…</option>
                    {(field.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === "radio" && (
                  <div className="flex flex-col gap-2 pt-1">
                    {(field.options ?? []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="radio"
                          name={field.id}
                          required={field.required}
                          checked={answers[field.id] === o}
                          onChange={() => setAnswer(field.id, o)}
                          className="h-3.5 w-3.5 accent-accent-600"
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === "checkbox" && (
                  <div className="flex flex-col gap-2 pt-1">
                    {(field.options ?? []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={Array.isArray(answers[field.id]) && (answers[field.id] as string[]).includes(o)}
                          onChange={() => toggleMulti(field.id, o)}
                          className="h-3.5 w-3.5 accent-accent-600"
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === "consent" && (
                  <label className="flex items-start gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      required={field.required}
                      checked={answers[field.id] === "yes"}
                      onChange={(e) => setAnswer(field.id, e.target.checked ? "yes" : "")}
                      className="mt-0.5 h-3.5 w-3.5 accent-accent-600"
                    />
                    {field.label}
                    {field.required && <span className="text-accent-600"> *</span>}
                  </label>
                )}

                {(field.type === "text" ||
                  field.type === "email" ||
                  field.type === "phone" ||
                  field.type === "number" ||
                  field.type === "date") && (
                  <Input
                    id={field.id}
                    required={field.required}
                    type={
                      field.type === "email"
                        ? "email"
                        : field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : field.type === "phone"
                              ? "tel"
                              : "text"
                    }
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <Button type="submit" loading={submitting} className="mt-1">
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
