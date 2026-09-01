"use client";

import { useEffect, useState } from "react";
import { PlusIcon as Plus, TrashIcon as Trash, NotebookIcon as Notebook } from "@phosphor-icons/react";
import { ApiError, SessionNote } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SessionsCardProps {
  listSessions: () => Promise<SessionNote[]>;
  createSession?: (body: {
    session_date: string;
    discussion_notes?: string | null;
    key_insights?: string | null;
    wins?: string | null;
    challenges?: string | null;
  }) => Promise<SessionNote>;
  deleteSession?: (noteId: string) => Promise<void>;
}

export default function SessionsCard({ listSessions, createSession, deleteSession }: SessionsCardProps) {
  const [notes, setNotes] = useState<SessionNote[] | null>(null);
  const [date, setDate] = useState(todayStr());
  const [discussion, setDiscussion] = useState("");
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listSessions()
      .then(setNotes)
      .catch(() => setNotes([]));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!createSession || !discussion.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await createSession({ session_date: date, discussion_notes: discussion.trim() });
      setDiscussion("");
      setDate(todayStr());
      setExpanded(false);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that note. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!deleteSession) return;
    setError(null);
    const removed = notes?.find((n) => n.id === noteId) ?? null;
    const previousIndex = notes?.findIndex((n) => n.id === noteId) ?? -1;
    setNotes((prev) => prev?.filter((n) => n.id !== noteId) ?? null);
    try {
      await deleteSession(noteId);
    } catch (err) {
      if (removed) {
        setNotes((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          next.splice(previousIndex, 0, removed);
          return next;
        });
      }
      setError(err instanceof ApiError ? err.message : "Couldn't remove that note. Try again.");
    }
  }

  if (!notes) return null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Notebook className="h-4 w-4 text-accent-600" weight="fill" />
          <h3 className="font-heading text-sm font-semibold text-neutral-900">Sessions</h3>
        </div>
        {createSession && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            Add note
          </button>
        )}
      </div>

      {createSession && expanded && (
        <form
          onSubmit={handleAdd}
          className="mb-4 flex flex-col gap-2.5 rounded-[14px] bg-neutral-50/60 p-3.5"
        >
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-fit rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
          />
          <textarea
            placeholder="What happened in this session?"
            value={discussion}
            onChange={(e) => setDiscussion(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={adding} disabled={!discussion.trim()}>
              Save note
            </Button>
          </div>
        </form>
      )}

      {error && <p className="mb-3 text-xs text-accent-600">{error}</p>}

      {notes.length === 0 ? (
        <p className="text-xs text-neutral-500">No session notes yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-[14px] border border-neutral-200 p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {new Date(note.session_date + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {deleteSession && (
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="text-neutral-400 hover:text-accent-600"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {note.discussion_notes && (
                <p className="text-sm text-neutral-800">{note.discussion_notes}</p>
              )}
              {note.wins && (
                <p className="mt-1 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-700">Wins: </span>
                  {note.wins}
                </p>
              )}
              {note.challenges && (
                <p className="mt-1 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-700">Challenges: </span>
                  {note.challenges}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
