"use client";

import { useEffect } from "react";
import { Button, Card } from "@/components/ui";

// Next.js wraps every route segment in an error boundary using this file —
// catches actual render-time exceptions (a component throwing while
// rendering). It does NOT catch unhandled promise rejections from async
// event handlers (a click handler's `await api.x()` failing) — those need
// their own try/catch at the call site, since a rejected promise never
// reaches React's render tree for this boundary to intercept. This is a
// complementary safety net, not a substitute for handling errors locally.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-neutral-100 px-6">
      <Card className="max-w-md text-center">
        <h1 className="font-heading mb-2 text-xl font-semibold text-neutral-900">
          Something went wrong
        </h1>
        <p className="mb-5 text-sm text-neutral-600">
          This page hit an unexpected error. Try again, or head back to your dashboard.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </Card>
    </div>
  );
}
