import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of the CoachevaOS platform by coaches and their clients.",
};

const sections = [
  {
    heading: "1. Agreement to terms",
    body: [
      "By creating an account or using CoachevaOS, you agree to these terms. If you're signing up on behalf of a coaching business, you're agreeing on its behalf and confirming you have authority to do so.",
    ],
  },
  {
    heading: "2. Accounts",
    body: [
      "You're responsible for keeping your login credentials secure and for all activity under your account. Tell us right away if you suspect unauthorized access.",
      "Coaches are responsible for the client accounts they invite and the accuracy of data entered about their clients.",
    ],
  },
  {
    heading: "3. Free trial and subscriptions",
    body: [
      "New coach accounts start with a 14-day free trial. After the trial, continued access to write actions (creating/editing clients, leads, tasks, and related records) requires selecting a paid plan; read access to your existing data remains available.",
      "Subscription fees are billed in advance on the plan's billing cycle and are non-refundable except where required by law.",
      "You can cancel at any time; cancellation takes effect at the end of the current billing period.",
    ],
  },
  {
    heading: "4. Acceptable use",
    body: [
      "Don't use CoachevaOS to store or transmit content that's unlawful, infringing, or that you don't have the right to share.",
      "Don't attempt to access another coach's or client's account or data, probe the platform for vulnerabilities without authorization, or interfere with the service's normal operation.",
      "AI features assist your work but are not a substitute for professional medical, legal, or financial advice. You remain responsible for the guidance you give your clients.",
    ],
  },
  {
    heading: "5. Client data & your responsibilities",
    body: [
      "You own the client data you enter into your practice's workspace, and you're responsible for having the right to collect and store it and for complying with applicable laws in your jurisdiction and your clients' jurisdictions.",
      "You're responsible for what you and your clients share in messages, documents, and check-ins through the platform.",
    ],
  },
  {
    heading: "6. Availability",
    body: [
      "We aim for high availability but don't guarantee the service will be uninterrupted or error-free. We may perform maintenance that temporarily affects access, and we'll try to minimize disruption.",
    ],
  },
  {
    heading: "7. Termination",
    body: [
      "You may close your account at any time. We may suspend or terminate accounts that violate these terms, with notice where practical.",
      "Upon termination, you can request an export of your data within a reasonable window before it's deleted.",
    ],
  },
  {
    heading: "8. Limitation of liability",
    body: [
      "CoachevaOS is provided \"as is.\" To the extent permitted by law, we aren't liable for indirect, incidental, or consequential damages arising from your use of the platform.",
    ],
  },
  {
    heading: "9. Changes to these terms",
    body: [
      "We may update these terms from time to time. Material changes will be posted here, and where appropriate we'll notify account owners by email.",
    ],
  },
  {
    heading: "10. Contact",
    body: ["Questions about these terms can be sent to legal@coachevaos.com."],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
          <Eyebrow className="mb-4">Legal</Eyebrow>
          <h1 className="font-heading mb-2 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
            Terms of Service
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
            <Link href="/privacy" className="hover:text-accent-600">
              Privacy Policy
            </Link>
            <Link href="/blog" className="hover:text-accent-600">
              Blog
            </Link>
            <Link href="/" className="hover:text-accent-600">
              Home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
