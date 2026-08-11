"use client";

import { use, useEffect, useState } from "react";
import { api, CoachForm, FormSubmission } from "@/lib/api";
import { Card, Eyebrow } from "@/components/ui";

export default function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = use(params);
  const [form, setForm] = useState<CoachForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[] | null>(null);

  useEffect(() => {
    api.getForm(id).then(setForm);
    api.listFormSubmissions(id).then(setSubmissions).catch(() => setSubmissions([]));
  }, [id]);

  return (
    <div>
      <div className="mb-6">
        <Eyebrow className="mb-2">Lead capture</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          {form ? `${form.title} — submissions` : "Submissions"}
        </h1>
      </div>

      {submissions === null ? null : submissions.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No submissions yet — share the form link to start collecting leads.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <p className="mb-3 text-xs text-neutral-500">
                {new Date(s.submitted_at).toLocaleString()}
              </p>
              <div className="flex flex-col gap-2">
                {form?.fields.map((field) => {
                  const value = s.answers[field.id];
                  if (!value) return null;
                  return (
                    <p key={field.id} className="text-sm">
                      <span className="text-neutral-500">{field.label}: </span>
                      <span className="text-neutral-900">
                        {Array.isArray(value) ? value.join(", ") : value}
                      </span>
                    </p>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
