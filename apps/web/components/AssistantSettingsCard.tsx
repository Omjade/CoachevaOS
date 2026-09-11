"use client";

import { useEffect, useState } from "react";
import { SparkleIcon as Sparkle, CheckIcon as Check } from "@phosphor-icons/react";
import { api, ApiError, AssistantSettings } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";

export default function AssistantSettingsCard() {
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api.getAssistantSettings().then(setSettings).catch(() => {});
  }, []);

  async function save(partial: Partial<AssistantSettings>) {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, ...partial };
    setSettings(next);
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.updateAssistantSettings(partial);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Revert the optimistic update — a failed save shouldn't leave the
      // toggle/field looking applied when the server never confirmed it.
      setSettings(previous);
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <Sparkle className="h-4.5 w-4.5" weight="fill" />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-neutral-900">
              Client AI Assistant
            </h3>
            <p className="text-xs text-neutral-500">
              Lets clients ask questions between check-ins. Strictly scoped, never gives
              medical/legal/financial advice, and escalates anything it can&apos;t answer to you.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => save({ enabled: !settings.enabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              settings.enabled ? "bg-accent-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-[11px] font-medium ${
              settings.enabled ? "text-accent-600" : "text-neutral-400"
            }`}
          >
            {settings.enabled ? "On: visible to your clients" : "Off: hidden from your clients"}
          </span>
        </div>
      </div>

      {saveError && <p className="mb-3 text-xs text-accent-600">{saveError}</p>}

      {settings.enabled && (
        <div className="flex flex-col gap-3.5">
          <div>
            <Label htmlFor="assistant-tone">Tone</Label>
            <Input
              id="assistant-tone"
              placeholder="e.g. warm and encouraging, but direct"
              value={settings.tone ?? ""}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
              onBlur={() => save({ tone: settings.tone })}
            />
          </div>
          <div>
            <Label htmlFor="assistant-style">Style notes</Label>
            <textarea
              id="assistant-style"
              rows={2}
              value={settings.style_notes ?? ""}
              onChange={(e) => setSettings({ ...settings, style_notes: e.target.value })}
              onBlur={() => save({ style_notes: settings.style_notes })}
              className="w-full resize-none rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <Label htmlFor="assistant-instructions">Additional instructions</Label>
            <textarea
              id="assistant-instructions"
              rows={2}
              placeholder="Anything specific you want it to know or avoid"
              value={settings.custom_instructions ?? ""}
              onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
              onBlur={() => save({ custom_instructions: settings.custom_instructions })}
              className="w-full resize-none rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <Label htmlFor="assistant-limit">
              Daily question limit per client (max {settings.platform_query_ceiling})
            </Label>
            <Input
              id="assistant-limit"
              type="number"
              min={1}
              max={settings.platform_query_ceiling}
              value={settings.daily_query_limit}
              onChange={(e) => setSettings({ ...settings, daily_query_limit: Number(e.target.value) })}
              onBlur={() => save({ daily_query_limit: settings.daily_query_limit })}
              className="w-24"
            />
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
              <Check className="h-3.5 w-3.5" weight="bold" />
              Saved
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
