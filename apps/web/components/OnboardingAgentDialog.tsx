"use client";

import { useState } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, OnboardingDraft } from "@/lib/api";
import { Button, ErrorBanner } from "@/components/ui";
import Dialog from "@/components/Dialog";

export default function OnboardingAgentDialog({
  clientId,
  threadId,
  onDone,
}: {
  clientId: string;
  threadId: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [acceptedGoals, setAcceptedGoals] = useState<boolean[]>([]);

  async function open_() {
    setOpen(true);
    setError(null);
    setDraft(null);
    setLoading(true);
    try {
      const result = await api.getOnboardingDraft(clientId);
      setDraft(result);
      setAcceptedGoals(result.suggested_goals.map(() => true));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function acceptAll() {
    if (!draft) return;
    setAccepting(true);
    try {
      if (sendWelcome && threadId) {
        await api.sendMessage(threadId, draft.welcome_message);
      }
      await Promise.all(
        draft.suggested_goals
          .filter((_, i) => acceptedGoals[i])
          .map((g) => api.createClientGoal(clientId, { title: g.title, target_date: g.target_date }))
      );
      setOpen(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={open_}>
        <Sparkle className="h-4 w-4" weight="fill" />
        Draft onboarding
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Onboarding draft">
        {loading && <p className="text-sm text-neutral-500">Drafting…</p>}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {draft && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={sendWelcome}
                  onChange={(e) => setSendWelcome(e.target.checked)}
                  disabled={!threadId}
                />
                Welcome message {!threadId && "(no chat thread yet)"}
              </label>
              <p className="rounded-[10px] bg-neutral-50/60 p-3 text-sm text-neutral-700">
                {draft.welcome_message}
              </p>
            </div>

            {draft.suggested_goals.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-neutral-700">Suggested goals</p>
                <div className="flex flex-col gap-1.5">
                  {draft.suggested_goals.map((g, i) => (
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

            <div>
              <p className="mb-1 text-xs font-semibold text-neutral-700">Suggested check-in cadence</p>
              <p className="text-sm text-neutral-600">{draft.suggested_cadence}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={acceptAll} loading={accepting}>
                Accept all
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
