"use client";

import { ReactNode } from "react";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-neutral-900/50"
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
    </div>
  );
}
