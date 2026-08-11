export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  tag: string;
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-price-your-coaching-packages",
    title: "How to Price Your Coaching Packages (Without Underselling Yourself)",
    description:
      "A practical framework for pricing 1:1 and group coaching — from hourly-rate math to package-based pricing that reflects the transformation you deliver.",
    date: "2026-06-02",
    readTime: "7 min read",
    tag: "Business",
    sections: [
      {
        heading: "Stop pricing by the hour",
        paragraphs: [
          "Most new coaches start by pricing their time: an hourly rate borrowed from a corporate salary or a competitor's website. The problem is that hourly pricing caps your income to your calendar and quietly tells clients you're selling sessions, not outcomes.",
          "Clients aren't paying for 45 minutes of your attention — they're paying to reach a goal faster and with more accountability than they'd manage alone. Pricing that reflects the transformation, not the clock, is the single biggest lever independent coaches have over their income.",
        ],
      },
      {
        heading: "Move to package-based pricing",
        paragraphs: [
          "A package bundles a defined outcome, a time horizon, and a set of deliverables — for example, a 12-week program with weekly sessions, async check-ins, and a program plan — into one price. This does two things: it removes the friction of a client mentally multiplying your hourly rate by however many months they think they'll need you, and it protects your income from no-shows and short sessions.",
          "A simple starting structure many independent coaches land on: a lower-priced single session for people testing the fit, a mid-tier 8–12 week package as the default offer, and a premium tier that adds higher-touch support (more check-ins, faster response times, done-with-you materials).",
        ],
      },
      {
        heading: "Price to your capacity, not just the market",
        paragraphs: [
          "Two coaches with identical skills can rationally charge very different prices if one has 40 open client slots and the other has 8. If you're consistently full with a waitlist, that's a pricing signal, not just a marketing win — it usually means you should raise prices before you add more hours to your week.",
          "A rough gut-check: pick your ideal number of active clients (most solo coaches find 15–35 is sustainable alongside admin and marketing time), divide your income goal by that number, and see how far that number is from your current price. If it's a big gap, plan a staged increase over your next few cohorts rather than shocking existing clients mid-program.",
        ],
      },
      {
        heading: "Grandfather existing clients, not future ones",
        paragraphs: [
          "When you raise prices, it's reasonable — and good for trust — to honor the original rate for clients already in an active package. New price applies at renewal or to new sign-ups. Communicate the change with enough notice that it never feels sprung on someone.",
        ],
      },
      {
        heading: "Track what a price change actually does",
        paragraphs: [
          "Before you guess again next quarter, look at your own conversion data: how many leads asked about pricing, how many booked, and where in the pipeline people dropped off. A lead pipeline that shows leads stalling right after a pricing conversation is a much clearer signal than any industry benchmark.",
        ],
      },
    ],
  },
  {
    slug: "client-onboarding-checklist-for-coaches",
    title: "The Client Onboarding Checklist Every Coach Needs",
    description:
      "The first two weeks decide whether a client sticks around for the full program. Here's a repeatable onboarding sequence that builds trust fast.",
    date: "2026-06-10",
    readTime: "6 min read",
    tag: "Client experience",
    sections: [
      {
        heading: "Why onboarding is where retention is won or lost",
        paragraphs: [
          "A client who feels organized and welcomed in their first two weeks is far more likely to finish a program than one who's left to figure things out. Most churn in coaching businesses doesn't happen at month three — it happens in week one, when a new client isn't sure what's expected of them or whether anyone's paying attention.",
        ],
      },
      {
        heading: "Before the first session",
        paragraphs: [
          "Send a short intake form that captures goals, relevant history, and logistics (timezone, availability, any constraints) before you ever get on a call — it lets you walk into session one already prepared instead of spending it on paperwork.",
          "Confirm the mechanics up front: where messages happen, how to book or reschedule sessions, and what to expect between sessions. Ambiguity here is one of the most common (and most avoidable) sources of early frustration.",
        ],
      },
      {
        heading: "The first session: build the container, not just rapport",
        paragraphs: [
          "Beyond getting to know each other, use session one to agree on a concrete first milestone and a cadence for check-ins. Clients who leave the first call with a specific, dated next step are noticeably more likely to show up engaged for session two.",
        ],
      },
      {
        heading: "The first two weeks: proactive, not reactive",
        paragraphs: [
          "Reach out once between sessions — even a short check-in message — before a client has to reach out to you first. It signals that the relationship isn't just a weekly appointment, and it surfaces confusion or hesitation early, while it's still easy to address.",
        ],
      },
      {
        heading: "Make it repeatable, not reinvented every time",
        paragraphs: [
          "Write your onboarding sequence down as a checklist: intake sent, session one booked, first milestone set, day-3 check-in sent, first task assigned. A written sequence means quality doesn't depend on how busy your week is, and it's the first thing you hand off if you ever bring on a second coach.",
        ],
      },
    ],
  },
  {
    slug: "reduce-no-shows-and-late-cancellations",
    title: "How to Reduce No-Shows and Late Cancellations",
    description:
      "No-shows cost independent coaches real income and momentum with clients. These five changes meaningfully cut them without turning into a rigid policy.",
    date: "2026-06-18",
    readTime: "5 min read",
    tag: "Operations",
    sections: [
      {
        heading: "Most no-shows are a friction problem, not a commitment problem",
        paragraphs: [
          "It's tempting to read a no-show as a client who isn't serious. In practice, most no-shows come from friction: an unclear booking link, no reminder, or a session that's easy to forget because it wasn't top of mind. Fix the friction before you assume a motivation problem.",
        ],
      },
      {
        heading: "Automate the reminder, don't rely on memory",
        paragraphs: [
          "A reminder 24 hours before and another an hour before catches both \"I forgot entirely\" and \"I meant to reschedule and didn't get to it.\" This is worth automating rather than manually messaging every client — it's the highest-leverage, lowest-effort fix on this list.",
        ],
      },
      {
        heading: "Make rescheduling easier than no-showing",
        paragraphs: [
          "If canceling or moving a session requires a back-and-forth message, some clients will simply skip instead. A visible, self-serve way to reschedule — tied to your real calendar availability — removes the main reason people just don't show up.",
        ],
      },
      {
        heading: "Have a clear, calmly-stated late-cancellation policy",
        paragraphs: [
          "State it once, in writing, during onboarding — for example, sessions cancelled with less than 24 hours' notice count toward the package. Consistently enforcing a policy you've clearly communicated protects your time far better than an unwritten expectation you only mention after it's broken.",
        ],
      },
      {
        heading: "Watch for the pattern, not just the single miss",
        paragraphs: [
          "One no-show is logistics. A second or third from the same client, especially alongside declining message frequency, is usually a signal of disengagement worth a direct conversation — treat it as an early-warning sign, not just a scheduling inconvenience.",
        ],
      },
    ],
  },
  {
    slug: "choosing-your-coaching-niche",
    title: "Choosing Your Coaching Niche: A Practical Framework",
    description:
      "\"Niche down\" is common advice — here's how to actually choose one, using what you already know about your best clients instead of guessing.",
    date: "2026-06-25",
    readTime: "6 min read",
    tag: "Business",
    sections: [
      {
        heading: "Why generalist positioning quietly costs you clients",
        paragraphs: [
          "\"I coach anyone who wants to improve their life\" sounds inclusive, but it makes referrals and marketing much harder — a prospective client can't easily tell if you're right for their specific situation, so they default to someone whose positioning speaks directly to them.",
        ],
      },
      {
        heading: "Start from your best clients, not a blank page",
        paragraphs: [
          "Look back at the clients you've enjoyed working with most and who got the best results. What did they have in common — industry, life stage, specific goal, starting point? A niche that emerges from real pattern-matching is far more durable than one picked from a list of trendy categories.",
        ],
      },
      {
        heading: "A niche is a starting point, not a specific goal — and specific matters",
        paragraphs: [
          "\"Fitness coaching\" is a category. \"Strength training for new parents getting back into training after having a baby\" is a niche. The second version is more specific than most coaches are comfortable with at first, but it's exactly what makes referrals effortless — people forward you by name because they know exactly who you're for.",
        ],
      },
      {
        heading: "You can niche by outcome, by identity, or by method",
        paragraphs: [
          "Outcome-based niches focus on a specific result (\"first half-marathon in under 6 months\"). Identity-based niches focus on a type of person (\"career coaching for engineers moving into management\"). Method-based niches focus on how you work (\"habit-based coaching using daily micro check-ins\"). Most strong positioning combines two of the three.",
        ],
      },
      {
        heading: "Test it before you commit fully",
        paragraphs: [
          "You don't have to turn away every client outside your niche on day one. Update your marketing and intake language to speak to the niche, watch whether inbound leads get more specific and better-fit over a few months, and let the data — not just conviction — confirm the direction.",
        ],
      },
    ],
  },
  {
    slug: "client-retention-strategies-that-work",
    title: "Client Retention Strategies That Actually Work",
    description:
      "Acquiring a new client costs far more than keeping one. These retention habits are simple, unglamorous, and consistently effective.",
    date: "2026-07-03",
    readTime: "6 min read",
    tag: "Retention",
    sections: [
      {
        heading: "Retention starts with visible progress",
        paragraphs: [
          "Clients don't leave programs that are visibly working. The fastest way to increase retention isn't a new perk — it's making progress impossible to miss: a simple, regularly-updated view of where a client started and where they are now, revisited together on a set cadence rather than left buried in old notes.",
        ],
      },
      {
        heading: "Catch disengagement before it becomes churn",
        paragraphs: [
          "Missed check-ins, shorter messages, and skipped tasks are early signals, not just noise. Coaches who review these signals weekly — even informally — catch fading clients while there's still time for a direct conversation, instead of finding out when a client quietly doesn't renew.",
        ],
      },
      {
        heading: "Make it easy to stay, not just hard to leave",
        paragraphs: [
          "Long contracts and cancellation friction retain clients on paper but erode trust and referrals. The stronger version of retention is removing the reasons someone would want to leave: responsiveness, a clear sense of what's next, and evidence the work is paying off.",
        ],
      },
      {
        heading: "Renewal conversations should never be a surprise",
        paragraphs: [
          "If a package is ending in two weeks, that's the wrong moment to bring up renewal for the first time. Reference the upcoming end date and next steps a few weeks out, framed around what's next in their goals — renewal becomes a natural continuation, not an ask.",
        ],
      },
      {
        heading: "Ask clients who leave why they left",
        paragraphs: [
          "Not every client will renew, and that's fine. A short, low-pressure question when someone doesn't continue — timing, price, fit, or something else — turns churn into the most honest feedback you'll get about your program.",
        ],
      },
    ],
  },
  {
    slug: "turning-leads-into-clients-follow-up-system",
    title: "Turning Leads Into Clients: A Follow-Up System That Works",
    description:
      "Most lost leads aren't lost to a competitor — they're lost to silence. Here's a simple follow-up cadence that keeps leads warm without feeling pushy.",
    date: "2026-07-11",
    readTime: "6 min read",
    tag: "Leads & sales",
    sections: [
      {
        heading: "The real reason leads go cold",
        paragraphs: [
          "It's rarely that a lead chose a competitor. Far more often, they got busy, the inquiry slipped down their inbox, and nobody followed up before the moment of interest passed. A consistent follow-up cadence recovers a meaningful share of leads that would otherwise just go quiet.",
        ],
      },
      {
        heading: "Respond fast on the first touch",
        paragraphs: [
          "Response speed on an initial inquiry matters more than almost anything else in the sequence — interest is highest right when someone reaches out, and it decays quickly. Same-day response should be the minimum bar, with same-hour where practical.",
        ],
      },
      {
        heading: "A five-touch cadence covers most of what's recoverable",
        paragraphs: [
          "A workable default: immediate acknowledgment, a same-day or next-day substantive reply, a check-in a few days later if there's been no response, a value-add touch a week or so out (a relevant resource, not just \"just following up\"), and a final, low-pressure close-the-loop message a few weeks later. Stages map cleanly onto a simple pipeline: New → Contacted → Follow-up → Booked.",
        ],
      },
      {
        heading: "Track where leads actually stall",
        paragraphs: [
          "A pipeline view that shows how long each lead has sat in a stage — not just its current stage — makes stale leads visible instead of invisible. A lead sitting in \"Contacted\" for three weeks is a different problem than one that arrived yesterday, and treating them the same wastes the leads still worth chasing.",
        ],
      },
      {
        heading: "Don't let source data go to waste",
        paragraphs: [
          "Knowing whether a lead came from a referral, a form on your site, or a social post lets you double down on what's actually converting instead of guessing. Even a simple source tag on each lead pays for itself the first time you review a quarter of pipeline data.",
        ],
      },
    ],
  },
  {
    slug: "how-to-run-effective-client-check-ins",
    title: "How to Run Effective Check-Ins With Coaching Clients",
    description:
      "Check-ins are one of the highest-leverage habits in a coaching relationship — if they're structured well. Here's what makes one actually useful.",
    date: "2026-07-20",
    readTime: "5 min read",
    tag: "Client experience",
    sections: [
      {
        heading: "A check-in is not just \"how's it going\"",
        paragraphs: [
          "An unstructured check-in tends to produce an unstructured answer — \"fine,\" \"busy week,\" nothing you can act on. A useful check-in asks two or three specific, consistent questions every time, so answers become comparable week over week instead of a one-off mood report.",
        ],
      },
      {
        heading: "Daily and weekly check-ins serve different jobs",
        paragraphs: [
          "A short daily check-in (mood plus one line on today) keeps momentum visible without asking for much effort. A weekly check-in (mood, a win, a challenge) is where real pattern-spotting happens — it's the one worth actually reading closely and referencing in your next session.",
        ],
      },
      {
        heading: "Close the loop, or clients stop bothering",
        paragraphs: [
          "A check-in that disappears into the void trains clients to stop filling it in. Even a short acknowledgment — noticing a specific win, or gently following up on a stated challenge — is what makes the habit stick on both sides.",
        ],
      },
      {
        heading: "Use check-ins to catch risk early",
        paragraphs: [
          "A string of skipped check-ins, or a shift from upbeat to flat one-liners, is often the earliest available signal that a client is struggling or disengaging — well before it shows up as a missed session or a cancellation.",
        ],
      },
    ],
  },
  {
    slug: "running-a-solo-coaching-practice-without-burning-out",
    title: "Systems Over Hustle: Running a Solo Coaching Practice Without Burning Out",
    description:
      "The coaches who last aren't the ones working the most hours — they're the ones who've turned the repeatable parts of the business into systems.",
    date: "2026-07-29",
    readTime: "7 min read",
    tag: "Operations",
    sections: [
      {
        heading: "The hidden second job every solo coach has",
        paragraphs: [
          "Coaching is the visible work. Intake, scheduling, invoicing, follow-ups, notes, and progress tracking are the invisible second job that determines whether the first one is sustainable. Coaches who burn out are rarely tired of coaching — they're tired of everything around it.",
        ],
      },
      {
        heading: "Systematize the things that repeat every client",
        paragraphs: [
          "Onboarding, check-in cadence, session prep, and renewal conversations happen for every client, every time. Written down once as a checklist or template, they stop costing decision-making energy on top of execution energy — the biggest source of quiet fatigue in a solo practice.",
        ],
      },
      {
        heading: "One home for client context beats five apps",
        paragraphs: [
          "Notes in one app, messages in another, files emailed, progress tracked in a spreadsheet — the tax isn't any single tool, it's the constant context-switching between them before every session. Keeping a client's full picture — goals, notes, messages, tasks, files — in one place removes that tax entirely.",
        ],
      },
      {
        heading: "Protect unscheduled time on purpose",
        paragraphs: [
          "A calendar that's back-to-back client sessions with no buffer guarantees admin work spills into evenings and weekends. Deliberately blocking non-client time for the operational side of the business — even a fixed hour a day — keeps it from eating into rest.",
        ],
      },
      {
        heading: "Let data tell you what to fix, not just instinct",
        paragraphs: [
          "A quick look at conversion rate, task completion, and at-risk clients each week surfaces real problems faster than gut feel alone — and it's a lot less draining than carrying a vague sense that \"something's off\" without being able to name it.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
