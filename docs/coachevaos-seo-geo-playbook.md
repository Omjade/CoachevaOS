# CoachEvaOS — SEO & GEO Growth Playbook (v6 — Preferred Sources + Pre-Launch Hygiene Checklist)

> **v6 changelog:** added Section 5c, a reconciled pre-launch site hygiene checklist (privacy policy, terms, custom 404, analytics, cookie consent, accessibility, form/link QA — 8 genuine gaps found against a standard 20-point launch checklist). Added Section 7b, Google Preferred Sources — a confirmed, currently-shipping Google mechanism (verified against Google's own Search Central docs, last updated August 20, 2026) that surfaces a "preferred" badge on citations in Top Stories, AI Mode, and AI Overviews, with exact implementation code. Both folded into the pre-launch build plan (Section 8) and the free tools table (Section 10).
>
> **v5 changelog:** competitor set reconciled against live search research done in a Claude Code session — CoachAccountable, Paperbell, Satori, Simply.Coach, and Delenta confirmed as the five who actually dominate the coaching-software SERP, replacing the earlier Practice/Quenza assumption. All comparison-page targets, keyword rows, and the differentiation stat ("only ~1/3 of coaching-software products have real AI features") updated to match. See the companion file `coachevaos-claude-code-build-guide.md` for the full reconciled implementation plan, including a real audit of what's already built in the codebase.
>
> **v4 changelog:** removed all calendar-based phasing. Every keyword tier, every blog post, every niche and comparison page now ships before launch in one continuous build — no drip schedule.
>
> **v3 changelog:** added a Fitness/PT coaching vertical (Pillar 6) with an honest caveat about feature fit, a templates/dashboard lead-magnet vertical (Pillar 7) validated by real Google-side search data, and a full brand/domain consistency checklist for coachevaos.com.
>
> **v2 changelog:** merged the original 30-keyword plan with a second-opinion 20-keyword review and a technical production checklist. Keywords reorganized into Focus/Expand/Later tiers; competitor landscape updated with newly-verified AI-native players (Quenza, Coachful); page template upgraded to an 11-part structure; AI-crawler robots.txt directives added; measurement framework expanded; local/directory SEO added as an optional appendix since it assumes a public coach-directory feature not confirmed to be in scope.


**Goal:** Build real, compounding organic visibility on Google and in AI answer engines (ChatGPT, Perplexity, Gemini, Google AI Overviews) for CoachEvaOS.

**Honest framing up front:** no one can guarantee a #1 ranking — not Claude, not an agency, not a paid tool. What actually works is a phased approach: win the low-competition, high-intent keywords first, use that traffic and authority to climb toward the competitive head terms, and treat GEO as a byproduct of genuinely good, well-structured, well-ranked content rather than a separate hack.

---

## 0. Competitor landscape update (changes messaging slightly)

**Reconciliation note (supersedes the list below for comparison-page targeting):** a later Claude Code session ran live search research directly (not assumption-based) and confirmed the five competitors who actually dominate the coaching-software SERP today: **CoachAccountable, Paperbell, Satori, Simply.Coach, and Delenta.** Build comparison pages against these five (see the reconciled table below), not Practice/Quenza as earlier drafts of this document assumed. Coachful and Klarity below remain useful as *positioning* context (real AI-forward competitors worth knowing about) even though they didn't resurface in the confirmed five — keep the differentiation guidance, just point the `/compare/` pages at the confirmed list.

| Competitor | Owns | Where they're thin |
|---|---|---|
| CoachAccountable | "Coaching practice management," accountability & between-session tracking | Fitness-and-wellness-flavored UX; no meaningful AI |
| Paperbell | "Sell + deliver coaching," checkout-and-packages angle | Weak on ops/CRM depth once a client is signed |
| Satori | Qualification-heavy discovery calls, enterprise-leaning | Heavier, less approachable for a solo coach |
| Simply.Coach | Compliance / corporate coaching structure | Priced and positioned for organizations, not solos |
| Delenta | Group coaching, mobile-first delivery | Broad rather than deep on any one workflow |

**The confirmed differentiation stat:** independent research into "AI coaching platforms 2026" found only about a third of coaching-software products offer real AI features today, and none of the five above lead with it. Use this number directly in AI-cluster and comparison-page copy — it's more concrete and citable than a general "most competitors lack AI" claim.

New research surfaced two AI-native players that weren't in the original competitor scan, plus confirms the "coaching CRM" SERP is more contested than it looks:

- **Coachful** — already ships an "AI Summary" on the dashboard, program/retention tracking (e.g., "92% retention"), and habit/streak tracking. This is a real AI-positioned competitor, not just a feature-store platform.
- **Quenza** — established behavioral-science-based coaching app platform; shows up consistently in comparison content alongside CoachAccountable, Paperbell, Simply.Coach, and Delenta. Add to the comparison-page list.
- **Klarity** — positions specifically around "a CRM that remembers the coaching relationship, not just the lead" (client-memory angle). Verify current scale/traction yourself before treating it as a major competitor, but the *positioning angle* is worth noting regardless.
- **"Coaching CRM" is not a clean niche SERP.** Generic CRMs — HubSpot, Nutshell, ActiveCampaign, Salesmate — actively publish "best CRM for coaches" content and rank for these terms. That keyword cluster is more competitive than the original scan assumed.

**What this changes:** "AI-powered" alone is no longer an uncontested claim — Coachful already uses that exact language. Your differentiation needs to be more specific than "we have AI": lead with the combination that's actually hard to copy — an **AI Daily Command Center that prioritizes across your entire client base**, not just a per-client summary, plus **Risk & Attention Alerts** that catch disengagement before a client churns. That's a business-wide operating layer, not a single AI feature bolted onto a CRM. Use that framing consistently across every AI-cluster page and comparison page below.

---

## 0b. Two new keyword verticals — with an honest caveat on one of them

**Fitness/PT coaching is a different market, not a sub-niche.** The established players are Trainerize, TrueCoach, Everfit, PT Distinction, My PT Hub, HubFit, and newer entrants like Coachway — and every one of them leads with a workout builder, exercise library, and nutrition/macro tracking. That's table stakes for a fitness-coach buyer. **If CoachEvaOS doesn't have workout-programming features, ranking for "online fitness coach software" will bring visitors who bounce** when they land on a page that talks about client management and AI check-ins but has no way to build a training program. Two honest paths forward — pick one before building these pages:
- **(a)** Position fitness pages around what CoachEvaOS genuinely does well for fitness coaches — client roster management, scheduling, payments, check-in automation, AI risk alerts for clients going quiet — and explicitly say it pairs alongside a workout app, not that it replaces one.
- **(b)** Skip the fitness vertical for launch and revisit once/if workout-programming features exist.

The plan below builds the pages under path (a); swap to skip if that's not accurate to the product.

**Templates/spreadsheet content is a real, validated opportunity — pursue this one without caveats.** "Client tracker spreadsheet," "coaching dashboard template," and similar terms rank organically on Google (dedicated template shops, not just Etsy), confirming genuine search demand. This becomes a strong top-of-funnel lead-magnet channel: free downloadable Google Sheets templates that naturally convert into CoachEvaOS trials once someone outgrows a spreadsheet.

---

## 0c. Fitness & PT keyword set (Pillar 6)

Your list of fitness-coach niche terms, deduplicated and split into two types — **software-search terms** (what a fitness coach types into Google to find a tool) and **niche persona terms** (how a fitness coach describes their own specialty, useful for landing-page copy and self-identification, less useful as a standalone Google keyword since volume is low and mostly branded/social-driven):

**Software-search keywords (real SEO targets):**
| Keyword | Target page |
|---|---|
| online fitness coaching software | `/solutions/fitness-coaches` |
| personal trainer software | `/solutions/fitness-coaches` |
| PT client management software | `/solutions/fitness-coaches` |
| fitness coach client tracker | blog/template cluster |
| online personal training software | `/solutions/fitness-coaches` |
| weight loss coach software | `/solutions/fat-loss-coaches` |
| strength coach software | `/solutions/strength-coaches` |

**Niche persona terms (fold into landing-page copy, testimonials, and ad targeting rather than treating each as its own high-volume keyword):**
Online Glute Builder / Glute Coach, Wellness Bodybuilder, Women's Wellness Coach, Women's Fitness Coach, Fat Loss Coach, Exercise & Nutrition Coach, Health/Autoimmune Coach, Wellness Lifestyle Coach, Lifestyle Coaching — these read as how coaches brand *themselves* on Instagram/TikTok, not what they type into Google. Use them as section headers and testimonial-source labels on `/solutions/fitness-coaches` ("built for glute-program coaches, strength coaches, and fat-loss coaches alike") rather than building a separate thin page per label — that would create near-duplicate content with almost no independent search volume behind it.

**Recommended niche pages (consolidated from your full list):**
- `/solutions/fitness-coaches` (umbrella page — covers PT, online fitness coach, general "Fitness & PT")
- `/solutions/strength-coaches`
- `/solutions/fat-loss-coaches` (covers Fat Loss Coach, Weight Loss Coach)
- `/solutions/women-fitness-coaches` (covers women wellness/fitness, glute-focused coaches, bodybuilding)
- `/solutions/wellness-lifestyle-coaches` (covers wellness lifestyle, exercise & nutrition, autoimmune/health coaching)

---

## 0d. Templates & dashboard keyword set (Pillar 7)

| Keyword | Target page/asset |
|---|---|
| client tracker template for coaches | `/templates/client-tracker` (free Google Sheets download) |
| coaching spreadsheet template | `/templates/coaching-spreadsheet` |
| free client management spreadsheet | `/templates/client-tracker` |
| coaching client tracker google sheets | `/templates/client-tracker` |
| personal trainer client tracker spreadsheet | `/templates/pt-client-tracker` |
| client dashboard | `/features/client-dashboard` (product page, not a template) |
| coaching dashboard | `/features/coaching-dashboard` (product page, not a template) |
| client dashboard template | `/templates/client-dashboard` |

**How this works as a funnel:** build 3–4 genuinely free, no-signup-required Google Sheets templates (general client tracker, PT-specific client tracker, coaching dashboard). Each gets its own short landing page targeting the exact keyword, with the real download link up front — don't gate it behind an email wall, since these keywords have informational intent and a gate kills both conversion and shareability. End each template page with one honest line: *"Outgrown the spreadsheet? See what it looks like as a full client workspace →"* linking to `/features/client-dashboard`. This mirrors the same funnel insight from the earlier Etsy research, now running on your own domain instead of a marketplace you don't control.

`/features/client-dashboard` and `/features/coaching-dashboard` double as real product pages (not just SEO bait) — they should showcase the actual Personalized Client Workspace and AI Daily Command Center features from the product brief, since these two keywords have decent commercial intent from people already comparing tools, not just template-seekers.

---

## 1. Site architecture (build this before writing content)

```
coachevaos.com/
├── / (home)
├── /blog/
│   ├── /blog/coaching-software/           ← Pillar 1 hub
│   ├── /blog/ai-coaching-software/        ← Pillar 2 hub
│   └── /blog/client-management/           ← Pillar 3 hub
├── /solutions/
│   ├── /solutions/life-coaches
│   ├── /solutions/health-coaches
│   ├── /solutions/executive-coaches
│   ├── /solutions/business-coaches
│   ├── /solutions/career-coaches
│   ├── /solutions/wellness-coaches
│   ├── /solutions/fitness-coaches         ← new (Pillar 6)
│   ├── /solutions/strength-coaches        ← new
│   ├── /solutions/fat-loss-coaches        ← new
│   ├── /solutions/women-fitness-coaches   ← new
│   └── /solutions/wellness-lifestyle-coaches ← new
├── /features/
│   ├── /features/client-dashboard         ← new (Pillar 7)
│   └── /features/coaching-dashboard       ← new
├── /templates/                            ← new (Pillar 7, free lead-magnet downloads)
│   ├── /templates/client-tracker
│   ├── /templates/coaching-spreadsheet
│   ├── /templates/pt-client-tracker
│   └── /templates/client-dashboard
└── /compare/
    ├── /compare/coachaccountable-alternative
    ├── /compare/paperbell-alternative
    ├── /compare/satori-alternative
    ├── /compare/simply-coach-alternative
    ├── /compare/delenta-alternative
    ├── /best-coaching-software-solo-coaches
    └── /best-all-in-one-coaching-platform
```

Keep `/blog/` (educational, cluster-linked) and `/solutions/` + `/compare/` + `/features/` + `/templates/` (commercial/conversion-focused) as separate silos. Link from blog posts down into these via contextual CTAs — not the reverse. This is the single structural decision that most affects whether your content compounds or just sits there.

---

## 1b. Brand & domain consistency checklist — coachevaos.com

Since GEO relies heavily on AI systems cross-referencing identical entity information across the web (Section 7), inconsistency here quietly undermines everything else in this plan. Lock these down before publishing a single page:

- [ ] **Canonical domain:** `coachevaos.com` everywhere — no `www.coachevaos.com` vs. `coachevaos.com` split (pick one, 301-redirect the other), no alternate domains referenced anywhere public
- [ ] **Brand name spelling:** exactly "CoachEvaOS" — one word, capital C/E/O/S — in every title tag, schema `Organization.name`, social bio, and directory listing. Never "Coach Eva OS," "Coach EvaOS," or "CoachEva OS"
- [ ] **Tagline consistency:** pick one tagline and reuse it verbatim across the homepage, schema `Organization.description`, G2/Capterra listings, and social bios — e.g. "The AI operating system for coaches"
- [ ] **Email:** `hello@coachevaos.com` (or equivalent) — not a Gmail/generic address on any public-facing contact point
- [ ] **Social handles:** reserve `@coachevaos` (or the closest available match) on every platform you'll actually use — LinkedIn, X, Instagram, TikTok if relevant — and use the same handle string everywhere rather than platform-specific variants
- [ ] **URL slug convention:** all lowercase, hyphen-separated, no underscores or trailing slashes inconsistency (`/compare/paperbell-alternative`, never `/Compare/Paperbell_Alternative`)
- [ ] **Title tag template:** `{Primary Keyword} | {Benefit} — CoachEvaOS` used identically across every page type
- [ ] **Consistent logo/visual assets across listings:** whatever logo asset is live on your site should match what's on G2/Capterra/directory listings — this is a design-ops task to coordinate with whoever owns the visual assets, not a step covered in this SEO plan
- [ ] **NAP-equivalent consistency for directories:** company name, one-line description, and category should read identically on G2, Capterra, Product Hunt, and AlternativeTo — copy from a single source-of-truth doc, don't rewrite per-platform

---

---

## 2. The 30 target keywords — organized as Focus / Expand / Later

**Build-scope note:** all 30 keywords and every page below ship before launch (see Section 8) — nothing is held back. The Focus/Expand/Later split below is not a build delay; it's **post-launch attention priority**: once the site is live, Focus-tier pages get the first round of refinement, backlink outreach, and iteration based on Search Console data, Expand-tier follows, Later-tier (the highest-competition head terms) gets attention once the site has real domain authority behind it. Every page still gets built and published at launch regardless of tier.

### 🔥 FOCUS — build these first (16 keywords)
| # | Keyword | Target page |
|---|---|---|
| 1 | AI coaching software | `/ai-coaching-software/` |
| 2 | AI coach copilot | blog cluster |
| 3 | AI client management software | blog cluster |
| 4 | coaching software with AI insights | blog cluster |
| 5 | client management software for coaches | `/client-management-software/` |
| 6 | coaching CRM | `/coaching-crm/` |
| 7 | coach client portal software | `/client-portal/` |
| 8 | client onboarding software for coaches | blog cluster |
| 9 | coaching automation software | `/coaching-automation/` |
| 10 | health coaching software | `/solutions/health-coaches` |
| 11 | executive coaching software | `/solutions/executive-coaches` |
| 12 | career coaching platform | `/solutions/career-coaches` |
| 13 | wellness coaching app | `/solutions/wellness-coaches` |
| 14 | CoachAccountable alternative | `/compare/coachaccountable-alternative` |
| 15 | Paperbell alternative | `/compare/paperbell-alternative` |
| 16 | best coaching software for solo coaches | `/best-coaching-software-solo-coaches` |

### ⏭ EXPAND — second-priority for post-launch refinement, still built pre-launch (9 keywords)
| # | Keyword | Target page |
|---|---|---|
| 17 | coaching software | `/coaching-software/` (pillar/category page) |
| 18 | coaching management software | blog/pillar support |
| 19 | software for coaches | supports pillar |
| 20 | coaching business software | blog cluster |
| 21 | online coaching platform | blog cluster |
| 22 | coaching scheduling software | blog cluster |
| 23 | life coaching software | `/solutions/life-coaches` |
| 24 | business coaching software | `/solutions/business-coaches` |
| 25 | Simply.Coach alternative | `/compare/simply-coach-alternative` |

### 🕐 LATER — hardest head terms; still built pre-launch, but win rate depends on future domain authority (5 keywords)
| # | Keyword | Target page |
|---|---|---|
| 26 | coaching platform | pillar page (head term) |
| 27 | all-in-one coaching software | blog cluster |
| 28 | Satori alternative | `/compare/satori-alternative` *(confirmed via live search research — replaces the earlier Quenza/Practice assumption)* |
| 29 | Delenta alternative | `/compare/delenta-alternative` *(confirmed via live search research)* |
| 30 | best all-in-one coaching platform 2026 | `/best-all-in-one-coaching-platform` |

**Two informational/GEO-friendly bonus targets** (not counted in the 30, but build these in the Focus phase alongside #8 and #9 — they're exactly the phrasing people put into ChatGPT/Perplexity):
- "how to manage coaching clients" → `/resources/manage-coaching-clients/`
- "how to automate a coaching business" → `/resources/automate-coaching-business/`

**Content-pillar grouping** (used by Section 3's blog calendar below — this groups the same 30 keywords by topic/hub instead of by timing tier; use the Focus/Expand/Later tables above for *when*, and this grouping for *which hub each post belongs to*):

- **Pillar 1 — Coaching Business Software:** coaching software, coaching business software, coaching platform, online coaching platform, all-in-one coaching software, coaching software for small business
- **Pillar 2 — AI Coaching:** AI coaching software, AI coach copilot, AI client management software, AI powered coaching platform, coaching software with AI insights, best AI tools for coaches
- **Pillar 3 — Client Management & Operations:** client management software for coaches, coaching CRM, coach client portal software, coaching scheduling software, client onboarding software for coaches, coaching business automation software / coaching automation software
- **Pillar 4 — Niche by Coach Type (commercial pages, not blog):** life, health, executive, business, career, wellness coaching
- **Pillar 5 — Comparisons (commercial pages, not blog):** CoachAccountable, Paperbell, Satori, Simply.Coach, Delenta alternatives + both roundup pages

*Reminder: verify exact monthly volumes for all 30 in Google Keyword Planner (free with a Google Ads account, no ad spend required) before finalizing your calendar — the tiers above are based on competitive-landscape reasoning, not live volume data.*

---

## 3. Blog content calendar — 3 pillars, 18 articles

### Pillar page 1: "The Complete Guide to Coaching Business Software in 2026"
- **Target keyword:** coaching software
- **Length:** 3,000–4,000 words
- **What to include:** what coaching software actually does, the 8 core feature categories (client management, scheduling, payments, forms, automation, resource library, AI features, analytics), how to evaluate a platform, a comparison table of the major players (CoachAccountable, Paperbell, Simply.Coach, CoachEvaOS), and links out to every cluster post below.
- **CTA:** free trial signup, mid-page and end-page.

**Cluster posts (link up to the pillar, and to each other where relevant):**

| Blog title | Target keyword | What to cover |
|---|---|---|
| What Is Coaching Business Software? (And Do You Actually Need One) | coaching business software | Signs you've outgrown spreadsheets/email, cost of admin time, before/after workflow |
| 12 Must-Have Features in a Modern Coaching Platform | coaching platform | Feature checklist buyers should screenshot and compare against vendors |
| How to Run Your Entire Coaching Business Online in 2026 | online coaching platform | End-to-end remote coaching workflow: booking → session → follow-up → payment |
| All-in-One vs. Stacked Tools: Why Coaches Are Ditching 5-App Workflows | all-in-one coaching software | Real cost comparison (time + subscriptions) of Calendly+Stripe+Notion+Zoom vs one platform |
| The Best Coaching Software for Small Coaching Businesses in 2026 | coaching software for small business | Budget-conscious roundup, positions CoachEvaOS's free/starter tier |

### Pillar page 2: "AI Coaching Software: What It Is and Why It's Replacing Manual Client Tracking"
- **Target keyword:** AI coaching software
- **Length:** 3,000+ words
- **What to include:** define the category (it barely exists as a search term yet — you get to define it), explain each AI capability in plain terms (command center, copilot, risk alerts, AI forms), address the "will AI replace coaches" objection head-on (it doesn't — it replaces admin), include a demo GIF/screenshot per feature.
- **CTA:** book a demo of the AI Copilot specifically.

**Cluster posts:**

| Blog title | Target keyword | What to cover |
|---|---|---|
| What Is an AI Coach Copilot, and How Does It Actually Save You Time? | AI coach copilot | Concrete before/after: "used to take 20 min prepping for a session, now takes 3" |
| How AI Is Changing Client Management for Coaches | AI client management software | Trend piece + practical examples, good for backlinks from coaching blogs |
| 5 Ways AI-Powered Coaching Platforms Outperform Traditional Tools | AI powered coaching platform | Direct comparison of manual vs. AI-assisted workflows, with time-saved estimates |
| AI Risk Alerts: How Software Can Flag a Disengaging Client Before You Lose Them | coaching software with AI insights | Churn/disengagement story, ties directly to your Risk & Attention Alerts feature |
| The Best AI Tools for Coaches in 2026 (Beyond ChatGPT) | best AI tools for coaches | Roundup including generic AI tools AND CoachEvaOS as the purpose-built option — high shareability, strong GEO candidate |

### Pillar page 3: "Client Management for Coaches: The Complete System"
- **Target keyword:** client management software for coaches
- **Length:** 2,500–3,500 words
- **What to include:** the full client lifecycle (lead → onboarding → active coaching → renewal/offboarding), what breaks when it's manual, how a dedicated system fixes it, feature deep-dive with screenshots.
- **CTA:** free trial + "see the client workspace" video.

**Cluster posts:**

| Blog title | Target keyword | What to cover |
|---|---|---|
| Do Coaches Actually Need a CRM? Here's How to Decide | coaching CRM | Honest decision framework — builds trust, ranks well for informational intent |
| What a Great Client Portal Should Feel Like (With Examples) | coach client portal software | Screenshots/mockups of CoachEvaOS's personalized workspace |
| How to Stop Losing Hours to Scheduling Back-and-Forth | coaching scheduling software | Practical scheduling workflow tips + product tie-in |
| The 5-Step Coaching Client Onboarding Flow That Converts | client onboarding software for coaches | Downloadable onboarding checklist/template as a lead magnet |
| 10 Coaching Business Tasks You Should Automate Today | coaching business automation software | Actionable list, each item maps to a CoachEvaOS automation feature |

---

## 3b. The page template — use this structure on every commercial page

Upgraded from the original CTA-heavy structure to an 11-part template that satisfies both a human buyer and an AI system trying to extract a clean answer:

1. **H1** — one clear primary keyword, no ambiguity
2. **Direct answer** — 40–70 words answering "What is [keyword]?" in plain language, immediately after the H1. This is the block most likely to get lifted verbatim into an AI Overview or ChatGPT answer, so it must be self-contained (no "as mentioned above," no vague pronouns).
3. **Pain** — the specific problem this page's visitor has right now
4. **Outcome** — what changes after using CoachEvaOS
5. **Product walkthrough** — real screenshots/GIFs, not stock imagery
6. **Feature sections** — only the features relevant to *this* keyword's intent, not every feature you have
7. **Use cases** — specific to the coach type or scenario this page targets
8. **Comparison** — CoachEvaOS vs. the relevant alternative(s)
9. **Proof** — testimonials, customer numbers, or specifics once you have them
10. **FAQ** — 4–6 real buyer questions, each answered in a self-contained paragraph
11. **CTA** — one clear next step (e.g., "Start your free trial — up to 10 active clients")

Apply this to every page in Section 4 below.

---

## 4. Commercial pages (not blog posts — dedicated landing pages)

### Niche solution pages (Pillar 4) — `/solutions/[niche]`
Build 6 near-identical templates, each customized with niche-specific language, testimonials, and use cases:

| Page | Target keyword | Customize with |
|---|---|---|
| /solutions/life-coaches | life coaching software | Goal-tracking, personal transformation language |
| /solutions/health-coaches | health coaching software | Progress tracking, habit check-ins, HIPAA-adjacent trust signals |
| /solutions/executive-coaches | executive coaching software | 360 feedback, confidentiality, enterprise billing |
| /solutions/business-coaches | business coaching software | Revenue/KPI tracking, multi-client dashboards |
| /solutions/career-coaches | career coaching platform | Resume/interview prep resources, milestone tracking |
| /solutions/wellness-coaches | wellness coaching app | Habit streaks, client self-service check-ins |

Each page: H1 with the exact keyword, 600–900 words, a feature table, one testimonial from that niche if you have one (or a placeholder pull-quote until you do), and a signup CTA.

### Comparison / alternative pages (Pillar 5) — `/compare/[competitor]-alternative`
These convert best of anything on this list — someone searching "Paperbell alternative" is actively shopping.

**Structure for each — use the 11-part template above, plus:**
1. H1: "CoachEvaOS vs. [Competitor]: Which Coaching Platform Is Right for You?"
2. Honest 1-paragraph summary of what the competitor does well (builds trust — never trash competitors)
3. Side-by-side feature comparison table (be accurate — this gets fact-checked by prospects who use both)
4. A dedicated row on AI features, since this is where you win every comparison — but be specific (see Section 0): "AI Daily Command Center across all clients" and "Risk & Attention Alerts," not generic "AI-powered"
5. Pricing comparison (if public)
6. 2–3 "switch from X" testimonials if/when you have them
7. **Don't write "CoachEvaOS is #1 because we're better."** Instead use honest, specific framing per use case: *"Best for AI-driven daily prioritization: CoachEvaOS. Best for metric-heavy accountability: CoachAccountable. Best for enterprise-scale discovery calls: Satori."* This format is both more trustworthy to a human reader and dramatically easier for an AI system to extract and cite accurately.
8. FAQ block at the bottom (see GEO section — this is your highest-value FAQ real estate)

Build these five (confirmed via live search research as the five who actually dominate this SERP — see Section 0):
- `/compare/coachaccountable-alternative`
- `/compare/paperbell-alternative`
- `/compare/satori-alternative`
- `/compare/simply-coach-alternative`
- `/compare/delenta-alternative`

Plus two roundup pages that let you rank #1 by definition (you control the list):
- `/best-coaching-software-solo-coaches` — target: "best coaching software for solo coaches"
- `/best-all-in-one-coaching-platform` — target: "best all-in-one coaching platform 2026"

---

## 4b. Linkable assets — your best free backlink magnets

Interactive tools attract links from coaching blogs and newsletters far more reliably than blog posts do, because bloggers can embed or reference them without duplicating your content:

1. **Coaching Client Capacity Calculator** — "How many clients can you realistically manage?"
2. **Coaching Revenue Calculator** — "How many clients do you need to hit $10K/month?"
3. **Client Retention/Churn Calculator** — "How much revenue are you losing to churn?"

Each should live at its own URL (`/tools/capacity-calculator`), be genuinely useful standalone (no forced signup to use it), and end with a soft CTA into CoachEvaOS. Build all 3 before launch alongside everything else — see Section 8.

## 4c. Original research — a real citation asset

Once you have enough active customers (aim for month 6+): run **"The State of Coaching Business Operations 2026/2027"** — survey coaches on client load, admin hours, tools used, churn, AI adoption, scheduling pain points. Original data is the single most linkable content format there is, and it's exactly the kind of "first-hand expertise and substantive analysis" Google's own helpful-content guidance says it wants to reward — as opposed to another rewrite of existing "best coaching software" listicles.

---

## 5. On-page & technical SEO checklist

- [ ] One keyword-matched H1 per page, no duplicates site-wide
- [ ] Title tag: `Primary Keyword | Secondary Benefit — CoachEvaOS` (under 60 characters)
- [ ] Meta description under 155 characters with a clear value prop, written for humans not just keyword stuffing
- [ ] Clean URL slugs matching the keyword (`/compare/paperbell-alternative`, not `/page?id=482`)
- [ ] Internal linking: every cluster post links up to its pillar AND sideways to 2–3 related cluster posts AND down to a relevant `/compare/` or `/solutions/` page
- [ ] XML sitemap submitted to Google Search Console (free) — do this on day one
- [ ] `robots.txt` doesn't accidentally block `/blog/` or `/compare/`
- [ ] Core Web Vitals: aim for LCP under 2.5s — test free at [PageSpeed Insights](https://pagespeed.web.dev)
- [ ] Mobile-first: test every template on an actual phone, not just responsive preview
- [ ] Image alt text on every screenshot/graphic, written descriptively (not "image1.png")
- [ ] Canonical tags set correctly (especially important if you ever run UTM-tagged campaign URLs)
- [ ] Breadcrumbs on all blog/solutions/compare pages, marked up with BreadcrumbList schema
- [ ] **Server-side rendering (SSR) or static generation (SSG)** for all public marketing/blog/compare pages — search and AI crawlers should get full readable HTML in the initial response, not a blank shell waiting on client-side JS
- [ ] **Canonical URL enforcement at the edge** — force lowercase URLs, strip trailing slashes, inject a matching `<link rel="canonical">` automatically, so you never accidentally split ranking signal across `/Coaching-Software` and `/coaching-software/`
- [ ] **Automated sitemap regeneration** — rebuild `sitemap.xml` whenever a page publishes/updates, submit via Search Console and Bing Webmaster Tools
- [ ] **Image pipeline** — auto-convert uploads to WebP/AVIF, generate responsive `srcset`, and set fixed aspect-ratio containers so images never cause layout shift
- [ ] **Core Web Vitals thresholds** — target LCP under 2.5s, INP under 200ms, CLS under 0.1 (test with Lighthouse/PageSpeed Insights before every major release, not just once)
- [ ] **Pre-launch bot simulation** — before going live, run `curl -A "Googlebot" https://yourdomain.com/page` and `curl -A "GPTBot" https://yourdomain.com/page` to confirm both get full readable content with no JS-dependent blank response

### Schema markup (implement, but with realistic expectations)
Deploy these via JSON-LD site-wide:
- **Organization** schema on every page (name, logo, sameAs links to your G2/Capterra/LinkedIn profiles)
- **SoftwareApplication/Product** schema on your pricing and homepage
- **Article** schema on every blog post
- **FAQPage** schema on comparison pages and any page with a real FAQ section
- **BreadcrumbList** on all deep pages

Be realistic about what this buys you: schema strongly helps Google's Knowledge Graph and organic ranking, which is the thing that actually drives AI citations (see Section 7). Independent testing in 2026 found ChatGPT and Perplexity often read your FAQ schema as plain text rather than parsing it — so treat schema as good technical hygiene and an indirect ranking helper, not a citation hack.

---

## 5b. Let AI crawlers in — this is a real, concrete GEO requirement

Unlike schema (which has mixed evidence — see Section 7), crawler access is binary and unambiguous: **if an AI crawler can't fetch your page, you cannot be cited, full stop.** Confirm your `robots.txt` explicitly allows these, and double-check your CDN/WAF (Cloudflare, etc.) isn't silently blocking them at the firewall level even if `robots.txt` looks fine:

```text
User-agent: Googlebot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://coachevaos.com/sitemap.xml
```

Keep `/blog/`, `/solutions/`, `/compare/`, and the homepage fully open. Block only your authenticated app (`/app/`, `/dashboard/`) — that's where robots.txt genuinely earns its keep, by keeping crawlers from wasting budget on pages they can't read anyway.

---

## 5c. Pre-launch site hygiene checklist — reconciled against a standard 20-point launch list

A general "20 things to check before launching a site" list surfaced 8 real gaps not otherwise covered in this document — mostly legal/compliance and QA items rather than pure SEO, but several of them (custom 404, broken links, cookie consent, accessibility) have genuine SEO/trust-signal weight, and all of them matter for a real product launch regardless. Full reconciliation:

| # | Item | Status |
|---|---|---|
| 1 | Privacy policy | **New — add.** Dedicated `/privacy` page. Required for GDPR/CCPA compliance once analytics/cookies are live (item 9/15 below), and Google's helpful-content guidance explicitly references "who is behind this site" trust signals — a real privacy policy is part of that. |
| 2 | Terms page | **New — add.** Dedicated `/terms` page. |
| 3 | Clear CTA | Already covered — page template step 11 (Section 3b). |
| 4 | FAQ | Already covered — `<FAQAccordion />` + `FAQPage` schema (Section 3, Section 3.4). |
| 5 | robots.txt | Already covered extensively (Section 5b). |
| 6 | sitemap.xml | Already covered (Section 5, auto-generated). |
| 7 | Custom 404 | **New — add.** A branded 404 page with a search box and links back to the homepage/pillar pages — Google explicitly recommends helpful 404s, and it's also a real user-retention fix (someone hitting a dead link shouldn't just bounce). |
| 8 | Alt text | Already covered (Section 5, image pipeline). |
| 9 | Analytics | **New — add.** Set up Google Analytics 4 (or a privacy-friendly alternative like Plausible/Fathom) before launch, and link it to Search Console — Google's own documentation specifically recommends cross-referencing Search Console and Analytics data for SEO diagnosis. Without this wired in from day one, you lose the first weeks of baseline data. |
| 10 | Meta titles | Already covered (Section 5, Section 3.3 in the build guide). |
| 11 | Meta description | Already covered. |
| 12 | Social share (OG/Twitter cards) | Already covered (Section 3.8 in the build guide). |
| 13 | Favicon | **New — add as a technical item** (not a design one — see the companion build guide for why visual design specifics were deliberately excluded from these docs). Google has a dedicated favicon guide with hard requirements: must be a square image, minimum 48×48px, and referenced with a `<link rel="icon">` tag Google can find within a few clicks of the homepage. Missing or malformed favicons cause Google to simply not show one in search results. |
| 14 | Canonical URLs | Already covered extensively (Section 5, Section 3.3). |
| 15 | Cookie consent | **New — add.** Once analytics (item 9) is live, a cookie consent banner is a legal requirement in the EU/UK and increasingly expected in the US. Use a lightweight, real consent-blocking implementation (analytics shouldn't fire until consent is given), not just a dismissible notice that ignores the actual choice. |
| 16 | Mobile version | Already covered (Section 5, mobile-first testing). |
| 17 | Accessibility | **New — add.** Baseline WCAG 2.1 AA: semantic HTML landmarks, keyboard navigation through every interactive component (especially `<FAQAccordion />` and any modal/dropdown), sufficient color contrast, and `alt`/`aria-label` on all interactive icons. This isn't just compliance — accessible semantic markup is also more extractable for AI crawlers reading raw HTML (Section 7). |
| 18 | Test forms | **New — add as a QA step.** Every form (signup, contact, template downloads) needs an actual end-to-end submission test before launch — validation errors, success states, and where the data actually goes. A broken signup form silently kills the entire point of every page in this plan. |
| 19 | Check broken links | **New — add as a QA step.** Run a link checker (even a simple crawler script) across every page before launch — internal broken links waste crawl budget and directly hurt the user experience signals Google's ranking systems weigh; broken external links (e.g., in comparison-page citations) undermine the credibility those pages depend on. |
| 20 | Optimize performance | Already covered (Section 5, Core Web Vitals thresholds). |

---

## 6. Off-page authority building

**Directory listings (do these first — cheap, fast, high-trust backlinks, and directly feed AI answer engines):**
- G2
- Capterra
- Software Advice
- GetApp
- TrustRadius
- Product Hunt (plan a proper launch day, don't just submit quietly)
- AlternativeTo (list yourself as an alternative to CoachAccountable, Paperbell, Satori, Simply.Coach, Delenta — this is free and puts you directly in front of people already comparing)

**Ongoing link building (target 15–20 quality backlinks/month once content is live):**
- Guest posts on coaching-industry blogs and ICF (International Coaching Federation) chapter newsletters
- Podcast guest spots on coaching business podcasts (cheap to book, great for branded search + entity signals)
- Original research/survey: something like "The State of AI in Coaching 2026" — a genuinely original data piece is the single best link-bait format and doubles as GEO content (AI engines love citing original stats)
- HARO/journalist-request platforms for "future of coaching" or "AI in professional services" story angles

---

## 7. GEO (AI search) action plan — grounded in what actually works

The clearest finding from current research: roughly 3 in 4 AI Overview citations come from pages already ranking in Google's top 10, and Google's own developer documentation states plainly that AI Overviews and AI Mode use the same fundamental ranking systems as regular Search — there's no separate technical trick to unlock them beyond being genuinely eligible for normal search results. **Ranking well organically is the single biggest GEO lever you have** — everything below amplifies that, none of it replaces it.

1. **Win the organic ranking first.** Sections 3–6 above ARE your GEO strategy. There's no separate shortcut.
2. **Allow the AI crawlers in** — see Section 5b. This is a hard requirement, not an optimization.
3. **Write self-contained, extractable answers.** In FAQ sections and cluster-post intros, write 40–70 word answers that make complete sense with zero page context — no "as mentioned above," no vague pronouns. AI engines lift these as standalone citations.
4. **Format for retrieval, not just readability.** Break content into modular H2/H3 sections with short paragraphs (aim under ~80 words each). This is how retrieval-augmented systems pull precise fragments to cite — dense walls of text are harder to extract cleanly than short, clearly-labeled sections.
5. **Keep entity information identical everywhere.** Same company description, same feature names, same pricing language across your site, G2, Capterra, Product Hunt, LinkedIn, and Crunchbase. AI models cross-reference these to build confidence in what you actually are.
6. **Prioritize the comparison and roundup pages for GEO.** "What's a good alternative to Paperbell" and "best coaching software for solo coaches" are exactly the phrasing people put into ChatGPT/Perplexity — these pages should be your most extractable, best-structured content on the site.
7. **Track it manually, monthly** — expanded prompt list:
   - "What's the best coaching software?"
   - "What's the best CRM for coaches?"
   - "What software should a coach use to manage 50 clients?"
   - "What are the best AI tools for coaches?"
   - "What are alternatives to Paperbell / CoachAccountable / Satori?"
   - "What's the best client portal for coaches?"

   Log which pages get cited and which competitors show up alongside you. This is free and, honestly, more reliable right now than most paid GEO trackers.

**On schema specifically — don't oversell it to yourself.** A February 2026 controlled test found ChatGPT and Perplexity often tokenize FAQ schema as plain text rather than parsing it as structured data, so it isn't the citation hack some GEO vendors claim. What it reliably *does* do: strengthen Google's Knowledge Graph representation of your entity, which is a real, documented input into Google AI Overview eligibility. Implement Organization, SoftwareApplication, Article, FAQPage, and BreadcrumbList schema as good technical hygiene that indirectly helps — not as a standalone growth lever.

---

## 7b. Google Preferred Sources — a real, current lever, confirmed directly from Google's own docs

This is different from everything else in Section 7: it's not an inference about how GEO probably works, it's an actual Google-shipped mechanism, confirmed against Google Search Central's official documentation (last updated August 20, 2026). As of a May 27, 2026 update, it extends into exactly the surfaces this whole plan targets: **when a reader selects your site as a preferred source, your links get a visible "preferred" badge in Top Stories, AI Mode, and AI Overviews** — and Google's own published data shows preferred-source links get roughly double the click-through rate of unlabeled citations in the same response.

**Eligibility, confirmed:** only domain-level and subdomain-level sites qualify — `coachevaos.com` is eligible; a subdirectory like `coachevaos.com/blog` would not be if it were the entity in question, so this is a whole-site mechanism, not a per-page one. Check eligibility directly at `google.com/preferences/source` once the domain is live.

**Implementation (recommended method — verbatim from Google's docs):**

1. Add to the `<head>`:
```html
<script async src="https://news.google.com/swg/js/v1/publisher.js"></script>
```
2. Add anywhere in the body where the button should render (footer is a sensible default — near social links):
```html
<div google-add-preferred-source-btn data-theme="light"></div>
```

That's the entire implementation — no schema, no application process, no approval wait. The button auto-localizes to the reader's language and returns them to the exact page they were on after they add the site.

**Fallback if JavaScript isn't an option on a given page:** a plain deeplink works identically —
```html
<a href="https://www.google.com/preferences/source?q=coachevaos.com">Add CoachEvaOS as a Preferred Source</a>
```

**Where to place it:** site footer (every page) at minimum. Consider also adding it to the end of high-traffic blog posts and the AI-cluster pages specifically, since those are exactly the pages most likely to get pulled into an AI Overview or AI Mode response — a reader who's just read a genuinely useful CoachEvaOS article is the person most likely to tap "add as preferred source," and it directly increases the odds your citations carry the badge going forward.

---

## 8. Pre-launch production plan — everything built before launch, no calendar phasing

Updated scope: **all 30 keywords, all blog content (FOCUS, EXPAND, and LATER tier alike), all niche and comparison pages ship before launch.** There's no drip schedule — the site goes live fully stocked, all at once, rather than launching thin and publishing over months. Search engines and AI crawlers index everything from day one, which is a stronger starting position than a slow rollout.

Build in this dependency order (each step requires the one before it to be done):

1. **Brand + technical foundation** — Brand & Domain Consistency checklist (Section 1b) complete; full technical checklist (Section 5) implemented including SSR/SSG, canonical enforcement, image pipeline, AI crawler robots.txt (Section 5b); pre-launch site hygiene items from Section 5c (privacy policy, terms page, custom 404, analytics + Search Console linkage, cookie consent, accessibility baseline) built; Search Console + Bing Webmaster Tools set up; Google Preferred Sources button (Section 7b) added to the footer template so it ships site-wide by default; fitness-vertical positioning question (Section 0b) decided before any fitness copy is written.
2. **Core commercial pages** — the 5 highest-priority pages (Section 8b), remaining FOCUS-tier commercial pages, `/client-portal/`, `/coaching-automation/`, `/features/client-dashboard/`, `/features/coaching-dashboard/`, niche solution pages, and the first 2 comparison pages (CoachAccountable, Paperbell).
3. **AI pillar + fitness vertical + templates** — full AI pillar hub and all 5 cluster posts, the fitness solution pages, all 4 free templates, remaining comparison pages (Satori, Simply.Coach, Delenta).
4. **All remaining blog content, every tier** — Pillar 1 (Coaching Business Software) hub + cluster, Pillar 3 (client management) hub + cluster, both roundup pages, the two GEO-friendly resource articles, and the 3 linkable-asset calculators. Nothing gets deferred to "later" — the EXPAND and LATER keyword tiers from Section 2 describe priority for *analysis and iteration* once live, not a reason to hold content back before launch.
5. **Outreach prep** — line up (don't publish yet) 4–6 guest post/podcast placements to go live around launch week; draft G2/Capterra/Product Hunt/AlternativeTo listing content now, submit at launch.
6. **QA and pre-flight validation** — bot-simulation curl tests (`Googlebot`, `GPTBot`), Core Web Vitals thresholds, Rich Results Test on all schema, mobile QA on every template, a final pass against the Brand & Domain Consistency checklist, and the QA-specific Section 5c items: test every form end-to-end, run a broken-link check across the full site.
7. **Launch** — site goes live with the entire page set from steps 2–4 already built (30+ pages). Submit sitemap same day, submit to all directories same week, verify the site appears in Google's source preferences tool (`google.com/preferences/source`) and confirm the Preferred Sources button resolves correctly on the live domain, publish the queued guest posts/podcast placements in the following 1–2 weeks, begin monthly manual GEO tracking (Section 7) starting week 1.

**Only two things are structurally impossible to do before launch** — not lower-priority, just literally can't happen yet:
- **Original research survey** (Section 4c) — needs real existing customers to survey. Run this once there's an actual customer base, roughly month 4–6 post-launch.
- **Quarterly refresh cycle** on pillar pages — by definition an ongoing maintenance task, not a one-time build item. Set the first refresh for 3 months after launch.

---

## 8b. The 5 highest-priority pages — build these exceptionally well before anything else

If time or budget is constrained, these five pages carry the most weight and should feed authority into everything else via internal linking:

1. **`/ai-coaching-software/`** — own the emerging AI category before "AI-powered" becomes generic marketing noise across every competitor
2. **`/coaching-crm/`** — own the client-relationship/memory problem, positioned against both niche coaching tools and generic CRMs (HubSpot, Nutshell) that also compete here
3. **`/client-management-software/`** — highest commercial intent in the whole list
4. **`/coaching-automation/`** — own the "stop doing repetitive admin" problem, which is the actual emotional driver behind most of these searches
5. **`/compare/paperbell-alternative`** — highest-conversion single page you can build; someone searching this is actively shopping today

**Consistent positioning to use everywhere** (site copy, comparison pages, directory listings, schema descriptions): *"CoachEvaOS is AI-powered coaching business software that helps coaches manage clients, automate repetitive admin, and catch at-risk clients before they churn — all from one place."* Specific enough for both search engines and AI systems to understand exactly what you are, without overclaiming.

---

## 9. What to measure weekly (not just rankings)

**Google Search Console**
- Impressions, clicks, CTR, average position, top queries, indexed page count

**Business metrics**
- Organic signups, trial starts, activated trials, paid conversions — the real point of all of this

**GEO**
- Manual prompt testing (Section 7) — track appearance rate and which pages get cited

**Realistic phase-by-phase targets — don't expect "#1 for everything at launch":**

| Phase | Realistic goal |
|---|---|
| 1 | All FOCUS-tier pages indexed in Google |
| 2 | 5–10 keywords reach positions 20–50 |
| 3 | Refine the pages already getting impressions — this is where most of the real work happens |
| 4 | Strongest keywords reach top 10 |
| 5 | Rankings convert into trials and paying coaches — the actual finish line |

Your first real success signal isn't "we rank #1." It's **"Google is showing CoachEvaOS for dozens of relevant searches, and some of those searches are turning into trial signups."** That's the number to watch in month 2–3, long before rankings stabilize.

---

## 10. Free tools recap

| Tool | Use for |
|---|---|
| Google Keyword Planner | Real volume verification for the 30 keywords |
| Google Search Console | Track what's actually ranking, impressions, CTR |
| PageSpeed Insights | Core Web Vitals |
| Ahrefs Free Keyword Generator | Backup keyword ideas + rough difficulty |
| Google Rich Results Test | Validate schema markup |
| AlternativeTo, G2, Capterra | Free directory backlinks |
| Manual ChatGPT/Perplexity/Gemini prompts | GEO citation tracking |
| Google source preferences tool (`google.com/preferences/source`) | Check Preferred Sources eligibility, verify the button works |
| Google Analytics 4 (or Plausible/Fathom) | Baseline traffic + conversion data from launch day |
| A free broken-link checker (e.g. a simple crawl script, or W3C Link Checker) | Pre-launch QA (Section 5c) |
| WAVE or axe DevTools browser extension | Free accessibility audit (Section 5c) |

---

## Appendix — Local/directory SEO (only build this if CoachEvaOS gets a public coach-directory feature)

This entire appendix assumes a feature that isn't confirmed in scope: **public, individually-discoverable coach profile pages** (e.g., a client searching "life coach in Austin" finds a CoachEvaOS user's public profile). If that's not on the roadmap, skip this section entirely — it doesn't apply to a private, login-based business tool. If it *is* planned, here's the core of what it would require:

- **Google Business Profile category mapping** — a dropdown in the coach's dashboard mapping their specialty to both GBP categories (Life Coach, Business Consultant, etc.) and matching Schema.org types
- **Per-profile `ProfessionalService` JSON-LD**, dynamically generated from dashboard fields (name, address, geo-coordinates, phone, hours), with a `sameAs` link to the coach's Google Maps listing:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "{{coach_business_name}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "addressRegion": "{{state}}",
      "postalCode": "{{zip}}",
      "addressCountry": "US"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": "{{lat}}", "longitude": "{{lng}}" },
    "sameAs": ["{{google_maps_url}}", "{{linkedin_url}}"]
  }
  ```
- **Address-to-coordinates geocoding pipeline** on profile save, to power both the schema and any map widget
- **Per-city landing pages** (`/locations/austin`) only if you have real coach density in that city — thin, template-only location pages with no real local content are exactly what Google's spam guidance targets, so don't generate these for cities with zero active coaches
- **Native review/rating collection**, compiled into `AggregateRating` schema, so profiles are eligible for star ratings in search results

Everything else in this playbook (Sections 1–10) applies regardless of whether this feature ships.
