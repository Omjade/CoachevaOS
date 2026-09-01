"use client";

import { useEffect, useState } from "react";
import { LightningIcon as Lightning, CheckIcon as Check } from "@phosphor-icons/react";
import { api, ApiError, AutomationSettings, ProgramTemplate } from "@/lib/api";
import { Card, Label } from "@/components/ui";

export default function AutomationSettingsCard() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api.getAutomationSettings().then(setSettings).catch(() => {});
    api.listTemplates().then(setTemplates).catch(() => {});
  }, []);

  async function save(partial: Partial<AutomationSettings> & { clear_template?: boolean }) {
    if (!settings) return;
    const previous = settings;
    const next = {
      ...settings,
      ...partial,
      auto_assign_template_id: partial.clear_template
        ? null
        : (partial.auto_assign_template_id ?? settings.auto_assign_template_id),
    };
    setSettings(next);
    setSaveError(null);
    try {
      const updated = await api.updateAutomationSettings(partial);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSettings(previous);
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    }
  }

  if (!settings) return null;

  return (
    <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <Lightning className="h-4.5 w-4.5" weight="fill" />
          </span>
          <div>
            <h3 className="font-heading text-sm font-semibold text-neutral-900">
              New-client automation
            </h3>
            <p className="text-xs text-neutral-500">
              When a new client finishes onboarding, automatically draft an AI welcome message,
              suggest goals, assign a package, schedule their first check-in, and notify you.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={settings.auto_onboarding_enabled}
            onClick={() => save({ auto_onboarding_enabled: !settings.auto_onboarding_enabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              settings.auto_onboarding_enabled ? "bg-accent-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.auto_onboarding_enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-[11px] font-medium ${
              settings.auto_onboarding_enabled ? "text-accent-600" : "text-neutral-400"
            }`}
          >
            {settings.auto_onboarding_enabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {saveError && <p className="mb-3 text-xs text-accent-600">{saveError}</p>}

      {settings.auto_onboarding_enabled && (
        <div>
          <Label htmlFor="automation-template">Auto-assign a package (optional)</Label>
          <select
            id="automation-template"
            value={settings.auto_assign_template_id ?? ""}
            onChange={(e) =>
              save(
                e.target.value
                  ? { auto_assign_template_id: e.target.value }
                  : { clear_template: true }
              )
            }
            className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500"
          >
            <option value="">Don&apos;t auto-assign a package</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {saved && (
            <span className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-600">
              <Check className="h-3.5 w-3.5" weight="bold" />
              Saved
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
