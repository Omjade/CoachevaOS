"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Dialog({
  open,
  onClose,
  title,
  children,
  widthClassName = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
}) {
  // Rendering straight into document.body (instead of wherever this
  // component happens to sit in the tree) is what actually guarantees
  // `fixed inset-0` is relative to the real viewport. Without a portal, any
  // ancestor that is — or ever was — a Framer Motion motion.div carries an
  // inline `transform` style, which creates a new containing block and
  // silently traps `position: fixed` inside that box instead of the
  // viewport. That's what produced the "modal pinned near the top, not
  // actually centered" bug: it wasn't a centering CSS mistake, it was being
  // positioned relative to a transformed ancestor box smaller than the page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Prevent the background from scrolling/selecting while a modal is open —
  // the overlay already blocks pointer events, but this also stops the page
  // itself from scrolling underneath on touch devices.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-[2px] select-none"
        onClick={onClose}
        aria-hidden
      />
      {/* Below sm: a near-full-screen sheet anchored to the bottom (no side
          margins, most of the viewport height) instead of a small centered
          card with cramped padding — every dialog in the app (Add Client,
          Add Lead, Schedule Builder, ...) goes through this one component,
          so this fixes mobile modal cramping app-wide from one place. */}
      <div
        className={`relative flex h-[92vh] w-full flex-col rounded-t-(--radius-lg) bg-surface p-5 shadow-lg sm:h-auto sm:max-h-[85vh] sm:rounded-(--radius-lg) sm:p-6 ${widthClassName}`}
      >
        <h2 className="font-heading mb-5 shrink-0 text-xl font-semibold">{title}</h2>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
