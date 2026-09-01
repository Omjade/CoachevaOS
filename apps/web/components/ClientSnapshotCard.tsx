"use client";

import { useState } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, ClientSnapshot } from "@/lib/api";
import { Button, Card } from "@/components/ui";

export default function ClientSnapshotCard({ clientId }: { clientId: string }) {
  const [snapshot, setSnapshot] = useState<ClientSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await api.getClientSnapshot(clientId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-neutral-900">
          Ask AI: how is this client doing?
        </h3>
        <Button type="button" variant="secondary" onClick={generate} loading={loading}>
          <Sparkle className="h-4 w-4" weight="fill" />
          {snapshot ? "Refresh" : "Generate"}
        </Button>
      </div>
      {error && <p className="text-sm text-accent-700">{error}</p>}
      {snapshot && (
        <>
          <p className="text-sm leading-relaxed text-neutral-800">{snapshot.narrative}</p>
          <p className="mt-2 text-xs text-neutral-400">
            Generated {new Date(snapshot.generated_at).toLocaleString()}
          </p>
        </>
      )}
    </Card>
  );
}
