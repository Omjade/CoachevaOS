import type { Metadata } from "next";
import Link from "next/link";
import { CircleWavyCheckIcon as CircleWavyCheck } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CoachevaOS collects, uses, and protects coach and client data across the platform.",
};

const sections = [
  {
    heading: "What we collect",
    body: [
      "Account information you provide when you sign up: name, email address, business name, timezone, and (for coaches) your coaching niche.",
      "Client and coaching data that coaches enter or that clients submit through intake forms, check-ins, messages, tasks, documents, and progress updates — this data belongs to the coach's practice, not to CoachevaOS.",
      "Usage data such as pages visited and features used, collected automatically to keep the product reliable and to improve it.",
      "Payment and subscription details when a coach selects a paid plan, processed by our payment providers — we do not store full card numbers on our own servers.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "To operate the core product: authenticate you, keep coach and client portals working, and deliver messages, bookings, and notifications in real time.",
      "To power AI features (daily briefings, session-note follow-ups, smart replies, progress insights) using a coach's own account data — this data is never used to train shared models or shown to other coaches.",
      "To send account-related and, where you've opted in, product email — never sold to third parties for advertising.",
      "To detect abuse and keep the platform secure, including rate-limiting and monitoring for suspicious login activity.",
    ],
  },
  {
    heading: "Who can see what",
    body: [
      "Every account is scoped to its owner. A coach can only see their own clients, leads, and messages — never another coach's data.",
      "A client can only see their own records and their own coach's shared content (messages, tasks, documents, sessions) — never another client's data, and never another coach's internal notes or business data.",
      "CoachevaOS staff do not access account content except as needed to provide support you've requested or to investigate a security issue.",
    ],
  },
  {
    heading: "You own your client data",
    body: [
      "Client records, notes, messages, and files created within your practice belong to you. If you close your account, you can request an export of your data before deletion.",
      "We act as a processor of the client data you and your clients enter — you remain responsible for having the right to collect and store that information under applicable law in your jurisdiction.",
    ],
  },
  {
    heading: "Data retention & deletion",
    body: [
      "Account and coaching data is retained for as long as your account is active, plus a limited period afterward for backups and legal/audit purposes.",
      "You can request deletion of your account and associated data at any time by contacting us; some records may be retained longer where required by law.",
    ],
  },
  {
    heading: "Cookies",
    body: [
      "We use essential, httpOnly authentication cookies to keep you signed in securely. We do not use third-party advertising trackers.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "If we make material changes to this policy, we'll update this page and, where appropriate, notify account owners by email.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about this policy or your data can be sent to privacy@coacheva.os.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <div className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-3xl px-3 py-16 md:px-4">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
              <CircleWavyCheck className="h-3.5 w-3.5" weight="fill" />
            </span>
            <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
          </Link>

          <Eyebrow className="mb-4">Legal</Eyebrow>
          <h1 className="font-heading mb-2 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
            Privacy Policy
          </h1>
          <p className="mb-12 text-sm text-neutral-500">Last updated August 9, 2026</p>

          <div className="flex flex-col gap-10">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
                  {s.heading}
                </h2>
                <div className="flex flex-col gap-3">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-neutral-600">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex gap-5 border-t border-divider pt-6 text-xs text-neutral-500">
            <Link href="/terms" className="hover:text-accent-600">
              Terms of Service
            </Link>
            <Link href="/blog" className="hover:text-accent-600">
              Blog
            </Link>
            <Link href="/" className="hover:text-accent-600">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
