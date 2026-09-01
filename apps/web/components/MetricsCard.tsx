"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { ChartLineUpIcon as ChartLineUp } from "@phosphor-icons/react";
import { ApiError, MetricDefinition, MetricEntry } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MetricsCard({
  listDefinitions,
  listEntries,
  createEntry,
}: {
  listDefinitions: () => Promise<MetricDefinition[]>;
  listEntries: (definitionId: string) => Promise<MetricEntry[]>;
  createEntry: (
    definitionId: string,
    body: { value: number; recorded_at: string; notes?: string | null }
  ) => Promise<MetricEntry>;
}) {
  const [definitions, setDefinitions] = useState<MetricDefinition[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<MetricEntry[] | null>(null);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayStr());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDefinitions()
      .then((defs) => {
        setDefinitions(defs);
        if (defs.length > 0) setSelectedId(defs[0].id);
      })
      .catch(() => setDefinitions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshEntries(definitionId: string) {
    listEntries(definitionId)
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  useEffect(() => {
    if (selectedId) refreshEntries(selectedId);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !value.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await createEntry(selectedId, { value: Number(value), recorded_at: date, notes: null });
      setValue("");
      setDate(todayStr());
      refreshEntries(selectedId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log that value. Try again.");
    } finally {
      setAdding(false);
    }
  }

  if (!definitions || definitions.length === 0) return null;

  const selected = definitions.find((d) => d.id === selectedId);
  const sorted = entries ? [...entries].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)) : [];
  const latest = sorted[sorted.length - 1];

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <ChartLineUp className="h-4 w-4 text-accent-600" weight="fill" />
        <h3 className="font-heading text-sm font-semibold text-neutral-900">Metrics</h3>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {definitions.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedId(d.id)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              d.id === selectedId
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-neutral-900">
              {latest ? latest.value : "—"}
              {selected.unit && (
                <span className="text-sm font-normal text-neutral-400"> {selected.unit}</span>
              )}
            </p>
            {latest && (
              <p className="text-xs text-neutral-500">
                as of {new Date(latest.recorded_at + "T00:00:00").toLocaleDateString()}
              </p>
            )}
          </div>
          {sorted.length > 1 && (
            <div className="h-12 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sorted}>
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-accent-600)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Log a value…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
        />
        <Button type="submit" loading={adding} disabled={!value.trim()}>
          Log
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-accent-600">{error}</p>}
    </Card>
  );
}
