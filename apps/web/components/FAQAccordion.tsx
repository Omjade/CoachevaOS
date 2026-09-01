"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon as Plus, MinusIcon as Minus } from "@phosphor-icons/react";

export interface FAQItem {
  q: string;
  a: string;
}

function FaqRow({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[17px] border border-neutral-300/50 bg-white px-6 shadow-[0_10px_20px_rgba(28,29,31,0.05)] transition-all duration-300 ${
        open ? "hover:-translate-y-0" : "hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(28,29,31,0.08)]"
      }`}
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left">
        <span className="pr-4 text-[13px] font-medium text-neutral-900 md:text-sm">{q}</span>
        <span
          className={`flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_6px_12px_rgba(28,29,31,0.3)] transition-transform duration-300 hover:scale-105 ${
            open ? "rotate-180" : ""
          }`}
        >
          {open ? <Minus className="h-2.5 w-2.5" weight="bold" /> : <Plus className="h-2.5 w-2.5" weight="bold" />}
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="border-t border-neutral-200/70 pt-3 pb-5">
          <p className="text-[12px] leading-relaxed text-neutral-500 md:text-[13px]">{a}</p>
        </div>
      </motion.div>
    </div>
  );
}

// Reused across the landing page and every new commercial/comparison page —
// same accordion interaction everywhere, plus FAQPage JSON-LD so the answers
// are eligible for a rich result and structured for AI-answer-engine
// extraction (each `a` should already be a self-contained 40-70 word answer
// with no "as mentioned above" — that's a copy responsibility of the caller,
// this component just emits it faithfully as structured data).
export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState(0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="mx-auto flex max-w-[550px] flex-col gap-3 text-left">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {items.map((item, i) => (
        <FaqRow key={item.q} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(i)} />
      ))}
    </div>
  );
}
