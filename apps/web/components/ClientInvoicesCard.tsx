"use client";

import { useEffect, useState } from "react";
import { ReceiptIcon as Receipt } from "@phosphor-icons/react";
import { api, InvoiceData } from "@/lib/api";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/currency";

// Read-only mirror of the coach's own invoice ledger for this client — no
// separate record, so it can never drift from what the coach sees. A paid
// invoice doubles as its own receipt here (amount + paid date), rather than
// a second uploaded document that could go out of sync.
export default function ClientInvoicesCard() {
  const [invoices, setInvoices] = useState<InvoiceData[] | null>(null);

  useEffect(() => {
    api
      .getMyInvoices()
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  if (!invoices || invoices.length === 0) return null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-accent-600" weight="fill" />
        <h3 className="font-heading text-sm font-semibold text-neutral-900">
          Invoices &amp; receipts
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-[12px] border border-neutral-200 px-3.5 py-2.5 text-sm"
          >
            <div>
              <p className="font-medium text-neutral-900">{formatMoney(inv.amount, inv.currency)}</p>
              <p className="text-xs text-neutral-500">
                {inv.paid && inv.paid_at
                  ? `Paid ${new Date(inv.paid_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                  : `Due ${new Date(`${inv.due_date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                inv.paid ? "bg-accent-100 text-accent-700" : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {inv.paid ? "Paid" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
