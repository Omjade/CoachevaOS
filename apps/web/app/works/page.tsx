import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "How Coaches Use It",
  description: "Example workflows showing how a coaching week actually runs on CoachevaOS: fitness, business, and career coaching scenarios.",
};

const SCENARIOS = [
  {
    role: "Fitness coach",
    title: "A weekly rhythm that doesn't start from a blank page",
    body: "Monday morning opens with the AI daily briefing: two clients haven't logged a check-in in over a week, one has a session today with no note from last time. The coach messages both quiet clients from the branded portal thread, reviews the AI-drafted session prep before the 10am call, and logs the session note afterward. The assistant turns that note into a follow-up message and a suggested goal update, both reviewed before sending.",
  },
  {
    role: "Business coach",
    title: "From a cold lead to a paying client without a spreadsheet",
    body: "A prospect fills out the coach's public form. It lands in the lead pipeline automatically, tagged 'new'. After an intro call, the coach drags it to 'booked' and converts it to a client in one click: the client's onboarding portal, goals, and first invoice are ready before the next message is sent.",
  },
  {
    role: "Career coach",
    title: "Check-ins that replace a dozen loose email threads",
    body: "Clients submit weekly check-ins directly through their portal instead of emailing updates. The coach's dashboard surfaces anyone falling behind on their job-search goals, and a quick AI-drafted summary gives a 30-second read on where each client stands before their next session.",
  },
];

export default function WorksPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto w-full max-w-3xl px-3 py-10 md:px-4">
        <Eyebrow className="mb-4">How coaches use it</Eyebrow>
        <h1 className="font-heading mb-3 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
          A few days on CoachevaOS
        </h1>
        <p className="mb-12 max-w-lg text-sm leading-relaxed text-neutral-600">
          These are illustrative workflows showing how the product fits together day to day,
          not case studies of specific customers.
        </p>

        <div className="flex flex-col gap-5">
          {SCENARIOS.map((s) => (
            <Card key={s.title}>
              <Eyebrow className="mb-3">{s.role}</Eyebrow>
              <h2 className="font-heading mb-2 text-lg font-semibold text-neutral-900">{s.title}</h2>
              <p className="text-sm leading-relaxed text-neutral-600">{s.body}</p>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
