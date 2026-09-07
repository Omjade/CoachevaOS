"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  EnvelopeSimpleIcon as EnvelopeSimple,
  CaretDownIcon as CaretDown,
  BarbellIcon as Barbell,
  VideoCameraIcon as VideoCamera,
  HeartbeatIcon as Heartbeat,
  SquaresFourIcon as SquaresFour,
  UserCircleIcon as UserCircle,
  SparkleIcon as Sparkle,
  NotePencilIcon as NotePencil,
  ChatCircleIcon as ChatCircle,
  CalendarBlankIcon as CalendarBlank,
} from "@phosphor-icons/react";
import { api, ApiError } from "@/lib/api";
import { NICHES } from "@/lib/niches";

// Marketing-only marquee list — adds popular business-model synonym terms
// (online coach, personal trainer, health coach) that visitors actually
// search for, without touching the functional NICHES array the onboarding
// form's niche <select> depends on for real custom-field templates.
const MARQUEE_NICHES = [
  ...NICHES.filter((n) => n.value !== "other"),
  { value: "online-coach", label: "Online coaching", Icon: VideoCamera },
  { value: "personal-trainer", label: "Personal training", Icon: Barbell },
  { value: "health-coach", label: "Health coaching", Icon: Heartbeat },
];
import { ErrorBanner } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingToolIcons from "@/components/FloatingToolIcons";
import DemoVideoDialog from "@/components/DemoVideoDialog";
import LandingDashboardPreview from "@/components/LandingDashboardPreview";
import CoachMapCarousel from "@/components/CoachMapCarousel";
import FAQAccordion from "@/components/FAQAccordion";

const capabilities = [
  {
    n: "01",
    title: "Everything in one place",
    body: "No more juggling ten different apps to run your practice. Clients, leads, chat, calendar, and billing all live in one calm system.",
    Icon: SquaresFour,
  },
  {
    n: "02",
    title: "A dedicated, personalized portal per client",
    body: "Every client gets their own branded onboarding and portal from day one, so it feels premium, not like a shared spreadsheet.",
    Icon: UserCircle,
  },
  {
    n: "03",
    title: "AI daily briefing for you and your client",
    body: "Open the app to a morning briefing that already knows who needs you today, with a personalized dashboard, sessions, and everything else in one place.",
    Icon: Sparkle,
  },
  {
    n: "04",
    title: "Build a form in seconds with AI",
    body: "Describe what you need and get a ready-to-share form instantly, for onboarding or any general info, sent to anyone with one link.",
    Icon: NotePencil,
  },
  {
    n: "05",
    title: "A dedicated chat for every client",
    body: "Progress, tasks, goals, custom fields, and documents you need day to day, all attached to the same conversation, not scattered across tools.",
    Icon: ChatCircle,
  },
  {
    n: "06",
    title: "Calendar, leads, and a dashboard that thinks ahead",
    body: "Connect your calendar so clients book around your real availability, manage your lead pipeline from new to active with one-click CSV import, and see it all summarized: daily briefing, weekly digest, churn risk, growth, and engagement.",
    Icon: CalendarBlank,
  },
];

const HEADING_LINES = ["Every tool.", "Every client.", "One platform."];

