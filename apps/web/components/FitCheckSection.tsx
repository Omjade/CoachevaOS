"use client";

import { motion } from "framer-motion";
import { CheckIcon as Check } from "@phosphor-icons/react";

// The positioning move: stop describing the product, describe the person it's
// for. Deliberately written to be niche-agnostic — a brand-new life coach and
// a ten-year fitness coach with 200 clients should both read these and think
// "yes, that's me," never "this is for a bigger/fancier practice than mine."
// No statement implies a reader who doesn't relate is doing something wrong.
// `highlight` is the phrase that gets the marker-sweep treatment below.
const STATEMENTS: { text: string; highlight: string }[] = [
  {
    text: "You want every client to feel like your only client — whether you coach five people or five hundred.",
    highlight: "your only client",
  },
  {
    text: "You'd rather a client's question get a real answer than get lost three scrolls up in your DMs.",
    highlight: "a real answer",
  },
  {
    text: "You believe a client who feels taken care of is a client who stays — no matter what you coach.",
    highlight: "is a client who stays",
  },
  {
    text: "You're tired of being your own admin, your own biller, and your own tech support on top of the actual coaching.",
    highlight: "on top of the actual coaching",
  },
  {
    text: "You want your practice to look as considered as your coaching already is, from the very first message you send.",
    highlight: "as considered as your coaching already is",
  },
];

// Same "giant faint numeral behind the card" language as the footer's giant
// low-opacity "CoachevaOS" watermark — reusing an already-established brand
// motif here instead of inventing a one-off decoration.
function GhostNumeral({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="font-heading pointer-events-none absolute -top-6 -right-2 text-[96px] leading-none font-bold text-white/[0.06] select-none md:text-[130px]"
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function HighlightedText({ text, highlight, delay }: { text: string; highlight: string; delay: number }) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const after = text.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span className="relative inline whitespace-normal font-semibold text-accent-400">
        {highlight}
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: delay + 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 -bottom-0.5 h-[2.5px] origin-left rounded-full bg-accent-500"
        />
      </span>
      {after}
    </>
  );
}

// Each card gets its own dark gradient (never plain flat black) so the row
// reads as a set of distinct, considered objects rather than five identical
// boxes — same energy as the contact-card treatment on the public profile,
// pushed further with a per-card hue drift and a hover glow.
const CARD_GRADIENTS = [
  "from-neutral-900 via-neutral-800 to-accent-900/60",
  "from-[#241a2e] via-neutral-900 to-accent-900/50",
  "from-neutral-900 via-[#2a1f1a] to-accent-800/40",
  "from-[#1b2430] via-neutral-900 to-accent-900/50",
  "from-neutral-900 via-[#231a22] to-accent-800/50",
];

function StatementCard({
  text,
  highlight,
  index,
}: {
  text: string;
  highlight: string;
  index: number;
}) {
  const fromLeft = index % 2 === 0;
  const delay = index * 0.15;
  return (
    <motion.li
      initial={{ opacity: 0, x: fromLeft ? -60 : 60, rotate: fromLeft ? -3 : 3 }}
      whileInView={{ opacity: 1, x: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.015, rotate: 0 }}
      className={`group relative w-full max-w-[560px] overflow-hidden rounded-[20px] bg-gradient-to-br p-6 shadow-[0_18px_40px_rgba(28,29,31,0.22)] transition-shadow duration-300 hover:shadow-[0_26px_56px_rgba(255,75,56,0.28)] md:p-7 ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} ${
        fromLeft ? "self-start" : "self-end"
      }`}
    >
      {/* A soft glow that only appears on hover, sweeping in from the
          checkmark corner — the one purely decorative "wow" touch, kept
          behind everything else so it never fights the text for attention. */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-accent-500/0 blur-2xl transition-colors duration-500 group-hover:bg-accent-500/30" />

      <GhostNumeral n={index + 1} />
      <motion.span
        initial={{ scale: 0, rotate: -25 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: 0.5,
          delay: delay + 0.25,
          type: "spring",
          stiffness: 300,
          damping: 16,
        }}
        className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-white shadow-[0_0_0_4px_rgba(255,102,80,0.18)] transition-shadow duration-300 group-hover:shadow-[0_0_0_7px_rgba(255,102,80,0.28)]"
      >
        <Check className="h-4.5 w-4.5" weight="bold" />
      </motion.span>
      <p className="relative text-[16px] leading-relaxed text-neutral-200 md:text-[17px]">
        <HighlightedText text={text} highlight={highlight} delay={delay} />
      </p>
    </motion.li>
  );
}

// Slow, breathing blurred color fields — pure ambience, never sharp enough
// to compete with the text sitting on top of them.
function AmbientBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent-200/60 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-accent-100 blur-3xl"
      />
    </div>
  );
}

export default function FitCheckSection() {
  return (
    <section className="relative overflow-hidden bg-neutral-100 px-6 py-20 md:px-9">
      <AmbientBlobs />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
            A quick gut check
          </motion.div>
          <h2 className="font-heading mx-auto max-w-lg text-[34px] leading-[1.05] font-semibold tracking-tight text-neutral-900 md:text-[48px]">
            {"You'll probably love CoachevaOS if…".split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                className="mr-[0.28em] inline-block last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </h2>
        </div>

        <ul className="flex flex-col gap-6">
          {STATEMENTS.map((s, i) => (
            <StatementCard key={s.text} text={s.text} highlight={s.highlight} index={i} />
          ))}
        </ul>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: STATEMENTS.length * 0.15 + 0.2 }}
          className="mx-auto mt-12 max-w-md text-center text-[13px] leading-relaxed text-neutral-500 md:text-sm"
        >
          If most of that sounded like you — new coach or ten years in, five clients or five
          hundred — you&apos;re exactly who we built this for.
        </motion.p>
      </div>
    </section>
  );
}
