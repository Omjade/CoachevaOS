"use client";

import { useState } from "react";
import Link from "next/link";
import { ListIcon as ListMenu, XIcon as X } from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
];

export default function SiteHeader({ variant = "static" }: { variant?: "hero" | "static" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const pill = (
    <nav
      className={`relative z-20 flex h-11 w-full items-center justify-between rounded-full bg-white/90 px-5 shadow-md backdrop-blur-md ${
        variant === "static" ? "mx-auto max-w-4xl" : ""
      }`}
    >
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-900">
          <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
        </span>
        <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
      </Link>

      <div className="hidden items-center gap-5 text-[11px] font-medium text-neutral-800 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className="hover:text-accent-600">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link href="/login" className="hidden sm:block">
          <button
            className="rounded-full bg-neutral-900 px-4 py-2 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: "0 0 0 1px rgba(255,75,56,0.35), 0 10px 18px rgba(0,0,0,0.25)" }}
          >
            Sign in
          </button>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-800 lg:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" weight="bold" /> : <ListMenu className="h-4 w-4" weight="bold" />}
        </button>
      </div>
    </nav>
  );

  const mobileDropdown = mobileOpen && (
    <div className="absolute top-14 right-0 left-0 z-30 mx-auto flex w-full max-w-4xl flex-col gap-1 rounded-[18px] bg-white p-4 shadow-lg lg:hidden">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={() => setMobileOpen(false)}
          className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
        >
          {link.label}
        </Link>
      ))}
      <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-1">
        <button className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </Link>
    </div>
  );

  if (variant === "hero") {
    return (
      <div className="absolute top-5 z-20 flex w-[92%] flex-col sm:w-[80%] lg:w-[66%]">
        {pill}
        {mobileDropdown}
      </div>
    );
  }

  return (
    <div className="relative p-3 md:p-4">
      {pill}
      {mobileDropdown}
    </div>
  );
}