function CapabilityGrid() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
      {capabilities.map((c, i) => (
        <motion.div
          key={c.n}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className={`flex flex-col gap-4 p-6 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}
        >
          <div className="flex items-start justify-between">
            <span className="font-heading text-xs font-semibold text-neutral-400">{c.n}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <c.Icon className="h-5 w-5" weight="fill" />
            </span>
          </div>
          <div>
            <h4 className="font-heading mb-1.5 text-[15px] leading-snug font-semibold text-neutral-900">
              {c.title}
            </h4>
            <p className="text-[12.5px] leading-relaxed text-neutral-500">{c.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const faqs = [
  {
    q: "What does the AI daily briefing actually do?",
    a: "Every morning it checks who hasn't replied, whose check-ins have gone quiet, and who's overdue for a session, then tells you exactly who needs your attention today, instead of you digging through five different apps to find out.",
  },
  {
    q: "Does it adapt to my coaching niche?",
    a: "Yes. Pick your niche during setup and your workspace comes pre-loaded with relevant fields and metrics (weight and steps for fitness, revenue and leads for business, and more), which you can still fully customize.",
  },
  {
    q: "Can clients message, book, and check in without extra apps?",
    a: "Every coach gets a branded portal link where clients message you directly, book sessions against your real availability, and submit check-ins. No more juggling WhatsApp, Calendly, and email threads.",
  },
  {
    q: "Who owns the client data?",
    a: "You do. Client records, notes, and conversations belong to your practice and stay with your account if you ever leave.",
  },
];

function ContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim() !== "" && email.trim() !== "" && niche !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitLandingInterest({ name: name.trim(), email: email.trim(), niche, note: note.trim() });
      router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

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
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="landing-name" className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Your name</label>
          <input
            id="landing-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        <div>
          <label htmlFor="landing-email" className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Work email</label>
          <input
            id="landing-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourpractice.com"
            className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        <div>
          <label htmlFor="landing-niche" className="mb-1.5 block text-[9px] font-semibold text-neutral-900">Coaching niche</label>
          <div className="relative">
            <select
              id="landing-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full appearance-none border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none focus:border-accent-600"
            >
              <option value="">Select…</option>
              {NICHES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
            <CaretDown className="pointer-events-none absolute top-1/2 right-0 h-2.5 w-2.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
        <div>
          <label htmlFor="landing-note" className="mb-1.5 block text-[9px] font-semibold text-neutral-900">
            What would you like to organize first?
          </label>
          <textarea
            id="landing-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: invite my first five clients"
            rows={3}
            className="w-full resize-none border-b border-neutral-200 bg-transparent py-1.5 text-[10px] text-neutral-600 outline-none placeholder:text-neutral-400 focus:border-accent-600"
          />
        </div>
        {error && (
          <div className="text-[10px]">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}
        <button
          type="submit"
          disabled={!valid || submitting}
          className={`mt-1 self-start rounded-full px-5 py-2 text-[11px] font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 ${
            valid ? "bg-neutral-900 hover:bg-neutral-800" : "bg-neutral-300"
          }`}
        >
          {submitting ? "Submitting…" : "Submit Message"}
        </button>
      </form>
    </motion.div>
  );
}

const HEADLINE_LINE_1 = ["One", "calm", "AI", "system"];
const HEADLINE_LINE_2 = ["for", "your", "whole", "coaching", "practice."];
const WORD_STAGGER_MS = 55;
const HEADLINE_START_MS = 130;

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <main className="flex flex-1 flex-col bg-neutral-100">
      <div className="p-3 md:p-4">
        <section className="relative flex min-h-[92vh] flex-col items-center overflow-hidden rounded-[28px] bg-neutral-200 pb-6 text-center md:rounded-[32px]">
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

          <SiteHeader variant="hero" />

          {/* Floating tool icons — sheet/email/chat/calendar converging on the CoachevaOS mark */}
          <FloatingToolIcons />

          {/* Hero content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-16">
            <div
              className="animate-fade-up mb-6 inline-flex items-center gap-1.5 rounded-[7px] border border-divider bg-white/80 px-2.5 py-1.5 text-[11px] text-accent-600 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
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
                      color: word === "calm" ? "var(--color-accent-600)" : undefined,
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
              className="animate-fade-up mx-auto mt-14 max-w-md text-xs text-neutral-700/80 md:text-[13px]"
              style={{ animationDelay: "950ms" }}
            >
              All-in-one AI coaching software for client records, programs, chat, scheduling,
              billing, and documents — focus on coaching, so nothing about your practice slips
              through the cracks.
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
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-medium text-neutral-900 shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-white"
              >
                Watch demo
              </button>
            </div>
          </div>

          {/* Bottom scroll tab */}
          <div
            className="animate-fade-up relative z-10 mb-1 flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-[11px] text-neutral-700 shadow-md"
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

      <DemoVideoDialog open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* From scattered tools to one calm workspace */}
      <section id="product" className="bg-neutral-100 px-6 py-14 md:px-9">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
            What changes on day one
          </motion.div>

          <h2 className="font-heading mb-6 max-w-[720px] text-[34px] leading-[0.98] font-semibold tracking-tight md:text-[52px]">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="block text-neutral-900"
            >
              Five tabs became
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="block text-neutral-400/70"
            >
              one screen
            </motion.span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 max-w-lg text-[13px] leading-relaxed text-neutral-600 md:text-sm"
          >
            A spreadsheet for progress. WhatsApp for messages. Email for follow-ups. Calendly for
            bookings. CoachevaOS replaces all four with one calm dashboard your clients actually
            notice.
          </motion.p>

          <CoachMapCarousel />

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-[11px] text-neutral-500">
              Built for independent coaches managing 200 clients, in any niche.
            </p>
            <div
              className="relative mt-4 overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              }}
            >
              <div className="animate-marquee flex w-max items-center gap-8">
                {[...Array(2)].flatMap((_, dup) =>
                  MARQUEE_NICHES.map(({ value, label, Icon }) => (
                    <span
                      key={`${dup}-${value}`}
                      className="flex shrink-0 items-center gap-2 text-sm font-medium text-neutral-400"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Same workspace, two views — proves it looks sophisticated to clients too */}
      <section className="bg-neutral-100 px-6 py-16 md:px-9">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
            One workspace, two views
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="font-heading mx-auto mb-4 max-w-2xl text-[32px] leading-[1.05] font-semibold tracking-tight text-neutral-900 md:text-[44px]"
          >
            What looks calm to you looks{" "}
            <span className="text-accent-600">premium</span> to them
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-10 max-w-lg text-[13px] leading-relaxed text-neutral-600 md:text-sm"
          >
            A branded portal makes a $500 coaching package feel like the real business it is.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <LandingDashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* Every tool, every client — workspace capabilities */}
      <section
        id="features"
        className="bg-neutral-100 px-3 py-4 md:px-4"
      >
        <div className="mx-auto max-w-6xl rounded-[26px] bg-white px-6 py-12 shadow-[0_20px_50px_rgba(28,29,31,0.05)] md:px-12 md:py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4 }}
              className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
              Your coaching command center
            </motion.div>

            <h2 className="font-heading mb-4 text-[40px] leading-[0.98] font-semibold tracking-tight text-neutral-900 md:text-[52px]">
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
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mx-auto max-w-md text-[13px] leading-relaxed text-neutral-600 md:text-sm"
            >
              CoachevaOS keeps the work around your coaching in one place, so you can spend
              less time chasing details and more time coaching.
            </motion.p>
          </div>

          <CapabilityGrid />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="font-heading mt-12 text-center text-xl font-semibold tracking-tight text-neutral-900 md:text-[28px]"
          >
            One platform to run your entire coaching business.
          </motion.p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-100 px-6 py-14 md:px-9">
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
          <h2 className="font-heading mb-10 text-[40px] leading-[0.98] font-semibold tracking-tight text-neutral-900 md:text-[52px]">
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
          <FAQAccordion items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
        </div>
      </section>

      {/* CTA + Contact */}
      <section id="get-started" className="bg-neutral-100 px-3 pb-4 md:px-4">
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
                    <p className="text-[10px] font-medium text-neutral-900">help@coachevaos.com</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
