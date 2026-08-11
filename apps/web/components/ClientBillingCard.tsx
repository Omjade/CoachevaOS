"use client";

import { useEffect, useState } from "react";
import { CheckIcon as Check } from "@phosphor-icons/react";
import { api, ClientBilling, ClientBillingStatus } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

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

export default function ClientBillingCard({ clientId }: { clientId: string }) {
  const [billing, setBilling] = useState<ClientBilling | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saved, setSaved] = useState(false);

  function refresh() {
    api.getClientBilling(clientId).then((b) => {
      setBilling(b);
      setValidUntil(b.subscription_valid_until ?? "");
    });
  }

  useEffect(refresh, [clientId]);

  async function saveValidUntil() {
    await api.updateClientSubscription(clientId, validUntil || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  }

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !dueDate) return;
    await api.addInvoice(clientId, { amount: Number(amount), due_date: dueDate });
    setAmount("");
    setDueDate("");
    refresh();
  }

  async function togglePaid(invoiceId: string) {
    await api.toggleInvoicePaid(invoiceId);
    refresh();
  }

  if (!billing) return null;

  return (
    <Card>
      <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">Billing</h3>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-600">
            Subscription valid until
          </label>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-44"
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
              <button
                onClick={() => togglePaid(inv.id)}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  inv.paid ? "bg-accent-100 text-accent-700" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {inv.paid ? "Paid" : "Pending"}
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addInvoice} className="flex items-end gap-2">
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
      </form>
    </Card>
  );
}
