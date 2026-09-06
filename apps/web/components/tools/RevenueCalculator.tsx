"use client";

import { useMemo, useState } from "react";
import { Card, Input, Label } from "@/components/ui";

export default function RevenueCalculator() {
  const [targetMonthly, setTargetMonthly] = useState(10000);
  const [pricePerClient, setPricePerClient] = useState(400);
  const [monthlyChurnPercent, setMonthlyChurnPercent] = useState(5);

  const result = useMemo(() => {
    if (pricePerClient <= 0) return { clientsNeeded: 0, newClientsPerMonth: 0 };
    const clientsNeeded = Math.ceil(targetMonthly / pricePerClient);
    const newClientsPerMonth = Math.ceil(clientsNeeded * (monthlyChurnPercent / 100));
    return { clientsNeeded, newClientsPerMonth };
  }, [targetMonthly, pricePerClient, monthlyChurnPercent]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div>
          <Label>Target monthly income ($)</Label>
          <Input
            type="number"
            min={0}
            value={targetMonthly}
            onChange={(e) => setTargetMonthly(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Average price per client, per month ($)</Label>
          <Input
            type="number"
            min={1}
            value={pricePerClient}
            onChange={(e) => setPricePerClient(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Expected monthly churn (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={monthlyChurnPercent}
            onChange={(e) => setMonthlyChurnPercent(Number(e.target.value) || 0)}
          />
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 bg-neutral-900 text-center">
        <p className="text-xs tracking-wide text-neutral-400 uppercase">Clients needed</p>
        <p className="font-heading text-5xl font-semibold text-accent-500">{result.clientsNeeded}</p>
        <p className="text-sm text-neutral-300">active clients at that price point</p>
        <p className="mt-4 text-xs text-neutral-500">
          At {monthlyChurnPercent}% monthly churn, plan to bring in roughly {result.newClientsPerMonth} new
          client{result.newClientsPerMonth === 1 ? "" : "s"} a month just to hold steady.
        </p>
      </Card>
    </div>
  );
}
