"use client";

import { useState } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { api, ApiError, AskSource } from "@/lib/api";
import { Button, Card, ErrorBanner, Input } from "@/components/ui";

export default function AskDocuments() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<AskSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.askDocuments(question.trim());
      setAnswer(result.answer);
      setSources(result.sources);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <Sparkle className="h-4 w-4 text-accent-600" weight="fill" />
        <h3 className="font-heading text-sm font-semibold text-neutral-900">
          Ask your documents
        </h3>
      </div>
      <p className="mb-3 text-xs text-neutral-500">
        Answers are grounded in your own uploaded PDFs and text files only.
      </p>
      <form onSubmit={handleAsk} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. what's my standard 12-week structure?"
          className="flex-1"
        />
        <Button type="submit" loading={loading} disabled={!question.trim()}>
          Ask
        </Button>
      </form>

      {error && (
        <div className="mt-3">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-[12px] bg-neutral-50/60 p-3.5">
          <p className="text-sm text-neutral-800">{answer}</p>
          {sources.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-200 pt-3">
              <p className="text-xs font-semibold text-neutral-500">Sources</p>
              {sources.map((s, i) => (
                <p key={i} className="text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">{s.document_name}</span>:{" "}
                  {s.snippet}…
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
