"use client";

import { useMemo, useState } from "react";
import { Card, Input, Label } from "@/components/ui";

export default function ChurnCalculator() {
  const [activeClients, setActiveClients] = useState(30);
  const [monthlyChurnPercent, setMonthlyChurnPercent] = useState(8);
  const [avgClientValue, setAvgClientValue] = useState(400);

  const result = useMemo(() => {
    const clientsLostPerMonth = activeClients * (monthlyChurnPercent / 100);
    const monthlyLoss = clientsLostPerMonth * avgClientValue;
    return {
      clientsLostPerMonth: Math.round(clientsLostPerMonth * 10) / 10,
      monthlyLoss: Math.round(monthlyLoss),
      annualLoss: Math.round(monthlyLoss * 12),
    };
  }, [activeClients, monthlyChurnPercent, avgClientValue]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div>
          <Label>Active clients right now</Label>
          <Input
            type="number"
            min={0}
            value={activeClients}
            onChange={(e) => setActiveClients(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Monthly churn rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={monthlyChurnPercent}
            onChange={(e) => setMonthlyChurnPercent(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Average client value, per month ($)</Label>
          <Input
            type="number"
            min={0}
            value={avgClientValue}
            onChange={(e) => setAvgClientValue(Number(e.target.value) || 0)}
          />
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 bg-neutral-900 text-center">
        <p className="text-xs tracking-wide text-neutral-400 uppercase">Revenue lost to churn, per year</p>
        <p className="font-heading text-5xl font-semibold text-accent-500">${result.annualLoss.toLocaleString()}</p>
        <p className="text-sm text-neutral-300">
          about {result.clientsLostPerMonth} client{result.clientsLostPerMonth === 1 ? "" : "s"} lost a month
        </p>
        <p className="mt-4 text-xs text-neutral-500">
          That's ${result.monthlyLoss.toLocaleString()} a month, at your current churn rate.
        </p>
      </Card>
    </div>
  );
}
