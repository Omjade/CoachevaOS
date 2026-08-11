"use client";

import { ReactNode } from "react";

export default function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-neutral-900/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-(--radius-lg) bg-surface p-6 shadow-lg">
        <h2 className="font-heading mb-5 text-xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
