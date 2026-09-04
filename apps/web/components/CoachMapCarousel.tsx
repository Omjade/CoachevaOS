"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CaretLeftIcon as CaretLeft, CaretRightIcon as CaretRight, MapPinIcon as MapPin } from "@phosphor-icons/react";
import { TESTIMONIALS } from "@/lib/testimonials";

export default function CoachMapCarousel() {
  const [active, setActive] = useState(0);
  const testimonial = TESTIMONIALS[active];

  function go(delta: number) {
    setActive((a) => (a + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[58%_1fr]">
      {/* Left: dark product showcase + live map pin */}
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
          <h3 className="font-heading mb-2 max-w-[260px] text-2xl leading-tight font-semibold text-white md:text-[26px]">
            One workspace for your client relationships
          </h3>
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
          {/* Fixed position, deliberately not tied to the active testimonial —
              the pin no longer jumps around the map when the review switches. */}
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${TESTIMONIALS[0].mapX}%`, top: `${TESTIMONIALS[0].mapY}%` }}
          >
            <span className="relative flex h-3 w-3">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-60"
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-accent-500 shadow-lg">
                <MapPin className="h-2 w-2 text-white" weight="fill" />
              </span>
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Right: testimonial card + switcher */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-1 flex-col justify-between gap-5 rounded-[19px] border border-neutral-300/50 bg-white p-6 shadow-[0_16px_32px_rgba(28,29,31,0.09)]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <span className="absolute -top-2 -left-1 font-heading text-4xl text-neutral-200 select-none">
              &ldquo;
            </span>
            <p className="relative text-[17px] leading-snug font-medium text-neutral-900">
              {testimonial.quote}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {testimonial.photoUrl && (
                <img
                  src={testimonial.photoUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              )}
              <p className="text-[12px] text-neutral-500">
                <span className="font-medium text-neutral-700">{testimonial.name}</span> ·{" "}
                {testimonial.role}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                aria-label={`Show review ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-accent-600" : "w-2.5 bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              <CaretLeft className="h-3.5 w-3.5" weight="bold" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next review"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              <CaretRight className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
