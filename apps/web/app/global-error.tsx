"use client";

// Catches errors thrown by the root layout itself (app/error.tsx can't,
// since it renders inside that layout) — must define its own <html>/<body>
// since it fully replaces the root layout when active. Deliberately plain
// inline styles rather than the app's normal Tailwind/token classes: this is
// the last-resort fallback, so it shouldn't depend on anything that could
// itself be part of what broke.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: "sans-serif",
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#5f6267", fontSize: 14, maxWidth: 360 }}>
            The app hit an unexpected error. Try again, or reload the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#ff6650",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
