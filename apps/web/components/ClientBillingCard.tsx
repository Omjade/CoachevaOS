"use client";

import { useEffect, useState } from "react";
import { CheckIcon as Check, SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, ClientBilling, ClientBillingStatus, Program } from "@/lib/api";
import { Button, Card, ErrorBanner, Input } from "@/components/ui";
import Dialog from "@/components/Dialog";

function isOverdue(dueDate: string, paid: boolean): boolean {
  return !paid && dueDate < new Date().toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<ClientBillingStatus, string> = {
  not_set: "Not set",
  active: "Active",
  renewal_due: "Renewal due",
  overdue: "Overdue",
};

const STATUS_CLASS: Record<ClientBillingStatus, string> = {
  not_set: "bg-neutral-200 text-neutral-700",
  active: "bg-accent-100 text-accent-700",
  renewal_due: "bg-accent-200 text-accent-800 font-semibold",
  overdue: "bg-accent-300 text-accent-900 font-semibold",
};

export default function ClientBillingCard({
  clientId,
  threadId,
}: {
  clientId: string;
  threadId?: string | null;
}) {
  const [billing, setBilling] = useState<ClientBilling | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saved, setSaved] = useState(false);
  const [reminderInvoiceId, setReminderInvoiceId] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  async function openReminder(invoiceId: string) {
    setReminderInvoiceId(invoiceId);
    setReminderDraft("");
    setReminderError(null);
    setReminderLoading(true);
    try {
      const result = await api.getInvoiceReminderDraft(invoiceId);
      setReminderDraft(result.draft_message);
    } catch (err) {
      setReminderError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setReminderLoading(false);
    }
  }

  async function sendReminder() {
    if (!threadId) return;
    setReminderSending(true);
    try {
      await api.sendMessage(threadId, reminderDraft);
      setReminderInvoiceId(null);
    } catch (err) {
      setReminderError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setReminderSending(false);
    }
  }

  function refresh() {
    api.getClientBilling(clientId).then((b) => {
      setBilling(b);
      setValidFrom(b.subscription_valid_from ?? "");
      setValidUntil(b.subscription_valid_until ?? "");
    });
  }

  useEffect(refresh, [clientId]);
  useEffect(() => {
    api
      .listClientPrograms(clientId)
      .then((programs) => setProgram(programs[0] ?? null))
      .catch(() => {});
  }, [clientId]);

  async function saveValidUntil() {
    setBillingError(null);
    try {
      await api.updateClientSubscription(clientId, validUntil || null, validFrom || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refresh();
    } catch (err) {
      setBillingError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    }
  }

  // Extends from the current valid-until date when set, otherwise from today
  // — a coach extending a lapsed subscription almost always means "N more
  // days from now," not "N more days from whenever it originally lapsed."
  async function extendBy(days: number) {
    const base = validUntil ? new Date(`${validUntil}T00:00:00`) : new Date();
    const from = validUntil && base > new Date() ? base : new Date();
    from.setDate(from.getDate() + days);
    const nextValidUntil = from.toISOString().slice(0, 10);
    setBillingError(null);
    try {
      await api.updateClientSubscription(clientId, nextValidUntil, validFrom || null);
      setValidUntil(nextValidUntil);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refresh();
    } catch (err) {
      setBillingError(err instanceof ApiError ? err.message : "Couldn't extend. Try again.");
    }
  }

  // Presets from the coach's own recent invoice amounts (deduped, most recent
  // first) plus a couple of sane fallbacks when there's no history yet.
  const presetAmounts = (() => {
    const fromHistory = Array.from(
      new Set((billing?.invoices ?? []).map((inv) => inv.amount))
    ).slice(0, 4);
    if (fromHistory.length > 0) return fromHistory;
    return [50, 100];
  })();

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !dueDate) return;
    setBillingError(null);
    try {
      await api.addInvoice(clientId, { amount: Number(amount), due_date: dueDate });
      setAmount("");
      setDueDate("");
      refresh();
    } catch (err) {
      setBillingError(err instanceof ApiError ? err.message : "Couldn't add that invoice. Try again.");
    }
  }

  async function togglePaid(invoiceId: string) {
    setBillingError(null);
    try {
      await api.toggleInvoicePaid(invoiceId);
      refresh();
    } catch (err) {
      setBillingError(err instanceof ApiError ? err.message : "Couldn't update that invoice. Try again.");
    }
  }

  if (!billing) return null;

  return (
    <Card>
      <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">Billing</h3>

      {program && program.price_amount != null && (
        <div className="mb-4 rounded-[12px] bg-neutral-50/60 px-3.5 py-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-700">Package: {program.title}</span>
            <span className="font-medium text-neutral-900">
              {program.price_currency ?? ""} {program.price_amount}
              {program.billing_cadence && program.billing_cadence !== "one_time"
                ? ` / ${program.billing_cadence}`
                : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Package pricing shown here is for your own reference. Invoices below are tracked
            separately.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-600">
            Subscription valid from
          </label>
          <Input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-600">
            Valid until
          </label>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-40"
          />
        </div>
        <Button type="button" variant="secondary" onClick={saveValidUntil}>
          {saved ? (
            <>
              <Check className="h-4 w-4" weight="bold" />
              Saved
            </>
          ) : (
            "Save"
          )}
        </Button>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_CLASS[billing.status]}`}>
          {STATUS_LABEL[billing.status]}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-neutral-500">Extend:</span>
        {[30, 90, 365].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => extendBy(days)}
            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            +{days === 365 ? "1 year" : `${days} days`}
          </button>
        ))}
      </div>
      {billingError && <p className="mb-3 text-xs text-accent-600">{billingError}</p>}

      <div className="mb-3 flex flex-col gap-2">
        {billing.invoices.length === 0 ? (
          <p className="text-sm text-neutral-600">No invoices yet.</p>
        ) : (
          billing.invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-sm border border-divider px-3 py-2.5 text-sm"
            >
              <span>
                ${inv.amount.toFixed(2)} · due {inv.due_date}
              </span>
              <div className="flex items-center gap-2">
                {isOverdue(inv.due_date, inv.paid) && (
                  <button
                    type="button"
                    onClick={() => openReminder(inv.id)}
                    className="flex items-center gap-1 rounded-full border border-accent-200 px-2.5 py-0.5 text-xs font-medium text-accent-700 hover:bg-accent-100"
                  >
                    <Sparkle className="h-3 w-3" weight="fill" />
                    AI reminder
                  </button>
                )}
                <button
                  onClick={() => togglePaid(inv.id)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    inv.paid ? "bg-accent-100 text-accent-700" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {inv.paid ? "Paid" : "Pending"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addInvoice} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-neutral-500">Quick amount:</span>
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                amount === String(preset)
                  ? "border-accent-500 bg-accent-50 text-accent-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              ${preset.toFixed(preset % 1 === 0 ? 0 : 2)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-600">
              Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-600">
              Due date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button type="submit" variant="secondary">
            + Add invoice
          </Button>
        </div>
      </form>

      <Dialog
        open={reminderInvoiceId !== null}
        onClose={() => setReminderInvoiceId(null)}
        title="Payment reminder draft"
      >
        {reminderLoading && <p className="text-sm text-neutral-500">Drafting…</p>}
        {reminderError && <ErrorBanner>{reminderError}</ErrorBanner>}
        {!reminderLoading && reminderDraft && (
          <div className="flex flex-col gap-4">
            <textarea
              value={reminderDraft}
              onChange={(e) => setReminderDraft(e.target.value)}
              rows={4}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500"
            />
            {!threadId && (
              <p className="text-xs text-neutral-500">
                No chat thread with this client yet. Copy this text manually.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setReminderInvoiceId(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={sendReminder} loading={reminderSending} disabled={!threadId}>
                Send to client
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Card>
  );
}
