"use client";

import { motion } from "framer-motion";
import {
  SunIcon as Sun,
  MagnifyingGlassIcon as MagnifyingGlass,
  ChatCircleDotsIcon as ChatCircleDots,
} from "@phosphor-icons/react";

// Each card names the real, specific thing a coach actually struggles with —
// not "engagement" or "retention" as abstractions — then shows which named
// agent in Your AI Team solves exactly that, so this reads as a real feature
// a coach can picture using tomorrow morning, not a marketing abstraction.
const AGENTS: {
  pain: string;
  highlight: string;
  agent: string;
  Icon: typeof Sun;
  resolution: string;
}[] = [
  {
    pain: "You open your laptop every morning and have to piece together, client by client, who actually needs you today.",
    highlight: "piece together, client by client",
    agent: "Briefing Agent",
    Icon: Sun,
    resolution: "Hands you one morning brief — who to see, who's waiting, what to do first.",
  },
  {
    pain: "A client goes quiet for a week and you don't notice until the renewal conversation is already awkward.",
    highlight: "you don't notice until",
    agent: "Client Agent",
    Icon: MagnifyingGlass,
    resolution: "Watches for exactly that — missed check-ins, silence, cancellations — and flags it before it's a problem.",
  },
  {
    pain: "Clients feel forgotten between sessions, but personally messaging every single one isn't a real option for your time.",
    highlight: "isn't a real option for your time",
    agent: "Client Companion",
    Icon: ChatCircleDots,
    resolution: "Reminds, nudges, and celebrates progress between sessions — in your voice, approved by you.",
  },
];

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

const CARD_GRADIENTS = [
  "from-neutral-900 via-neutral-800 to-accent-900/60",
  "from-[#241a2e] via-neutral-900 to-accent-900/50",
  "from-[#1b2430] via-neutral-900 to-accent-900/50",
];

function AgentCard({
  pain,
  highlight,
  agent,
  Icon,
  resolution,
  index,
}: {
  pain: string;
  highlight: string;
  agent: string;
  Icon: typeof Sun;
  resolution: string;
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
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-accent-500/0 blur-2xl transition-colors duration-500 group-hover:bg-accent-500/30" />

      <GhostNumeral n={index + 1} />

      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: delay + 0.25, type: "spring", stiffness: 300, damping: 16 }}
        className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-white shadow-[0_0_0_4px_rgba(255,102,80,0.18)] transition-shadow duration-300 group-hover:shadow-[0_0_0_7px_rgba(255,102,80,0.28)]"
      >
        <Icon className="h-4.5 w-4.5" weight="fill" />
      </motion.div>

      <p className="relative mb-4 text-[16px] leading-relaxed text-neutral-200 md:text-[17px]">
        <HighlightedText text={pain} highlight={highlight} delay={delay} />
      </p>

      <div className="relative flex flex-col gap-1.5 rounded-[14px] border border-white/10 bg-white/[0.04] p-3.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent-300 uppercase">
          {agent}
        </span>
        <p className="text-[13px] leading-snug text-neutral-300 md:text-sm">{resolution}</p>
      </div>
    </motion.li>
  );
}

function AmbientBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-200/60 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-accent-100 blur-3xl"
      />
    </div>
  );
}

export default function AiTeamSection() {
  const heading = "Meet Your AI Team";
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
            New — Your AI Team
          </motion.div>
          <h2 className="font-heading mx-auto max-w-xl text-[34px] leading-[1.05] font-semibold tracking-tight text-neutral-900 md:text-[48px]">
            {heading.split(" ").map((word, i) => (
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
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-neutral-500 md:text-sm"
          >
            Three agents, one coral thread through your whole practice — always waiting for your
            OK before a client ever sees a word of it.
          </motion.p>
        </div>

        <ul className="flex flex-col gap-6">
          {AGENTS.map((a, i) => (
            <AgentCard key={a.agent} {...a} index={i} />
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: AGENTS.length * 0.15 + 0.2 }}
          className="mx-auto mt-12 text-center"
        >
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(0,0,0,0.22)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            Put your AI Team to work
          </a>
        </motion.div>
      </div>
    </section>
  );
}
