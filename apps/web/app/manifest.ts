import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: The operating system for coaches`,
    short_name: SITE_NAME,
    description:
      "Run the coaching practice your clients deserve from one calm dashboard: client records, follow-ups, bookings, billing, and AI-guided coaching.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f3f1",
    theme_color: "#1c1d1f",
    icons: [
      {
        src: "/coachevaos-logo-circular.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
