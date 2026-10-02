"use client";

import { useEffect, useState } from "react";
import {
  SparkleIcon as Sparkle,
  CheckIcon as Check,
  ClockCounterClockwiseIcon as ClockCounterClockwise,
  TrayIcon as Inbox,
  SlidersHorizontalIcon as SlidersHorizontal,
  RobotIcon as Robot,
} from "@phosphor-icons/react";
import { api, ApiError, AssistantSettings, AutomationSettings, AgentAction } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";
import { useRoleGuard } from "@/lib/useRoleGuard";

type Tab = "voice" | "agents" | "approvals" | "activity";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent-600" : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ListTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[] | null;
  onChange: (lines: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={(value ?? []).join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").filter((l) => l.trim() !== ""))}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white"
      />
      <p className="mt-1 text-xs text-neutral-400">One per line.</p>
    </div>
  );
}

function FreedomSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-neutral-200 bg-neutral-50/60 px-3 py-1.5 text-xs font-medium text-neutral-700 outline-none focus:border-accent-500"
    >
      <option value="suggest">Suggest only</option>
      <option value="ask_first">Ask me first</option>
      <option value="run_alone">Run on its own</option>
    </select>
  );
}

export default function AgentsPage() {
  const ok = useRoleGuard("coach");
  const [tab, setTab] = useState<Tab>("agents");

  const [voice, setVoice] = useState<AssistantSettings | null>(null);
  const [automation, setAutomation] = useState<AutomationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<AgentAction[] | null>(null);
  const [activity, setActivity] = useState<AgentAction[] | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api.getAssistantSettings().then(setVoice).catch(() => {});
    api.getAutomationSettings().then(setAutomation).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "approvals") {
      api.listPendingAgentActions().then(setPending).catch(() => setPending([]));
    } else if (tab === "activity") {
      api.listAgentActivity().then(setActivity).catch(() => setActivity([]));
    }
  }, [tab]);

  async function saveVoice(partial: Partial<AssistantSettings>) {
    if (!voice) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAssistantSettings(partial);
      setVoice(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAutomation(partial: Partial<AutomationSettings>) {
    if (!automation) return;
    try {
      const updated = await api.updateAutomationSettings(partial);
      setAutomation(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    }
  }

  async function approve(id: string) {
    setActing(id);
    try {
      await api.approveAgentAction(id, editing[id]);
      setPending((prev) => prev?.filter((a) => a.id !== id) ?? null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't approve this. Try again.");
    } finally {
      setActing(null);
    }
  }

  async function skip(id: string) {
    setActing(id);
    try {
      await api.skipAgentAction(id);
      setPending((prev) => prev?.filter((a) => a.id !== id) ?? null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't skip this. Try again.");
    } finally {
      setActing(null);
    }
  }

  if (!ok) return null;

  const TABS: { key: Tab; label: string; Icon: typeof Sparkle }[] = [
    { key: "voice", label: "Your Voice & Rules", Icon: SlidersHorizontal },
    { key: "agents", label: "Your Agents", Icon: Robot },
    { key: "approvals", label: "Approvals", Icon: Inbox },
    { key: "activity", label: "Activity", Icon: ClockCounterClockwise },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <Sparkle className="h-5 w-5" weight="fill" />
        </span>
        <div>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Your AI Team
          </h1>
          <p className="text-sm text-neutral-500">What's working for you, and what needs your OK.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" weight={tab === key ? "fill" : "regular"} />
            {label}
            {key === "approvals" && pending && pending.length > 0 && (
              <span className="ml-0.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "voice" && voice && (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-sm font-semibold text-neutral-900">
                  Pause every agent
                </h2>
                <p className="text-xs text-neutral-500">
                  Stops every proactive/automatic action at once. Read-only features (like asking
                  about a client) still work.
                </p>
              </div>
              <Toggle
                checked={voice.agents_paused}
                onChange={() => saveVoice({ agents_paused: !voice.agents_paused })}
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-heading mb-4 text-sm font-semibold text-neutral-900">Tone & voice</h2>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="tone">Tone (2-3 words)</Label>
                <Input
                  id="tone"
                  defaultValue={voice.tone ?? ""}
                  onBlur={(e) => saveVoice({ tone: e.target.value || null })}
                  placeholder="e.g. warm, direct, encouraging"
                />
              </div>
              <div>
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  defaultValue={voice.languages ?? ""}
                  onBlur={(e) => saveVoice({ languages: e.target.value || null })}
                  placeholder="e.g. English + Hinglish"
                />
              </div>
              <div>
                <Label htmlFor="sign_off">Sign off</Label>
                <Input
                  id="sign_off"
                  defaultValue={voice.sign_off ?? ""}
                  onBlur={(e) => saveVoice({ sign_off: e.target.value || null })}
                  placeholder="e.g. — Coach Maya"
                />
              </div>
              <ListTextarea
                label="Sample messages you've actually sent"
                value={voice.sample_messages}
                onChange={(lines) => saveVoice({ sample_messages: lines })}
                placeholder="Paste 3-5 real messages so agents copy your style"
              />
              <div>
                <Label htmlFor="style_notes">Style notes</Label>
                <textarea
                  id="style_notes"
                  defaultValue={voice.style_notes ?? ""}
                  onBlur={(e) => saveVoice({ style_notes: e.target.value || null })}
                  rows={2}
                  className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
                />
              </div>
              <ListTextarea
                label="Phrases you like to use"
                value={voice.say_phrases}
                onChange={(lines) => saveVoice({ say_phrases: lines })}
              />
              <ListTextarea
                label="Phrases to never use"
                value={voice.never_say_phrases}
                onChange={(lines) => saveVoice({ never_say_phrases: lines })}
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-heading mb-4 text-sm font-semibold text-neutral-900">Quiet hours</h2>
            <p className="mb-3 text-xs text-neutral-500">
              No proactive client messages during these hours, in each client's own timezone.
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <Input
                type="time"
                defaultValue={voice.quiet_hours_start?.slice(0, 5) ?? ""}
                onBlur={(e) => saveVoice({ quiet_hours_start: e.target.value ? `${e.target.value}:00` : null })}
                className="w-28 min-w-0 shrink sm:w-36"
              />
              <span className="shrink-0 text-sm text-neutral-400">to</span>
              <Input
                type="time"
                defaultValue={voice.quiet_hours_end?.slice(0, 5) ?? ""}
                onBlur={(e) => saveVoice({ quiet_hours_end: e.target.value ? `${e.target.value}:00` : null })}
                className="w-28 min-w-0 shrink sm:w-36"
              />
            </div>
          </Card>

          {error && <p className="text-sm text-accent-700">{error}</p>}
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
              <Check className="h-3.5 w-3.5" weight="bold" />
              Saved
            </span>
          )}
        </div>
      )}

      {tab === "agents" && voice && automation && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card>
            <h3 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Briefing Agent</h3>
            <p className="mb-4 text-xs text-neutral-500">
              Reports on your business daily and weekly, and says what to do next.
            </p>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Email it to me each morning</span>
              <Toggle
                checked={automation.email_daily_briefing}
                onChange={() => saveAutomation({ email_daily_briefing: !automation.email_daily_briefing })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Freedom level</span>
              <FreedomSelect
                value={voice.briefing_freedom}
                onChange={(v) => saveVoice({ briefing_freedom: v as AssistantSettings["briefing_freedom"] })}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Client Agent</h3>
            <p className="mb-4 text-xs text-neutral-500">
              Knows every client: session prep, notes, risk, and answers when you ask.
            </p>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Drift sensitivity</span>
              <select
                value={voice.drift_sensitivity}
                onChange={(e) => saveVoice({ drift_sensitivity: e.target.value as AssistantSettings["drift_sensitivity"] })}
                className="rounded-full border border-neutral-200 bg-neutral-50/60 px-3 py-1.5 text-xs font-medium text-neutral-700 outline-none focus:border-accent-500"
              >
                <option value="gentle">Gentle</option>
                <option value="normal">Normal</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Freedom level</span>
              <FreedomSelect
                value={voice.client_agent_freedom}
                onChange={(v) => saveVoice({ client_agent_freedom: v as AssistantSettings["client_agent_freedom"] })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Drift Detector + retention nudges</span>
              <Toggle
                checked={automation.retention_agent_enabled}
                onChange={() => saveAutomation({ retention_agent_enabled: !automation.retention_agent_enabled })}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Client Companion</h3>
            <p className="mb-4 text-xs text-neutral-500">
              Guides each client between sessions — reminders, check-ins, tasks, progress. Tap-only,
              no open chat in this version.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Freedom level</span>
              <FreedomSelect
                value={voice.companion_freedom}
                onChange={(v) => saveVoice({ companion_freedom: v as AssistantSettings["companion_freedom"] })}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Only sends to clients who've consented, one message a day at most.
            </p>
          </Card>
        </div>
      )}

      {tab === "approvals" && (
        <div className="flex flex-col gap-4">
          {pending === null && <p className="text-sm text-neutral-500">Loading…</p>}
          {pending !== null && pending.length === 0 && (
            <Card className="py-10 text-center text-sm text-neutral-500">
              Nothing waiting on you right now.
            </Card>
          )}
          {pending?.map((action) => (
            <Card key={action.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-neutral-900">
                  {action.client_name}
                </span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                  {action.kind.replace("_", " ")}
                </span>
              </div>
              <textarea
                defaultValue={action.draft_message}
                onChange={(e) => setEditing((prev) => ({ ...prev, [action.id]: e.target.value }))}
                rows={3}
                className="mb-3 w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => skip(action.id)} disabled={acting === action.id}>
                  Skip
                </Button>
                <Button size="sm" onClick={() => approve(action.id)} disabled={acting === action.id}>
                  {acting === action.id ? "Sending…" : "Approve & send"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <Card className="overflow-x-auto p-0">
          {activity === null && <p className="p-6 text-sm text-neutral-500">Loading…</p>}
          {activity !== null && activity.length === 0 && (
            <p className="p-6 text-center text-sm text-neutral-500">No agent activity yet.</p>
          )}
          {activity !== null && activity.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/60 text-xs text-neutral-500">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-neutral-900">{a.client_name}</td>
                    <td className="px-4 py-3 text-neutral-600">{a.kind.replace("_", " ")}</td>
                    <td className="max-w-[300px] truncate px-4 py-3 text-neutral-600">{a.draft_message}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : a.status === "skipped"
                              ? "bg-neutral-200 text-neutral-500"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
