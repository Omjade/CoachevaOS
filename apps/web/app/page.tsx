"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  SparkleIcon as Sparkle,
  EnvelopeSimpleIcon as EnvelopeSimple,
  PhoneIcon as Phone,
  XLogoIcon as XLogo,
  FacebookLogoIcon as FacebookLogo,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
  CaretDownIcon as CaretDown,
  ArrowUpIcon as ArrowUp,
  CircleWavyCheckIcon as CircleWavyCheck,
  CheckCircleIcon as CheckCircle,
  PackageIcon as Package,
  ChartLineUpIcon as ChartLineUp,
  PlusIcon as Plus,
  MinusIcon as Minus,
} from "@phosphor-icons/react";

const capabilities = [
  {
    n: "01",
    title: "Client workspace",
    body: "Keep notes, goals, sessions, and next steps connected to each client.",
    tags: ["Client timeline", "Goals and action steps", "Session context"],
  },
  {
    n: "02",
    title: "Lead pipeline",
    body: "Track every inbound lead from first contact to booked, without a spreadsheet.",
    tags: ["Pipeline stages", "Follow-up reminders", "Convert to client"],
  },
  {
    n: "03",
    title: "AI session assistant",
    body: "Turn a quick note into a client-ready follow-up you review before it sends.",
    tags: ["Voice to note", "Draft follow-up", "You always approve"],
  },
  {
    n: "04",
    title: "Client portal",
    body: "Your own branded link where clients message, book, and check in.",
    tags: ["Branded link", "Messaging", "Booking and check-ins"],
  },
];

const HEADING_LINES = [
  "Every client,",
  "session, and",
  "follow-up —",
  "in one steady",
  "rhythm.",
];

function CapabilityAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      {capabilities.map((c, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={c.n}
            layout
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setOpen(i)}
            className={`cursor-pointer overflow-hidden rounded-[24px] transition-colors duration-300 ${
              isOpen
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300/50 bg-white text-neutral-500 shadow-[0_10px_20px_rgba(28,29,31,0.05)] hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(28,29,31,0.08)]"
            }`}
          >
            {isOpen ? (
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-heading text-xl font-semibold text-white">{c.title}</h3>
                  <span className="text-xs text-neutral-500">({c.n})</span>
                </div>
                <p className="mb-5 max-w-[280px] text-[13px] leading-relaxed text-neutral-400">
                  {c.body}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-neutral-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[74px] items-center justify-between px-6">
                <h4 className="text-base font-medium text-neutral-500">{c.title}</h4>
                <span className="text-xs text-neutral-300">({c.n})</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

const faqs = [
  {
    q: "What happens after my 14-day trial?",
    a: "You can choose the plan that fits your practice before the trial ends. Your workspace and client history stay available while you decide.",
  },
  {
    q: "Can I invite clients to a branded portal?",
    a: "Yes — every coach gets a unique portal link clients use to message, book sessions, and check in.",
  },
  {
    q: "Does CoachevaOS work for my coaching niche?",
    a: "CoachevaOS adapts labels and examples to your niche — fitness, business, career, or general coaching.",
  },
  {
    q: "Who owns the client data?",
    a: "You do. Client records belong to your practice and stay with your account.",
  },
];

function FaqItem({
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

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const valid = name.trim() !== "" && email.trim() !== "" && niche !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-[15px] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.28)] lg:w-[275px]"
    >
      <h3 className="font-heading mb-5 text-[19px] font-semibold text-neutral-900">
        Start your free trial
      </h3>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setSubmitted(true);
        }}
      >
        <div>
          <label className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Work email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourpractice.com"
            className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Coaching niche</label>
          <div className="relative">
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full appearance-none border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none focus:border-accent-600"
            >
              <option value="">Select…</option>
              <option value="fitness">Fitness</option>
              <option value="business">Business</option>
              <option value="career">Career</option>
            </select>
            <CaretDown className="pointer-events-none absolute top-1/2 right-0 h-2.5 w-2.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-semibold text-neutral-900">
            What would you like to organize first?
          </label>
          <textarea
            placeholder="For example: invite my first five clients"
            rows={3}
            className="w-full resize-none border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        <button
          type="submit"
          disabled={submitted}
          className={`mt-1 self-start rounded-full px-5 py-2 text-[11px] font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 ${
            valid ? "bg-neutral-900 hover:bg-neutral-800" : "bg-neutral-300"
          }`}
        >
          {submitted ? "Workspace requested" : "Submit Message"}
        </button>
      </form>
    </motion.div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto flex max-w-[550px] flex-col gap-3 text-left">
      {faqs.map((f, i) => (
        <FaqItem key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(i)} />
      ))}
    </div>
  );
}

