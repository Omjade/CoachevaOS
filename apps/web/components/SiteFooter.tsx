import Link from "next/link";
import {
  XLogoIcon as XLogo,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
  ArrowUpIcon as ArrowUp,
} from "@phosphor-icons/react/dist/ssr";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/works", label: "Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

// Free lead-magnet tools/templates — built but previously unlinked from any
// visible page (only reachable via sitemap.ts, which crawlers but not real
// visitors read). Grouped separately from FOOTER_LINKS since there are more
// of them and they serve a different purpose (inbound/SEO, not site nav).
const FREE_RESOURCES = [
  { href: "/tools/capacity-calculator", label: "Capacity Calculator" },
  { href: "/tools/revenue-calculator", label: "Revenue Calculator" },
  { href: "/tools/churn-calculator", label: "Churn Calculator" },
  { href: "/templates/client-tracker", label: "Client Tracker Template" },
  { href: "/templates/client-dashboard", label: "Client Dashboard Template" },
  { href: "/templates/coaching-spreadsheet", label: "Coaching Spreadsheet Template" },
  { href: "/templates/pt-client-tracker", label: "PT Client Tracker Template" },
];

const SOCIALS = [
  { icon: InstagramLogo, label: "Instagram", href: "https://www.instagram.com/coachevaos" },
  { icon: LinkedinLogo, label: "LinkedIn", href: "https://www.linkedin.com/company/coachevaos" },
  { icon: XLogo, label: "Twitter / X", href: "https://www.x.com/coachevaos" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-neutral-100 px-6 pb-10 md:px-9">
      <div className="relative flex flex-col items-center gap-8 overflow-hidden py-16 text-center">
        <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-x-4 -translate-y-1/2 truncate font-heading text-[26vw] leading-none font-bold text-neutral-200/70 select-none md:text-[220px]">
          CoachevaOS
        </span>

        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-(--radius-sm) bg-neutral-900">
            <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
          </span>
          <p className="font-heading max-w-[220px] text-[16px] leading-snug font-semibold text-neutral-900 md:text-[17px]">
            Run your coaching practice with more clarity.
          </p>
          <p className="max-w-[240px] text-[10px] leading-snug">
            <span className="text-accent-600">A calm operating system</span>{" "}
            <span className="text-neutral-500">for independent coaches</span>
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5">
          {SOCIALS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-[92px] items-center justify-between rounded-[11px] bg-white px-3 py-2 text-[11px] font-medium text-neutral-800 shadow-[0_8px_16px_rgba(28,29,31,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(28,29,31,0.12)]"
            >
              {label}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors duration-200 group-hover:bg-accent-600">
                <Icon className="h-2.5 w-2.5" weight="fill" />
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-5 gap-y-2 border-t border-divider pt-6 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-700">Free tools:</span>
        {FREE_RESOURCES.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-accent-600">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-divider pt-6 text-xs text-neutral-500 sm:flex-row">
        <div className="flex flex-wrap justify-center gap-5">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent-600">
              {link.label}
            </Link>
          ))}
        </div>
        <p>© {new Date().getFullYear()} CoachevaOS. All rights reserved.</p>
        <a href="#" className="flex items-center gap-1.5 hover:text-accent-600">
          Back To Top <ArrowUp className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Google Preferred Sources button — renders once the publisher.js
          script (loaded in the root layout) is ready; the plain deeplink
          below works identically with no JS, so it's kept as a real fallback
          rather than the button silently doing nothing pre-hydration. */}
      <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center gap-2 border-t border-divider pt-6 text-xs text-neutral-400">
        <div google-add-preferred-source-btn="" data-theme="light" />
        <a
          href="https://www.google.com/preferences/source?q=coachevaos.com"
          className="hover:text-accent-600"
        >
          Add CoachevaOS as a preferred source on Google
        </a>
      </div>
    </footer>
  );
}
