"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleWavyCheckIcon as CircleWavyCheck,
  CheckCircleIcon as CheckCircle,
  PackageIcon as Package,
  ChartLineUpIcon as ChartLineUp,
} from "@phosphor-icons/react";
import { Eyebrow } from "@/components/ui";

const SLIDES = [
  {
    quote: "I finally have one place to open every morning instead of five.",
    attribution: "Independent fitness coach",
  },
  {
    quote: "My clients feel the difference — everything's in one place now.",
    attribution: "Business coach",
  },
  {
    quote: "The AI briefing tells me exactly who needs me today.",
    attribution: "Career coach",
  },
];

const floatingBadges = [
  { Icon: CheckCircle, color: "#1fae5c", top: "14%", right: "10%", rotate: -8, duration: 3.4 },
  { Icon: Package, color: "#6b4fe0", top: "68%", right: "4%", rotate: 6, duration: 4.1 },
  { Icon: ChartLineUp, color: "#2f7fe0", top: "40%", right: "14%", rotate: -4, duration: 3.7 },
];

export default function AuthLayout({
  children,
  brand,
}: {
  children: ReactNode;
  brand?: { name: string };
}) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-100 p-3 md:p-4">
      <div className="flex flex-1 flex-col">
        <Link href="/" className="mb-8 flex items-center gap-2 md:mb-10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
            <CircleWavyCheck className="h-4 w-4" weight="fill" />
          </span>
          <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
        </Link>

        <div className="flex flex-1 items-center justify-center px-2 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
      </div>

      <div className="relative ml-4 hidden w-[42%] shrink-0 overflow-hidden rounded-[28px] bg-neutral-900 lg:block">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--color-accent-600) 0%, transparent 70%)",
          }}
        />

        {floatingBadges.map(({ Icon, color, top, right, rotate, duration }, i) => (
          <motion.div
            key={i}
            className="absolute z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg"
            style={{ top, right }}
            initial={{ opacity: 0, scale: 0.6, rotate }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: [rotate, rotate + 3, rotate],
              y: [0, -9, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.4 + i * 0.1 },
              scale: { duration: 0.5, delay: 0.4 + i * 0.1 },
              rotate: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.8 + i * 0.15 },
              y: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.8 + i * 0.15 },
            }}
          >
            <Icon className="h-5 w-5" weight="fill" style={{ color }} />
          </motion.div>
        ))}

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Eyebrow className="self-start !border-white/15 !bg-white/10 !text-accent-400 !shadow-none">
            {brand ? "Welcome back" : "Loved by independent coaches"}
          </Eyebrow>

          {brand ? (
            <div className="max-w-md">
              <p className="font-heading text-2xl leading-snug font-medium text-white">
                Welcome back to {brand.name}
              </p>
              <p className="mt-4 text-sm text-neutral-400">
                Log in to pick up right where you left off.
              </p>
            </div>
          ) : (
            <div className="max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-heading text-2xl leading-snug font-medium text-white">
                    &ldquo;{SLIDES[slide].quote}&rdquo;
                  </p>
                  <p className="mt-4 text-sm text-neutral-400">— {SLIDES[slide].attribution}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === slide ? "w-8 bg-accent-500" : "w-4 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-neutral-500">
            Replaces spreadsheets, WhatsApp, Drive, Calendly and Gmail — one dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
