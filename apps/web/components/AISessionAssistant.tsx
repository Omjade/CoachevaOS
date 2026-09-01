"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon as Check, SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, SessionNoteResult } from "@/lib/api";
import { Button, Card } from "@/components/ui";

type VoiceState = "idle" | "recording";

// Minimal shape for the Web Speech API — not in standard TS DOM lib.
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

export default function AISessionAssistant({ clientId }: { clientId: string }) {
  const [text, setText] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SessionNoteResult | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [acceptedGoals, setAcceptedGoals] = useState<boolean[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<boolean[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechSupported = getSpeechRecognition() !== null;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  function startRecording() {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = text ? text + " " : "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setText(finalText + interim);
    };
    recognition.onerror = () => stopRecording();
    recognition.onend = () => {
      if (voiceState === "recording") stopRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("recording");
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= 60) {
          stopRecording();
          return 60;
        }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setVoiceState("idle");
  }

  async function generate() {
    if (!text.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.createSessionNote(clientId, text.trim());
      setResult(res);
      setDraft(res.draft_message);
      setAcceptedGoals(res.suggested_goal_updates.map(() => true));
      setAcceptedTasks(res.suggested_tasks.map(() => true));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  function discard() {
    setResult(null);
    setDraft("");
    setText("");
    setAcceptedGoals([]);
    setAcceptedTasks([]);
  }

  async function send() {
    if (!result) return;
    setSending(true);
    setError(null);
    try {
      await api.sendFollowup(clientId, draft, {
        sessionSummary: result.summary,
        acceptedGoalUpdates: result.suggested_goal_updates.filter((_, i) => acceptedGoals[i]),
        acceptedTasks: result.suggested_tasks.filter((_, i) => acceptedTasks[i]),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        discard();
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Card>
      <h3 className="font-heading mb-3 text-lg font-semibold">AI Session Assistant</h3>

      {result ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-600">Summary</p>
            <p className="text-sm">{result.summary}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-600">Action items</p>
            <ul className="list-inside list-disc text-sm">
              {result.action_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-600">
              Follow-up message
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full rounded-sm border border-divider bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent-500"
            />
          </div>
          {result.suggested_goal_updates.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-neutral-600">
                Suggested goal updates
              </p>
              <div className="flex flex-col gap-1.5">
                {result.suggested_goal_updates.map((g, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={acceptedGoals[i] ?? true}
                      onChange={(e) =>
                        setAcceptedGoals((prev) => {
                          const next = [...prev];
                          next[i] = e.target.checked;
                          return next;
                        })
                      }
                    />
                    {g.title}
                    {g.target_date && (
                      <span className="text-xs text-neutral-400">
                        by {new Date(g.target_date + "T00:00:00").toLocaleDateString()}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          {result.suggested_tasks.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-neutral-600">
                Suggested tasks
              </p>
              <div className="flex flex-col gap-1.5">
                {result.suggested_tasks.map((t, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={acceptedTasks[i] ?? true}
                      onChange={(e) =>
                        setAcceptedTasks((prev) => {
                          const next = [...prev];
                          next[i] = e.target.checked;
                          return next;
                        })
                      }
                    />
                    {t.title}
                    {t.due_date && (
                      <span className="text-xs text-neutral-400">
                        by {new Date(t.due_date + "T00:00:00").toLocaleDateString()}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-accent-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={discard}>
              Discard
            </Button>
            <Button type="button" onClick={send} disabled={sending || sent}>
              {sent ? (
                <>
                  <Check className="h-4 w-4" weight="bold" />
                  Sent
                </>
              ) : sending ? (
                "Sending…"
              ) : (
                "Review & send to client"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a quick summary..."
            rows={4}
            disabled={voiceState === "recording"}
            className="w-full rounded-sm border border-divider bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent-500 disabled:opacity-60"
          />
          {voiceState === "recording" && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Recording… {mm}:{ss}
            </div>
          )}
          {error && <p className="text-sm text-accent-700">{error}</p>}
          <div className="flex flex-wrap gap-3">
            {voiceState === "recording" ? (
              <Button type="button" variant="secondary" onClick={stopRecording}>
                Stop & transcribe
              </Button>
            ) : (
              speechSupported && (
                <Button type="button" variant="secondary" onClick={startRecording}>
                  Record voice note
                </Button>
              )
            )}
            <Button
              type="button"
              onClick={generate}
              disabled={generating || !text.trim() || voiceState === "recording"}
            >
              {generating ? (
                "Generating…"
              ) : (
                <>
                  <Sparkle className="h-4 w-4" weight="fill" />
                  Generate follow-up
                </>
              )}
            </Button>
          </div>
          {!speechSupported && (
            <p className="text-xs text-neutral-600">
              Voice notes need a Chromium-based browser (Chrome/Edge). Typed notes work
              everywhere.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
