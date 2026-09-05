import type { Metadata } from "next";
import { EnvelopeSimpleIcon as EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { Card, Eyebrow } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with CoachevaOS for support, billing, or general questions.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Eyebrow className="mb-4">Contact</Eyebrow>
        <h1 className="font-heading mb-5 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
          Get in touch
        </h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-neutral-600">
          Questions about the product, your account, or billing — we read every message and
          reply from a real person, usually within one business day.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Card className="flex flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <EnvelopeSimple className="h-5 w-5" weight="fill" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">General & legal</p>
              <a
                href="mailto:legal@coachevaos.com"
                className="text-sm text-accent-600 hover:underline"
              >
                legal@coachevaos.com
              </a>
            </div>
          </Card>

          <Card className="flex flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <EnvelopeSimple className="h-5 w-5" weight="fill" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Billing & payments</p>
              <a
                href="mailto:sales@coachevaos.com"
                className="text-sm text-accent-600 hover:underline"
              >
                sales@coachevaos.com
              </a>
            </div>
          </Card>
        </div>

        <p className="mt-8 max-w-xl text-xs leading-relaxed text-neutral-500">
          Payments on CoachevaOS are processed by Paddle.com, our Merchant of Record. For a
          question about a specific charge or refund, see{" "}
          <a
            href="https://www.paddle.com/legal/refund-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 hover:underline"
          >
            Paddle's Refund Policy
          </a>{" "}
          or reach out to us at the billing address above and we'll help route it.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
