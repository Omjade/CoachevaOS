"use client";

import { useState } from "react";
import { PencilSimpleIcon as PencilSimple } from "@phosphor-icons/react";
import { ApiError, TaskData, TaskPriority } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function TaskList({
  tasks,
  viewerUserId,
  onAdd,
  onToggle,
  onEdit,
}: {
  tasks: TaskData[];
  viewerUserId: string | null;
  onAdd: (title: string, dueDate?: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string, title: string, dueDate?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(title.trim(), dueDate || undefined);
      setTitle("");
      setDueDate("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that task. Try again.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(task: TaskData) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDue(task.due_date ?? "");
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await onEdit(id, editTitle, editDue || undefined);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that task. Try again.");
    }
  }

  function handleToggle(id: string) {
    setError(null);
    onToggle(id).catch((err) => {
      setError(err instanceof ApiError ? err.message : "Couldn't update that task. Try again.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
          className="flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-32 shrink-0"
        />
        <Button type="submit" disabled={adding}>
          Add
        </Button>
      </form>
      {error && <p className="text-xs text-accent-600">{error}</p>}

      {tasks.length === 0 && (
        <p className="text-sm text-neutral-600">
          No tasks yet. Add one above. Either of you can add, check off, or edit a task here.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-sm border border-divider px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => handleToggle(task.id)}
              className="h-4 w-4 accent-accent-600"
            />
            {editingId === task.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="w-36"
                />
                <Button
                  type="button"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => saveEdit(task.id)}
                >
                  Save
                </Button>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className={task.done ? "truncate text-sm text-neutral-500 line-through" : "truncate text-sm"}>
                    {task.title}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Added by{" "}
                    {task.added_by_user_id === viewerUserId ? "you" : task.added_by_name} ·{" "}
                    {task.done ? "Done" : task.due_date ? `Due ${task.due_date}` : "No due date"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  className="text-neutral-500 hover:text-text"
                  aria-label="Edit task"
                >
                  <PencilSimple className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
