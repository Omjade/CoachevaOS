"use client";

import { motion } from "framer-motion";

const COLORS = ["#e0562f", "#1c1d1f", "#f2b544", "#3f8f6b", "#5f6267"];

interface Piece {
  x: number;
  y: number;
  rotate: number;
  color: string;
  delay: number;
  size: number;
}

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const distance = 140 + Math.random() * 160;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 40 + Math.random() * 80,
      rotate: Math.random() * 480 - 240,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.15,
      size: 6 + Math.random() * 6,
    };
  });
}

/** A brief celebratory burst, shown once right as onboarding completes.
 * Self-contained: mounts, plays, and is meant to be unmounted by the caller
 * a beat later (~900ms) right before navigating away. */
export default function Confetti() {
  const pieces = generatePieces(28);
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 1 }}
          transition={{ duration: 0.9, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
