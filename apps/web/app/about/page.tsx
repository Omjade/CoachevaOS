import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About",
  description: "Why CoachevaOS exists: one calm workspace for independent coaches, built to replace the spreadsheets, WhatsApp threads, and email chains most practices run on today.",
};

const BELIEFS = [
  {
    heading: "You own your data",
    body: "Every client record, note, and conversation belongs to your practice. If you ever leave, it leaves with you.",
  },
  {
    heading: "Built for solo practices, not enterprises",
    body: "No seat licenses, no admin hierarchies to configure. CoachevaOS is sized for one coach running their own business, from day one to two hundred clients.",
  },
  {
    heading: "AI that drafts, you approve",
    body: "Every AI-generated message, follow-up, or plan is a draft you review before anything reaches a client. Nothing is ever sent on your behalf automatically.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Eyebrow className="mb-4">About</Eyebrow>
        <h1 className="font-heading mb-5 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
          Coaching software built around the actual job
        </h1>
        <div className="mb-12 flex flex-col gap-4 text-sm leading-relaxed text-neutral-600">
          <p>
            Most independent coaches run their practice across five tools that were never
            designed to talk to each other: a spreadsheet for client progress, WhatsApp for
            day-to-day messages, email for follow-ups, Calendly for bookings, and a Google Drive
            folder for everything else. Nothing shares context, so every client relationship
            lives in fragments across your phone and laptop.
          </p>
          <p>
            CoachevaOS started from a simple frustration: coaching is relationship work, and
            relationship work suffers when the coach spends their morning hunting for context
            instead of preparing for the people in front of them. We built one workspace: client
            records, messaging, bookings, billing, and an AI daily briefing that tells you who
            actually needs your attention, so the tools get out of the way of the coaching.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BELIEFS.map((b) => (
            <Card key={b.heading}>
              <h2 className="font-heading mb-2 text-sm font-semibold text-neutral-900">{b.heading}</h2>
              <p className="text-xs leading-relaxed text-neutral-600">{b.body}</p>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
