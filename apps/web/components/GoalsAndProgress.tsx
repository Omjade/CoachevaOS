"use client";

import { useEffect, useRef, useState } from "react";
import {
  PlusIcon as Plus,
  CheckIcon as Check,
  TrashIcon as Trash,
  CameraIcon as Camera,
  NotePencilIcon as NotePencil,
} from "@phosphor-icons/react";
import { api, ClientGoal, ProgressEntry } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

interface GoalsAndProgressProps {
  listGoals: () => Promise<ClientGoal[]>;
  createGoal: (body: { title: string; target_date?: string | null }) => Promise<ClientGoal>;
  updateGoal: (goalId: string, body: { done?: boolean }) => Promise<ClientGoal>;
  deleteGoal: (goalId: string) => Promise<void>;
  listProgress: () => Promise<ProgressEntry[]>;
  createProgress: (note: string, entryDate: string, file?: File | null) => Promise<ProgressEntry>;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GoalsAndProgress(props: GoalsAndProgressProps) {
  const { listGoals, createGoal, updateGoal, deleteGoal, listProgress, createProgress } = props;
  const [goals, setGoals] = useState<ClientGoal[] | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[] | null>(null);
  const [newGoal, setNewGoal] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [file, setFile] = useState<File | null>(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refreshGoals() {
    listGoals().then(setGoals).catch(() => setGoals([]));
  }

  function refreshProgress() {
    listProgress().then(setEntries).catch(() => setEntries([]));
  }

  useEffect(() => {
    refreshGoals();
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setAddingGoal(true);
    try {
      await createGoal({ title: newGoal.trim(), target_date: newGoalDate || null });
      setNewGoal("");
      setNewGoalDate("");
      refreshGoals();
    } finally {
      setAddingGoal(false);
    }
  }

  async function toggleGoal(goal: ClientGoal) {
    setGoals((prev) => prev?.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)) ?? null);
    await updateGoal(goal.id, { done: !goal.done });
  }

  async function removeGoal(goalId: string) {
    setGoals((prev) => prev?.filter((g) => g.id !== goalId) ?? null);
    await deleteGoal(goalId);
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() && !file) return;
    setAddingEntry(true);
    try {
      await createProgress(note.trim(), entryDate, file);
      setNote("");
      setFile(null);
      setEntryDate(todayStr());
      if (fileInputRef.current) fileInputRef.current.value = "";
      refreshProgress();
    } finally {
      setAddingEntry(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">Goals</h3>
        {goals && goals.length === 0 && (
          <p className="mb-3 text-xs text-neutral-500">No goals yet — add the first one below.</p>
        )}
        <div className="mb-4 flex flex-col gap-2">
          {goals?.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-2.5 rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  goal.done
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {goal.done && <Check className="h-3 w-3" weight="bold" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${goal.done ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                  {goal.title}
                </p>
                {goal.target_date && (
                  <p className="text-xs text-neutral-500">
                    Target {new Date(goal.target_date + "T00:00:00").toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeGoal(goal.id)}
                className="shrink-0 text-neutral-400 hover:text-accent-600"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddGoal} className="flex items-center gap-2">
          <Input
            placeholder="Add a goal…"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="flex-1"
          />
          <input
            type="date"
            value={newGoalDate}
            onChange={(e) => setNewGoalDate(e.target.value)}
            className="rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
          />
          <Button type="submit" loading={addingGoal} disabled={!newGoal.trim()}>
            <Plus className="h-4 w-4" weight="bold" />
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">Progress timeline</h3>
        <form onSubmit={handleAddEntry} className="mb-5 flex flex-col gap-2.5 rounded-[14px] bg-neutral-50/60 p-3.5">
          <textarea
            placeholder="What's new? (optional if you're adding a photo or video)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
            />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
              <Camera className="h-3.5 w-3.5" />
              {file ? file.name : "Add photo/video"}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button type="submit" loading={addingEntry} disabled={!note.trim() && !file} className="ml-auto">
              Add entry
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {entries && entries.length === 0 && (
            <p className="text-xs text-neutral-500">No progress entries yet.</p>
          )}
          {entries?.map((entry) => (
            <div key={entry.id} className="flex gap-3 rounded-[14px] border border-neutral-200 p-3.5">
              {entry.media_type ? (
                entry.media_type === "video" ? (
                  <video
                    src={api.progressMediaUrl(entry.id)}
                    controls
                    className="h-20 w-20 shrink-0 rounded-[10px] bg-neutral-900 object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={api.progressMediaUrl(entry.id)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-[10px] object-cover"
                  />
                )
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400">
                  <NotePencil className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-500">
                  {new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {entry.created_by_name}
                </p>
                {entry.note && <p className="mt-1 text-sm text-neutral-800">{entry.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
