"use client";

import { useEffect, useRef, useState } from "react";
import {
  MicrophoneIcon as Microphone,
  SparkleIcon as Sparkle,
  TrashIcon as Trash,
  StackIcon as Stack,
  PencilSimpleIcon as PencilSimple,
} from "@phosphor-icons/react";
import { api, ApiError, Program, ProgramItemDraft, ProgramTemplate } from "@/lib/api";
import { Button, Card, ErrorBanner, Input } from "@/components/ui";
import Dialog from "@/components/Dialog";
import { programDateRange } from "@/lib/programDates";

// Minimal shape for the Web Speech API — not in standard TS DOM lib. Mirrors
// the same helper in AISessionAssistant.tsx (that app's other voice-input
// surface), reused here rather than a MediaRecorder/Whisper round trip since
// this is the plumbing that's actually already proven in this app.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function ProgramGenerator({ clientId }: { clientId: string }) {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [open, setOpen] = useState(false);
  const [constraints, setConstraints] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftItems, setDraftItems] = useState<ProgramItemDraft[]>([]);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = getSpeechRecognition() !== null;
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [editingDatesId, setEditingDatesId] = useState<string | null>(null);
  const [startedInput, setStartedInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [savingDates, setSavingDates] = useState(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = constraints ? constraints + " " : "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      setConstraints(finalText + interim);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function refresh() {
    api.listClientPrograms(clientId).then(setPrograms).catch(() => setPrograms([]));
  }

  useEffect(refresh, [clientId]);
  useEffect(() => {
    api.listTemplates().then(setTemplates).catch(() => {});
  }, []);

  async function assignTemplate(templateId: string) {
    setAssigning(templateId);
    setError(null);
    try {
      await api.assignTemplateToClient(clientId, templateId);
      setAssignOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't assign that template. Try again.");
    } finally {
      setAssigning(null);
    }
  }

  function templateTitle(templateId: string | null): string | null {
    if (!templateId) return null;
    return templates.find((t) => t.id === templateId)?.title ?? null;
  }

  async function generateDraft() {
    setDrafting(true);
    setError(null);
    try {
      const draft = await api.getProgramDraft(clientId, constraints.trim() || undefined);
      setDraftTitle(draft.title);
      setDraftItems(draft.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setDrafting(false);
    }
  }

  async function saveProgram() {
    setSaving(true);
    try {
      await api.createClientProgram(clientId, draftTitle, draftItems);
      setOpen(false);
      setConstraints("");
      setDraftTitle("");
      setDraftItems([]);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function removeProgram(programId: string) {
    setError(null);
    try {
      await api.deleteClientProgram(clientId, programId);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that program. Try again.");
    }
  }

  function startEditingDates(program: Program) {
    setEditingDatesId(program.id);
    setStartedInput(program.started_at ?? "");
    setDurationInput(program.duration_weeks?.toString() ?? "");
  }

  async function saveDates(programId: string) {
    setSavingDates(true);
    setError(null);
    try {
      await api.updateClientProgramDates(clientId, programId, {
        started_at: startedInput || null,
        duration_weeks: durationInput ? Number(durationInput) : null,
      });
      setEditingDatesId(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save those dates. Try again.");
    } finally {
      setSavingDates(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-neutral-900">Program</h3>
        <div className="flex gap-2">
          {templates.length > 0 && (
            <Button variant="secondary" onClick={() => setAssignOpen(true)}>
              <Stack className="h-4 w-4" weight="bold" />
              Assign a package
            </Button>
          )}
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Sparkle className="h-4 w-4" weight="fill" />
            Generate program
          </Button>
        </div>
      </div>

      {programs && programs.length === 0 && (
        <p className="text-xs text-neutral-500">No program yet.</p>
      )}
      {error && !open && <p className="mb-3 text-xs text-accent-600">{error}</p>}
      <div className="flex flex-col gap-4">
        {programs?.map((program) => (
          <div key={program.id} className="rounded-[14px] border border-neutral-200 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{program.title}</p>
                {templateTitle(program.assigned_from_template_id) && (
                  <p className="text-xs text-neutral-400">
                    Based on: {templateTitle(program.assigned_from_template_id)}
                  </p>
                )}
                {editingDatesId !== program.id && (
                  <button
                    type="button"
                    onClick={() => startEditingDates(program)}
                    className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500 hover:text-accent-600"
                  >
                    {programDateRange(program.started_at, program.duration_weeks) ??
                      "Set start date"}
                    <PencilSimple className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeProgram(program.id)}
                className="text-neutral-400 hover:text-accent-600"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            {editingDatesId === program.id && (
              <div className="mb-3 flex flex-wrap items-end gap-2 rounded-[10px] bg-neutral-50/60 p-2.5">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
                    Start date
                  </label>
                  <Input
                    type="date"
                    value={startedInput}
                    onChange={(e) => setStartedInput(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
                    Duration (weeks)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    className="w-20"
                  />
                </div>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => saveDates(program.id)}
                  loading={savingDates}
                >
                  Save
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingDatesId(null)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            )}
            {(program.description || program.price_amount != null) && (
              <div className="mb-2.5 flex flex-col gap-0.5">
                {program.description && (
                  <p className="text-xs text-neutral-600">{program.description}</p>
                )}
                {program.price_amount != null && (
                  <p className="text-xs font-medium text-neutral-700">
                    {program.price_currency ?? ""} {program.price_amount}
                    {program.billing_cadence && program.billing_cadence !== "one_time"
                      ? ` / ${program.billing_cadence}`
                      : ""}
                  </p>
                )}
              </div>
            )}
            <ol className="flex flex-col gap-1.5">
              {program.items.map((item) => (
                <li key={item.id} className="text-xs text-neutral-700">
                  <span className="font-medium text-neutral-900">{item.title}</span>
                  {item.description && <>: {item.description}</>}
                  {item.target_metric && (
                    <span className="text-neutral-400"> ({item.target_metric})</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Generate a program">
        {error && (
          <div className="mb-4">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}
        {draftItems.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700">
                  Anything to account for? (optional)
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    aria-label={recording ? "Stop recording" : "Dictate with your voice"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                      recording
                        ? "bg-accent-600 text-white"
                        : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    }`}
                  >
                    <Microphone className="h-3.5 w-3.5" weight={recording ? "fill" : "regular"} />
                  </button>
                )}
              </div>
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                rows={3}
                placeholder="Equipment, time constraints, prior experience…"
                className="w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
              />
              {recording && (
                <p className="mt-1 text-[11px] text-accent-600">Listening…</p>
              )}
            </div>
            <Button onClick={generateDraft} loading={drafting}>
              Draft with AI
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm font-semibold text-neutral-900 outline-none focus:border-accent-500"
            />
            <div className="flex flex-col gap-2">
              {draftItems.map((item, i) => (
                <div key={i} className="rounded-[10px] bg-neutral-50/60 p-2.5">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((it, idx) => (idx === i ? { ...it, title: e.target.value } : it))
                      )
                    }
                    className="mb-1 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, description: e.target.value } : it
                        )
                      )
                    }
                    rows={2}
                    className="w-full resize-none bg-transparent text-xs text-neutral-600 outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDraftItems([])}>
                Back
              </Button>
              <Button onClick={saveProgram} loading={saving}>
                Save program
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign a package">
        {error && (
          <div className="mb-4">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{t.title}</p>
                <p className="text-xs text-neutral-500">
                  {t.duration_weeks ? `${t.duration_weeks}-week · ` : ""}
                  {t.items.length} item{t.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="secondary"
                className="!px-3 !py-1.5 text-xs"
                onClick={() => assignTemplate(t.id)}
                disabled={assigning !== null}
              >
                {assigning === t.id ? "Assigning…" : "Assign"}
              </Button>
            </div>
          ))}
        </div>
      </Dialog>
    </Card>
  );
}
