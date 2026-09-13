"use client";

import { useState } from "react";
import Image from "next/image";
import { copyText } from "@/lib/clipboard";

// One shared question, phrased so each engine's answer actually explains the
// product rather than just repeating the name back.
const PROMPT =
  "What is CoachevaOS, and how does it help independent coaches run their coaching business — scheduling, client management, billing, and AI tools?";

// Each service's own documented (or widely-used) URL param for landing on a
// pre-filled/auto-run query, so "Ask AI" is a single click rather than a
// copy-paste round trip wherever the target actually honors it.
const ASSISTANTS: {
  label: string;
  logo: string;
  url: (q: string) => string;
}[] = [
  { label: "ChatGPT", logo: "/Chatgptlogo.jpeg", url: (q) => `https://chatgpt.com/?q=${q}` },
  { label: "Perplexity", logo: "/perplxity.jpeg", url: (q) => `https://www.perplexity.ai/search?q=${q}` },
  { label: "Claude", logo: "/Claude.jpeg", url: (q) => `https://claude.ai/new?q=${q}` },
  { label: "Google", logo: "/gemini.jpeg", url: (q) => `https://www.google.com/search?q=${q}&udm=50` },
  { label: "Grok", logo: "/grok.jpeg", url: (q) => `https://grok.com/?q=${q}` },
];

export default function AskAiRow() {
  const [copied, setCopied] = useState(false);

  async function ask(buildUrl: (q: string) => string) {
    // Belt and suspenders: the URL param pre-fills (and on some of these,
    // auto-runs) the question, but not every engine honors it forever —
    // the prompt is also on the clipboard so a paste always works.
    await copyText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(buildUrl(encodeURIComponent(PROMPT)), "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-900 uppercase">
        Ask AI about CoachevaOS
      </p>
      <div className="flex items-center gap-2">
        {ASSISTANTS.map(({ label, logo, url }) => (
          <button
            key={label}
            type="button"
            onClick={() => ask(url)}
            aria-label={`Ask ${label} about CoachevaOS`}
            title={`Ask ${label} about CoachevaOS`}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_4px_10px_rgba(28,29,31,0.12)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Image src={logo} alt={label} width={32} height={32} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-400" role="status">
        {copied ? "Question copied — paste it if the chat doesn't pre-fill." : "Opens in a new tab."}
      </p>
    </div>
  );
}
