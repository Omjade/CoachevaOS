import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SandboxClient from "./SandboxClient";

export const metadata: Metadata = buildMetadata({
  title: "Interactive Sandbox | Try CoachevaOS With No Signup",
  description:
    "Click through a live mock CoachevaOS workspace — dashboard, clients, calendar, and tasks with dummy data — no email or signup required.",
  path: "/sandbox",
  keywords: [
    "coaching software demo",
    "try coaching software free",
    "coaching platform sandbox",
    "coaching app interactive demo",
  ],
});

export default function SandboxPage() {
  return <SandboxClient />;
}
