import Link from "next/link";
import {
  XLogoIcon as XLogo,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
} from "@phosphor-icons/react/dist/ssr";

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/works", label: "Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

// Trimmed to the highest-value entries — the full set of 11 free
// tools/templates lives at /free-kits, linked here as "See all".
const RESOURCE_LINKS = [
  { href: "/free-kits", label: "All Free Kits" },
  { href: "/tools/capacity-calculator", label: "Capacity Calculator" },
  { href: "/tools/revenue-calculator", label: "Revenue Calculator" },
  { href: "/tools/churn-calculator", label: "Churn Calculator" },
  { href: "/templates/coaching-agreement-template", label: "Agreement Template" },
  { href: "/templates/discovery-questions-library", label: "Discovery Questions" },
];

const SOCIALS = [
  { icon: InstagramLogo, label: "Instagram", href: "https://www.instagram.com/coachevaos" },
  { icon: LinkedinLogo, label: "LinkedIn", href: "https://www.linkedin.com/company/coachevaos" },
  { icon: XLogo, label: "X", href: "https://www.x.com/coachevaos" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-900 uppercase">{title}</p>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-[13px] text-neutral-500 hover:text-accent-600">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="bg-neutral-100 px-6 pt-14 pb-8 md:px-9">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 border-b border-divider pb-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-3 flex h-9 w-9 items-center justify-center overflow-hidden rounded-(--radius-sm) bg-neutral-900">
            <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
          </span>
          <p className="font-heading mb-1 max-w-[180px] text-sm font-semibold text-neutral-900">
            Run your coaching practice with more clarity.
          </p>
          <p className="mb-4 max-w-[200px] text-[11px] leading-snug">
            <span className="text-accent-600">A calm operating system</span>{" "}
            <span className="text-neutral-500">for independent coaches</span>
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-[0_4px_10px_rgba(28,29,31,0.08)] transition-colors duration-200 hover:bg-neutral-900 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" weight="fill" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Free resources" links={RESOURCE_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>

      <p
        aria-hidden
        className="font-heading mx-auto max-w-5xl truncate pt-8 text-center text-[15vw] leading-none font-bold text-neutral-900/[0.06] select-none sm:text-[100px]"
      >
        CoachevaOS
      </p>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 pt-6 text-xs text-neutral-400 sm:flex-row">
        <p>© {new Date().getFullYear()} CoachevaOS. All rights reserved.</p>
        <a
          href="https://www.google.com/preferences/source?q=coachevaos.com"
          className="hover:text-accent-600"
        >
          Add CoachevaOS as a preferred source on Google
        </a>
        <div google-add-preferred-source-btn="" data-theme="light" />
      </div>
    </footer>
  );
}
