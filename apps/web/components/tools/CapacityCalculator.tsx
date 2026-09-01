"use client";

import { useMemo, useState } from "react";
import { Card, Input, Label } from "@/components/ui";

export default function CapacityCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [sessionLength, setSessionLength] = useState(45);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
  const [adminMinutes, setAdminMinutes] = useState(20);

  const result = useMemo(() => {
    const minutesPerClientPerWeek = sessionsPerWeek * sessionLength + adminMinutes;
    const availableMinutes = hoursPerWeek * 60;
    if (minutesPerClientPerWeek <= 0) return { maxClients: 0, minutesPerClientPerWeek: 0 };
    return {
      maxClients: Math.floor(availableMinutes / minutesPerClientPerWeek),
      minutesPerClientPerWeek,
    };
  }, [hoursPerWeek, sessionLength, sessionsPerWeek, adminMinutes]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div>
          <Label>Hours available for client work per week</Label>
          <Input
            type="number"
            min={1}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Average session length (minutes)</Label>
          <Input
            type="number"
            min={1}
            value={sessionLength}
            onChange={(e) => setSessionLength(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Sessions per client, per week</Label>
          <Input
            type="number"
            min={0}
            step={0.25}
            value={sessionsPerWeek}
            onChange={(e) => setSessionsPerWeek(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Admin/prep time per client, per week (minutes)</Label>
          <Input
            type="number"
            min={0}
            value={adminMinutes}
            onChange={(e) => setAdminMinutes(Number(e.target.value) || 0)}
          />
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 bg-neutral-900 text-center">
        <p className="text-xs tracking-wide text-neutral-400 uppercase">Realistic client capacity</p>
        <p className="font-heading text-5xl font-semibold text-white">{result.maxClients}</p>
        <p className="text-sm text-neutral-300">active clients per week</p>
        <p className="mt-4 text-xs text-neutral-500">
          Based on {result.minutesPerClientPerWeek} minutes of session + admin time per client, per
          week.
        </p>
      </Card>
    </div>
  );
}
