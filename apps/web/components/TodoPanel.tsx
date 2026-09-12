"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquareIcon as CheckSquare,
  PlusIcon as Plus,
  TrashIcon as Trash,
  MicrophoneIcon as Microphone,
  ArrowClockwiseIcon as ArrowClockwise,
} from "@phosphor-icons/react";
import { api, TodoData } from "@/lib/api";
import { Card } from "@/components/ui";

// SpeechRecognition isn't in the standard lib.dom types yet — narrow enough
// typing to use it without pulling in a whole extra type package.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function TodoPanel({ date }: { date: string }) {
  const [todos, setTodos] = useState<TodoData[] | null>(null);
  const [newText, setNewText] = useState("");
  const [listening, setListening] = useState(false);
  const [building, setBuilding] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [checkedForCarry, setCheckedForCarry] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function refresh() {
    api
      .listTodos(date)
      .then(setTodos)
      .catch(() => setTodos([]));
  }

  useEffect(() => {
    setCheckedForCarry(false);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // One-time "carry forward incomplete tasks" prompt per day — only offered
  // when today's list is still empty, so it never silently duplicates tasks
  // a coach already added themselves.
  useEffect(() => {
    if (todos !== null && todos.length === 0 && !checkedForCarry) {
      setCheckedForCarry(true);
    }
  }, [todos, checkedForCarry]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    const text = newText.trim();
    setNewText("");
    try {
      const created = await api.createTodo({ date, text });
      setTodos((prev) => [...(prev ?? []), created]);
    } catch {
      // best-effort
    }
  }

  async function toggleComplete(todo: TodoData) {
    const updated = await api.updateTodo(todo.id, { is_complete: !todo.is_complete }).catch(() => null);
    if (updated) setTodos((prev) => prev?.map((t) => (t.id === todo.id ? updated : t)) ?? null);
  }

  async function removeTodo(id: string) {
    setTodos((prev) => prev?.filter((t) => t.id !== id) ?? null);
    await api.deleteTodo(id).catch(() => refresh());
  }

  async function carryForward() {
    const carried = await api.carryForwardTodos(date).catch(() => []);
    if (carried.length) setTodos((prev) => [...(prev ?? []), ...carried]);
  }

  function startVoice() {
    setVoiceError(null);
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceError("Voice capture isn't supported in this browser — type your tasks instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = async (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript ?? "";
      setListening(false);
      if (!transcript.trim()) return;
      setBuilding(true);
      try {
        const { created } = await api.voiceParseTodos(transcript, date);
        setTodos((prev) => [...(prev ?? []), ...created]);
      } catch {
        setVoiceError("Couldn't build your list from that. Try typing instead.");
      } finally {
        setBuilding(false);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceError("Didn't catch that — try again, or type your tasks instead.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (todos === null) return null;

  return (
    <Card className="animate-fade-up !p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CheckSquare className="h-4 w-4" weight="fill" />
          </span>
          <h3 className="font-heading text-sm font-semibold text-neutral-900">To-do</h3>
        </div>
        <button
          type="button"
          onClick={listening ? stopVoice : startVoice}
          disabled={building}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            listening ? "bg-accent-600 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
          aria-label="Add tasks by voice"
        >
          <motion.span
            animate={listening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1, repeat: listening ? Infinity : 0 }}
          >
            <Microphone className="h-4 w-4" weight={listening ? "fill" : "regular"} />
          </motion.span>
        </button>
      </div>

      {listening && <p className="mb-2 text-xs font-medium text-accent-600">Listening…</p>}
      {building && <p className="mb-2 text-xs font-medium text-neutral-500">Building your list…</p>}
      {voiceError && <p className="mb-2 text-xs text-accent-600">{voiceError}</p>}

      {todos.length === 0 && (
        <button
          type="button"
          onClick={carryForward}
          className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline"
        >
          <ArrowClockwise className="h-3 w-3" weight="bold" />
          Carry forward yesterday&apos;s incomplete tasks
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {todos.map((todo, i) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, delay: todo.created_via === "voice_ai" ? i * 0.05 : 0 }}
              className="group flex items-center gap-2 rounded-[10px] px-1.5 py-1.5 hover:bg-neutral-50"
            >
              <button
                type="button"
                onClick={() => toggleComplete(todo)}
                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
                  todo.is_complete ? "border-accent-600 bg-accent-600" : "border-neutral-300"
                }`}
                aria-label={todo.is_complete ? "Mark incomplete" : "Mark complete"}
              >
                {todo.is_complete && <CheckSquare className="h-3 w-3 text-white" weight="fill" />}
              </button>
              <span
                className={`flex-1 text-xs transition-all ${
                  todo.is_complete ? "text-neutral-400 line-through" : "text-neutral-800"
                }`}
              >
                {todo.text}
              </span>
              <button
                type="button"
                onClick={() => removeTodo(todo.id)}
                className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-accent-600 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={addTodo} className="mt-2 flex items-center gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add a task…"
          className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-xs text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white"
        />
        <button
          type="submit"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
          aria-label="Add task"
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
        </button>
      </form>
    </Card>
  );
}
