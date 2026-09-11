"use client";

import { MotionConfig } from "framer-motion";
import { ReactNode } from "react";

// Wraps the whole app once so every existing motion.div/whileInView/etc.
// across the codebase automatically respects the OS-level "reduce motion"
// setting, without editing each animated component individually.
export default function MotionPreferences({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