const HEADLINE_LINE_1 = ["Run", "the", "coaching", "practice", "your", "clients", "deserve"];
const HEADLINE_LINE_2 = ["from", "one", "calm", "dashboard"];
const WORD_STAGGER_MS = 55;
const HEADLINE_START_MS = 130;

const floatingCards = [
  { Icon: CheckCircle, color: "#1fae5c", top: "18%", right: "6%", rotate: -8, duration: 3.4 },
  { Icon: Package, color: "#6b4fe0", top: "34%", right: "1%", rotate: 6, duration: 4.1 },
  { Icon: ChartLineUp, color: "#2f7fe0", top: "50%", right: "9%", rotate: -4, duration: 3.7 },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <div className="p-3 md:p-4">
        <section className="relative flex min-h-[92vh] flex-col items-center overflow-hidden rounded-[28px] bg-neutral-200 text-center md:rounded-[32px]">
          <Image
            src="/5N22TgsC5COekVNfTUPjl3WiMQ.png"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "62% 50%" }}
          />

          {/* Floating capsule nav */}
          <nav
            className="absolute top-5 z-20 flex h-11 w-[92%] items-center justify-between rounded-full bg-white/90 px-5 shadow-md backdrop-blur-md sm:w-[80%] lg:w-[66%]"
          >
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
                <CircleWavyCheck className="h-3.5 w-3.5" weight="fill" />
              </span>
              <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
            </div>
            <div className="hidden items-center gap-5 text-[11px] font-medium text-neutral-800 lg:flex">
              <a href="#" className="hover:text-accent-600">
                Home
              </a>
              <a href="#product" className="hover:text-accent-600">
                Product
              </a>
              <a href="#features" className="hover:text-accent-600">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-accent-600">
                How it works
              </a>
              <a href="#pricing" className="hover:text-accent-600">
                Pricing
              </a>
              <a href="#faq" className="hover:text-accent-600">
                FAQ
              </a>
            </div>
            <Link href="/signup">
              <button
                className="rounded-full bg-neutral-900 px-4 py-2 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,75,56,0.35), 0 10px 18px rgba(0,0,0,0.25)",
                }}
              >
                Start free
              </button>
            </Link>
          </nav>

          {/* Floating integration cards */}
          {floatingCards.map(({ Icon, color, top, right, rotate, duration }, i) => (
            <motion.div
              key={i}
              className="absolute z-10 hidden h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg sm:flex"
              style={{ top, right }}
              initial={{ opacity: 0, scale: 0.6, rotate }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: [rotate, rotate + 3, rotate],
                y: [0, -9, 0],
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.5 + i * 0.1 },
                scale: { duration: 0.5, delay: 0.5 + i * 0.1 },
                rotate: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.9 + i * 0.15 },
                y: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.9 + i * 0.15 },
              }}
            >
              <Icon className="h-5 w-5" weight="fill" style={{ color }} />
            </motion.div>
          ))}

          {/* Hero content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-16">
            <div
              className="animate-fade-up mb-6 inline-flex items-center gap-1.5 rounded-[7px] border border-divider bg-white/80 px-2.5 py-1.5 text-[11px] text-accent-600 shadow-sm"
            >
              <Sparkle className="h-3 w-3" weight="fill" />
              The operating system for coaches
            </div>

            <h1
              className="font-heading mx-auto max-w-[900px] text-[42px] leading-[1] font-semibold tracking-tight text-neutral-900 md:text-[64px]"
            >
              <span className="block">
                {HEADLINE_LINE_1.map((word, i) => (
                  <span
                    key={word}
                    className="animate-fade-up inline-block"
                    style={{
                      animationDelay: `${HEADLINE_START_MS + i * WORD_STAGGER_MS}ms`,
                      color: word === "deserve" ? "var(--color-accent-600)" : undefined,
                    }}
                  >
                    {word}
                    {i < HEADLINE_LINE_1.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
              <span className="block">
                {HEADLINE_LINE_2.map((word, i) => (
                  <span
                    key={word}
                    className="animate-fade-up inline-block"
                    style={{
                      animationDelay: `${HEADLINE_START_MS + (HEADLINE_LINE_1.length + i) * WORD_STAGGER_MS}ms`,
                    }}
                  >
                    {word}
                    {i < HEADLINE_LINE_2.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            </h1>

            <p
              className="animate-fade-up mx-auto mt-14 max-w-lg text-xs text-neutral-700/80 md:text-[13px]"
              style={{ animationDelay: "950ms" }}
            >
              Replace scattered tools with one calm system for client records, follow-ups,
              bookings, billing, and AI-guided coaching.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row"
              style={{ animationDelay: "1050ms" }}
            >
              <Link href="/signup">
                <button
                  className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ boxShadow: "0 14px 26px rgba(0,0,0,0.3)" }}
                >
                  Start free for 14 days
                </button>
              </Link>
              <a href="#how-it-works">
                <button
                  className="rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-medium text-neutral-900 shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-white"
                >
                  See how it works
                </button>
              </a>
            </div>
          </div>

          {/* Bottom scroll tab */}
          <div
            className="animate-fade-up relative z-10 mb-[-14px] flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-[11px] text-neutral-700 shadow-md"
            style={{ animationDelay: "1300ms" }}
          >
            Scroll for more
            <motion.span
              className="text-accent-600"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <CaretDown className="h-3 w-3" />
            </motion.span>
          </div>
        </section>
      </div>

      {/* From scattered tools to one calm workspace */}
      <section id="product" className="bg-neutral-100 px-6 py-24 md:px-9">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
            The coaching operating system
          </motion.div>

          <h2 className="font-heading mb-14 max-w-[720px] text-[34px] leading-[0.98] font-semibold tracking-tight md:text-[52px]">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="block text-neutral-900"
            >
              From scattered tools to one calm
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="block text-neutral-400/70"
            >
              workspace
            </motion.span>
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[58%_1fr]">
            {/* Left: dark product showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[6/5] overflow-hidden rounded-[24px] bg-neutral-900"
            >
              <div className="relative z-10 flex flex-col items-center pt-8 text-center">
                <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] text-neutral-200">
                  <span className="h-1.5 w-1.5 rounded-sm bg-accent-500" />
                  Everything your coaching practice needs
                </span>
                <h3 className="font-heading mb-6 max-w-[260px] text-2xl leading-tight font-semibold text-white md:text-[26px]">
                  One workspace for your client relationships
                </h3>
                <Link href="/signup">
                  <button
                    className="rounded-full bg-neutral-700 px-4 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-600"
                  >
                    Start a Project
                  </button>
                </Link>
              </div>

              <motion.div
                initial={{ scale: 1.03, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 -bottom-[18%] left-0 mx-auto h-[85%] w-[95%]"
              >
                <Image
                  src="/Black WOrld.png"
                  alt=""
                  aria-hidden
                  fill
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-contain object-bottom"
                />
              </motion.div>
            </motion.div>

            {/* Right: info + testimonial cards */}
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-[19px] border border-neutral-300/50 bg-white px-6 py-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)]"
              >
                <p className="text-[15px] font-medium text-neutral-900">
                  Purpose-built for the coaching relationship — clients, sessions,
                  follow-ups, and growth in one place.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex flex-1 gap-4 rounded-[19px] border border-neutral-300/50 bg-white p-5 shadow-[0_16px_32px_rgba(28,29,31,0.09)]"
              >
                <div
                  className="relative h-24 w-16 shrink-0 overflow-hidden rounded-[13px] shadow-lg"
                  style={{ background: "linear-gradient(160deg, #ff6a4d, #b82d1e)" }}
                >
                  <svg viewBox="0 0 64 96" className="absolute inset-0 h-full w-full">
                    <circle cx="32" cy="34" r="14" fill="rgba(0,0,0,0.55)" />
                    <path d="M8 96 C8 70 16 58 32 58 C48 58 56 70 56 96 Z" fill="rgba(0,0,0,0.55)" />
                  </svg>
                </div>
                <div className="relative flex-1">
                  <span className="absolute -top-2 -left-1 font-heading text-4xl text-neutral-200 select-none">
                    &ldquo;
                  </span>
                  <p className="relative text-[15px] leading-snug font-medium text-neutral-900">
                    The work gets lighter when your coaching context stays connected.
                  </p>
                  <p className="mt-3 text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-700">Ava Collins</span> | CoachevaOS
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <p className="mt-10 text-[11px] text-neutral-500">
            Built for independent coaches managing 5–150 clients.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-8 overflow-x-auto opacity-40 grayscale">
            {["Logoipsum", "Logoipsum", "Logoipsum", "Logoipsum"].map((label, i) => (
              <span key={i} className="font-heading shrink-0 text-lg font-semibold text-neutral-500">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Every client, session, and follow-up — workspace capabilities */}
      <section
        id="features"
        className="bg-neutral-100 px-3 py-4 md:px-4"
      >
        <div className="mx-auto max-w-6xl rounded-[26px] bg-white px-6 py-12 shadow-[0_20px_50px_rgba(28,29,31,0.05)] md:px-12 md:py-16">
          <div id="how-it-works" className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-10">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4 }}
                className="mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
                Your coaching command center
              </motion.div>

              <h2 className="font-heading mb-6 max-w-[320px] text-[40px] leading-[0.98] font-semibold tracking-tight text-neutral-900 md:text-[52px]">
                {HEADING_LINES.map((line, i) => (
                  <motion.span
                    key={line}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                ))}
              </h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="max-w-[320px] text-[13px] leading-relaxed text-neutral-600 md:text-sm"
              >
                CoachevaOS keeps the work around your coaching in one place, so you can spend
                less time chasing details and more time coaching.
              </motion.p>
            </div>

            <div className="mx-auto w-full max-w-[430px]">
              <CapabilityAccordion />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-100 px-6 py-24 md:px-9">
        <div className="mx-auto max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
            FAQs
          </motion.div>
          <h2 className="font-heading mb-14 text-[40px] leading-[0.98] font-semibold tracking-tight text-neutral-900 md:text-[52px]">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="block"
            >
              Frequently Asked
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="block"
            >
              Questions
            </motion.span>
          </h2>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA + Contact */}
      <section id="pricing" className="bg-neutral-100 px-3 pb-4 md:px-4">
        <div className="relative mx-auto w-full overflow-hidden rounded-[24px] lg:w-[90%] lg:max-w-[1320px] lg:min-h-[335px]">
          <Image
            src="/m80ZhxX0AHAi3ZQzPq6jtq80gTA.png"
            alt=""
            aria-hidden
            fill
            loading="eager"
            sizes="90vw"
            className="object-cover"
            style={{ objectPosition: "78% 28%" }}
          />

          <div className="relative z-10 flex flex-col gap-10 p-6 md:p-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[300px]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4 }}
                className="mb-5 inline-flex items-center gap-1.5 rounded-[4px] border border-neutral-300/50 bg-white px-2 py-1 text-[9px] font-semibold text-accent-600 uppercase shadow-sm"
              >
                <span className="h-1 w-1 rounded-full bg-accent-600" />
                Start your workspace
              </motion.div>

              <h2 className="font-heading mb-6 max-w-[260px] text-[36px] leading-[0.98] font-semibold tracking-tight text-neutral-900 md:text-[46px]">
                <motion.span
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="block"
                >
                  Your coaching
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                  className="block"
                >
                  work, finally in
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.26 }}
                  className="block"
                >
                  one place
                </motion.span>
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-200/70 bg-white shadow-sm">
                    <EnvelopeSimple className="h-3.5 w-3.5 text-neutral-700" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[9px] text-neutral-600">E-mail address</p>
                    <p className="text-[10px] font-medium text-neutral-900">hello@youragency.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-200/70 bg-white shadow-sm">
                    <Phone className="h-3.5 w-3.5 text-neutral-700" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[9px] text-neutral-600">Phone number</p>
                    <p className="text-[10px] font-medium text-neutral-900">+1 (647) 555-0172</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-100 px-6 pb-10 md:px-9">
        <div className="relative flex flex-col items-center gap-8 overflow-hidden py-16 text-center">
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 -translate-x-4 truncate font-heading text-[26vw] leading-none font-bold text-neutral-200/70 select-none md:text-[220px]">
            CoachevaOS
          </span>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-neutral-900 text-neutral-100">
              <CircleWavyCheck className="h-4.5 w-4.5" weight="fill" />
            </span>
            <p className="font-heading max-w-[220px] text-[16px] leading-snug font-semibold text-neutral-900 md:text-[17px]">
              Run your coaching practice with more clarity.
            </p>
            <p className="max-w-[240px] text-[10px] leading-snug">
              <span className="text-accent-600">A calm operating system</span>{" "}
              <span className="text-neutral-500">for independent coaches</span>
            </p>
          </motion.div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: XLogo, label: "Twitter / X" },
              { icon: FacebookLogo, label: "Facebook" },
              { icon: InstagramLogo, label: "Instagram" },
              { icon: LinkedinLogo, label: "LinkedIn" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                className="group flex w-[92px] items-center justify-between rounded-[11px] bg-white px-3 py-2 text-[11px] font-medium text-neutral-800 shadow-[0_8px_16px_rgba(28,29,31,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(28,29,31,0.12)]"
              >
                {label}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors duration-200 group-hover:bg-accent-600">
                  <Icon className="h-2.5 w-2.5" weight="fill" />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-divider pt-6 text-xs text-neutral-500 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#" className="hover:text-accent-600">
              About
            </a>
            <a href="#" className="hover:text-accent-600">
              Services
            </a>
            <a href="#" className="hover:text-accent-600">
              Works
            </a>
            <a href="#pricing" className="hover:text-accent-600">
              Pricing
            </a>
            <Link href="/blog" className="hover:text-accent-600">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-accent-600">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-accent-600">
              Terms
            </Link>
          </div>
          <p>© {new Date().getFullYear()} CoachevaOS. All rights reserved.</p>
          <a href="#" className="flex items-center gap-1.5 hover:text-accent-600">
            Back To Top <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
