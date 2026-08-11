"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  UploadSimpleIcon as UploadSimple,
  CheckCircleIcon as CheckCircle,
  WarningCircleIcon as WarningCircle,
  ArrowLeftIcon as ArrowLeft,
} from "@phosphor-icons/react";
import { api, ApiError, ImportCommitResult, ImportPreview } from "@/lib/api";
import { Button, Card, ErrorBanner, Eyebrow } from "@/components/ui";

const TARGET_FIELDS: { value: string; label: string }[] = [
  { value: "", label: "Don't import" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "goals", label: "Goals" },
  { value: "program", label: "Program" },
  { value: "tags", label: "Tags (comma-separated)" },
  { value: "notes", label: "Notes" },
];

type Step = "upload" | "review" | "result";

export default function ClientImportPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const p = await api.previewClientImport(file);
      setPreview(p);
      const initialMapping: Record<string, string> = {};
      for (const field of ["name", "email", "goals", "program", "tags", "notes"]) {
        initialMapping[field] = p.mapping[field] ?? "";
      }
      setMapping(initialMapping);
      setStep("review");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't read that file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function columnFor(field: string): string | null {
    const col = mapping[field];
    return col ? col : null;
  }

  async function handleCommit() {
    if (!preview) return;
    setError(null);
    setLoading(true);
    try {
      // mapping here is field -> source column; commit expects the same shape
      const commitMapping: Record<string, string | null> = {};
      for (const field of ["name", "email", "goals", "program", "tags", "notes"]) {
        commitMapping[field] = columnFor(field);
      }
      const res = await api.commitClientImport(commitMapping, preview.rows);
      setResult(res);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${params.slug}/clients`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-accent-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to clients
      </Link>
      <Eyebrow className="mb-2">Import</Eyebrow>
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        Import your existing clients
      </h1>

      {step === "upload" && (
        <Card>
          <p className="mb-5 text-sm text-neutral-600">
            Upload a CSV or Excel file of clients you already work with. We&apos;ll suggest which
            column maps to which field — you review and confirm before anything is created. No
            invite emails are sent automatically.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFile}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file">
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5">
              <UploadSimple className="h-4 w-4" weight="bold" />
              {loading ? "Reading file…" : "Choose file"}
            </span>
          </label>
          {error && (
            <div className="mt-4">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}
        </Card>
      )}

      {step === "review" && preview && (
        <Card>
          {preview.warnings.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-[12px] bg-neutral-100 px-3.5 py-2.5 text-xs text-neutral-600">
              <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
              <span>{preview.warnings.join(" ")}</span>
            </div>
          )}
          <p className="mb-4 text-sm text-neutral-600">
            Found {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"}. Confirm which
            column maps to each field.
          </p>
          <div className="flex flex-col gap-3">
            {["name", "email", "goals", "program", "tags", "notes"].map((field) => (
              <div key={field} className="flex items-center justify-between gap-3">
                <span className="w-24 shrink-0 text-xs font-semibold text-neutral-700 capitalize">
                  {field}
                </span>
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
                >
                  <option value="">Don&apos;t import</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {preview.rows.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-[12px] border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-500">
                  <tr>
                    {["name", "email", "goals", "program"].map((field) => (
                      <th key={field} className="px-3 py-2 font-medium capitalize">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-neutral-200">
                      {["name", "email", "goals", "program"].map((field) => {
                        const col = columnFor(field);
                        return (
                          <td key={field} className="px-3 py-2 text-neutral-700">
                            {col ? row[col] || "—" : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={handleCommit} loading={loading} disabled={!mapping.name || !mapping.email}>
              {loading ? "Importing…" : `Import ${preview.rows.length} client${preview.rows.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}

      {step === "result" && result && (
        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <CheckCircle className="h-4.5 w-4.5" weight="fill" />
            </span>
            <div>
              <h2 className="font-heading text-base font-semibold text-neutral-900">
                {result.created} client{result.created === 1 ? "" : "s"} imported
              </h2>
              {result.skipped.length > 0 && (
                <p className="text-xs text-neutral-500">
                  {result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} skipped
                </p>
              )}
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div className="mb-6 flex flex-col gap-2">
              {result.skipped.map((s, i) => (
                <div key={i} className="rounded-[10px] bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
                  {s.row.name || s.row.email || `Row ${i + 1}`} — {s.reason}
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => router.push(`/${params.slug}/clients`)}>View clients</Button>
        </Card>
      )}
    </div>
  );
}
