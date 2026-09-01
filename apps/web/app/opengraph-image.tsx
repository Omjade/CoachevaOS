import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated server-side rather than a static asset — no external design
// tooling needed, and it stays in sync with the brand tokens in globals.css
// (accent-600 #ff4b38 on neutral-900 #1c1d1f) without a second source of truth.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1d1f",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
              color: "#1c1d1f",
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#ffffff" }}>
            CoachevaOS
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#ff6650",
            fontWeight: 600,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          The operating system for coaches
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#b8b8b6",
            marginTop: 20,
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Clients, leads, bookings, billing, and AI-guided coaching in one calm dashboard.
        </div>
      </div>
    ),
    { ...size }
  );
}
