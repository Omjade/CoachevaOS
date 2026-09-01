"use client";

import { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { CircleNotchIcon as CircleNotch, WarningCircleIcon as WarningCircle } from "@phosphor-icons/react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0";
  const variants = {
    primary: "bg-neutral-900 text-white shadow-[0_14px_26px_rgba(0,0,0,0.22)] hover:bg-neutral-800",
    secondary:
      "border border-neutral-300/60 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50",
    ghost: "text-neutral-700 hover:bg-neutral-200/50",
  };
  return (
    <button className={cn(base, variants[variant], className)} disabled={disabled || loading} {...props}>
      {loading && <CircleNotch className="h-4 w-4 animate-spin-slow" weight="bold" />}
      {children}
    </button>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-accent-200 bg-accent-100 px-4 py-3 text-sm text-accent-800 shadow-sm">
      <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <CircleNotch className={cn("h-5 w-5 animate-spin-slow text-accent-600", className)} weight="bold" />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-neutral-300/50 bg-white p-7 shadow-[0_20px_44px_rgba(28,29,31,0.07)] transition-all duration-150",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold text-neutral-700", className)}
      {...props}
    />
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300/60 bg-white px-2.5 py-1 text-[10px] font-medium text-accent-600 uppercase shadow-sm",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
      {children}
    </div>
  );
}
