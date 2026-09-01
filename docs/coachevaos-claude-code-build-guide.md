# CoachEvaOS — Claude Code Implementation Guide (Final, Reconciled Version)

**Read this whole file before writing any code.** This is a build spec, not marketing copy. This version supersedes the prior draft: it's reconciled against an actual audit of the live codebase and real competitive search research done this session — where the two disagree, this file reflects what's actually true, not what was assumed earlier.

> **Hard rule, unchanged:** every page must implement the shared SEO/GEO components and metadata rules in Sections 2–3. Never skip schema, canonical tags, the direct-answer block, or the meta tag template on an individual page. A page missing these is a real ranking and GEO-citation cost, not a cosmetic gap.

**Stack:** Next.js (App Router) — confirmed, not assumed, by this session's codebase read.

---

## 0. Current state — read this first, it supersedes assumptions elsewhere in this document

### 0.1 The one thing that gates everything else
**Nothing below compounds until CoachEvaOS is live on a real, indexable domain.** The codebase currently has a placeholder address (`coacheva.os` — not a real TLD) hardcoded in the sitemap and `robots.txt`. Every fix and page in this guide is real, useful pre-work — but sitemaps, structured data, and content only start earning rank once Google can actually crawl and verify a live site. Treat everything else in this document as pre-work that makes the first stretch after launch far more productive, not a substitute for having a domain to launch on.

**Do this first, before anything else in this guide:**
1. Register the real domain (`coachevaos.com`, per earlier branding decisions)
2. Set a single environment variable — `NEXT_PUBLIC_SITE_URL` — as the one source of truth for the domain everywhere in the codebase (sitemap, robots.txt, canonical tags, OG URLs, JSON-LD `url` fields). **Never hardcode a domain string directly in code again** — this was a real bug already found and fixed once this session (six hardcoded instances of the placeholder), don't reintroduce the pattern with the real domain.
3. Redeploy
4. Submit the sitemap to Google Search Console + Bing Webmaster Tools
5. Verify the OG image and JSON-LD render correctly on the live domain — share a link in Slack/X and check the preview renders a title, description, and image instead of a bare URL

### 0.2 Already built in the product — don't rebuild these, audit and align them instead
Confirmed present in the live codebase:
- `/about`, `/services`, `/works`, `/pricing` — fully built pages
- `/login`, `/signup`
- Roughly 10 blog posts already published
- 12 onboarding niche templates already exist in-product (used during user onboarding)

**Reconciliation flag — check before building anything in Section 5:** the earlier version of this guide proposed a `/solutions/[niche]` and `/features/` IA from scratch, assuming nothing existed. That's now confirmed wrong in places. Before building any new route:
- Check whether `/services` already covers what this guide calls commercial/solution pages — don't create a duplicate, conflicting page structure. If `/services` is the right home for niche-specific content, extend it instead of building a parallel `/solutions/` tree.
- Check whether `/works` is a portfolio/case-study section that should absorb the `<Testimonial />` and proof content this guide describes, rather than scattering testimonials page-by-page.
- **Pull the real 12 niche labels from the onboarding flow's codebase** (likely a constants or config file) rather than using the assumed niche list (life/health/executive/career/wellness/fitness coaches) from the SEO strategy playbook. The assumed list was a reasonable guess made without seeing the product — the real 12 are authoritative. Update the SEO playbook's niche-page section once the real list is confirmed.

### 0.3 Already fixed this session — don't redo, verify and extend instead
All four are shipped and pass a clean TypeScript build:
- **Sitemap now includes `/about`, `/services`, `/works`, `/pricing`** — previously built but never listed, so Google had no signal they existed.
- **Sitemap/robots.txt contradiction resolved.** `/login` and `/signup` were both submitted in the sitemap while `robots.txt` disallowed crawling them — a contradiction Search Console flags as an error. Resolved by keeping `/signup` crawlable (real commercial intent) and dropping the private `/login` page from both sitemap and any crawl allowance.
- **Site-wide Open Graph + Twitter Card metadata added**, plus a generated 1200×630 default share image. Previously every shared link rendered as a bare URL in Slack/X/LinkedIn/AI-chat citations.
- **`Organization` + `SoftwareApplication` JSON-LD added to the root layout** — the single highest-leverage GEO change made this session, since AI answer engines lean on structured data for citations more than on prose.
- **`llms.txt` added** — a plain-language summary of what CoachEvaOS is, who it's for, and how it differs from named competitors, written for AI assistants to quote accurately instead of guessing (see Section 3.7 for the spec if it needs extending).

**What this means for the rest of this guide:** don't re-instruct Claude Code to add root-level Organization/SoftwareApplication schema, don't rebuild the sitemap logic, don't re-add basic OG tags. Extend these (per-page Article/FAQPage/BreadcrumbList schema, per-page OG images where a page warrants a custom one) rather than duplicating what already exists.

### 0.4 The one gap no code fix can close
No backlinks, no domain age, no indexed history. This only starts accruing after launch — it's usually the actual bottleneck between "technically correct SEO" and "ranks on page 1," not remaining code polish. Section 7 covers this; don't expect Steps 1–6 alone to produce rankings without it.

---

## 1. Entity consistency rules — required for GEO, not optional

- **Brand name:** always **"CoachEvaOS"** — one word, exact capitalization — in every title tag, schema `Organization.name`, alt text, meta description, and code comment.
- **Tagline:** **"The AI operating system for coaches."** Verbatim in the homepage hero, `Organization.description` schema, and every directory listing.
- **Positioning sentence** (identical in `SoftwareApplication.description` and homepage hero copy): *"AI-powered coaching business software that helps coaches manage clients, automate repetitive admin, and catch at-risk clients before they churn — all from one place."*
- **Domain reference:** always via `NEXT_PUBLIC_SITE_URL`, never a hardcoded string (Section 0.1) — this is now a hard rule, not a suggestion, given it was a real bug.
- **Copy tone:** direct, specific claims, no unsupported hype adjectives. Vague claims are also worse for AI-citation extractability than concrete ones.

Run before every deploy:
```bash
grep -rni "coach eva os\|coacheva os\|coach evaos" app/
grep -rn "coacheva\.os\|coachevaos\.com" app/ --include="*.ts" --include="*.tsx" | grep -v "NEXT_PUBLIC_SITE_URL"
```
The second command should return nothing — any hit is a hardcoded domain string that should be reading from the env var instead.

---

## 2. Shared components — build these once, reuse everywhere

| Component | File | Used by | SEO/GEO function |
|---|---|---|---|
| `<Header />` | `components/Header.tsx` | every page | consistent internal linking; link to real existing `/pricing`, `/about` |
| `<Footer />` | `components/Footer.tsx` | every page | site-wide internal links to commercial + comparison pages |
| `<Button />` | `components/Button.tsx` | CTAs everywhere | — |
| `<Hero />` | `components/Hero.tsx` | homepage, commercial pages | — |
| `<DirectAnswer />` | `components/DirectAnswer.tsx` | every commercial page | 40–70 word self-contained extractable answer block — the piece most likely to get lifted into an AI Overview or ChatGPT citation |
| `<FeatureGrid />` | `components/FeatureGrid.tsx` | commercial pages | — |
| `<ComparisonTable />` | `components/ComparisonTable.tsx` | all `/compare/` pages | structured competitor data extracts more accurately than prose comparisons |
| `<FAQAccordion />` | `components/FAQAccordion.tsx` | every commercial + comparison page | emits `FAQPage` JSON-LD — highest-value GEO real estate |
| `<Testimonial />` | `components/Testimonial.tsx` | commercial pages, possibly `/works` per Section 0.2 | — |
| `<InternalLinkCluster />` | `components/InternalLinkCluster.tsx` | blog posts | hub-and-spoke internal links — a direct ranking signal, don't publish without it |
| `<Breadcrumbs />` | `components/Breadcrumbs.tsx` | every page below the homepage | emits `BreadcrumbList` JSON-LD |

**Component build order:** Header → Footer → Button → Breadcrumbs → DirectAnswer → FAQAccordion → FeatureGrid → ComparisonTable → Testimonial → Hero → InternalLinkCluster.

---

## 3. SEO/GEO technical implementation

### 3.1 `robots.txt` — confirm this matches what's live (should already be close per Section 0.3)
```text
User-agent: Googlebot
Allow: /

User-agent: Bingbot
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

User-agent: *
Disallow: /login
Disallow: /app/
Disallow: /dashboard/
Allow: /

Sitemap: ${NEXT_PUBLIC_SITE_URL}/sitemap.xml
```
Note `/signup` is intentionally **not** disallowed (Section 0.3 — real commercial intent, keep it crawlable). Only `/login` and the authenticated app are blocked.

### 3.2 Sitemap
Already includes `/about`, `/services`, `/works`, `/pricing` per Section 0.3. Every new route added in Section 5 must be added here in the same commit that adds the page — this is exactly the class of bug that was just fixed once, don't let it recur.

### 3.3 Meta tag template — apply to every page via `generateMetadata()`
```ts
export const metadata = {
  title: `${primaryKeywordPhrase} | ${benefitPhrase} — CoachEvaOS`, // under 60 chars
  description: `${oneSentenceValueProp}`, // under 155 chars, human-written
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}` },
  openGraph: {
    title: `${primaryKeywordPhrase} — CoachEvaOS`,
    description: oneSentenceValueProp,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`,
    siteName: 'CoachEvaOS',
    images: ['/og/default-share.png'], // the generated 1200x630 image from Section 0.3; give high-priority pages (homepage, top comparison pages) their own custom OG image once there's time
  },
}
```

### 3.4 JSON-LD schema
**Already shipped in root layout (Section 0.3) — do not duplicate:**
- `Organization` (name, url from env var, logo, description = tagline, sameAs)
- `SoftwareApplication` (name, applicationCategory, description = positioning sentence)

**Still needed per-page:**
- `FAQPage` — generated dynamically inside `<FAQAccordion />` from its props, not hand-written per page
- `BreadcrumbList` — generated dynamically inside `<Breadcrumbs />` from route segments
- `Article` — apply on every blog post via a shared `<BlogPostLayout />`, populated from frontmatter (`title`, `datePublished`, `dateModified`, `author`)

### 3.5 Image pipeline
All images through `next/image` with AVIF/WebP formats. No raw `<img>` tags.

### 3.6 Pre-flight validation (run before every deploy to production)
```bash
curl -A "Googlebot" ${SITE_URL}/coaching-crm/ | grep -q "<h1" && echo PASS
curl -A "GPTBot" ${SITE_URL}/coaching-crm/ | grep -q "<h1" && echo PASS
```
Also verify: share a real page link in Slack or X and confirm the OG title/description/image render (not a bare URL) — this directly tests the Section 0.3 fix on the live domain, since OG tags can pass locally and still fail on first real-world crawl due to caching or the domain not resolving yet.

### 3.7 `llms.txt` — spec if it needs extending
Already added (Section 0.3). Keep it a plain-language, factual summary — not marketing copy — since its entire purpose is giving AI assistants an accurate, quotable source instead of forcing them to infer from prose. Structure:
```text
# CoachEvaOS

## What it is
[1-2 sentence factual description — same positioning sentence as Section 1]

## Who it's for
[Target user description]

## How it differs from alternatives
[Factual, specific differentiation vs. named competitors — see Section 4]

## Key features
[Plain list, no marketing adjectives]
```
Update this file every time a named competitor comparison or a core feature changes — it decays the same way any other content does.

### 3.8 Open Graph / Twitter Card — status and extension pattern
Site-wide default shipped (Section 0.3): brand-colored 1200×630 image, applied via the Section 3.3 template. For the 5 comparison pages (Section 5) and the homepage, generate a custom OG image per page once bandwidth allows — a comparison page's OG image showing "CoachEvaOS vs. [Competitor]" performs meaningfully better on social/AI-chat shares than the generic default. Not required for launch; the default covers every page adequately in the meantime.

---

### 3.9 Google Preferred Sources — confirmed real, add to the shared footer

Verified directly against Google's official Search Central documentation (updated August 20, 2026). This is not speculative GEO advice — it's a shipped Google mechanism that now surfaces a "preferred" badge on citations in Top Stories, AI Mode, and AI Overviews when a reader has selected the site. Google's own data shows roughly 2x click-through on preferred-source links versus unlabeled citations. Eligible: `coachevaos.com` is a root domain, which qualifies (subdirectories don't).

Add to root `<head>`:
```html
<script async src="https://news.google.com/swg/js/v1/publisher.js"></script>
```

Add to the shared `<Footer />` component (Section 2) — this ships it site-wide by default, no per-page work needed:
```html
<div google-add-preferred-source-btn data-theme="light"></div>
```

Deeplink fallback for any context where the script isn't loaded (e.g. email newsletters, social bio links):
```
https://www.google.com/preferences/source?q=coachevaos.com
```

Post-launch, verify eligibility by searching `coachevaos.com` at `google.com/preferences/source`.

### 3.10 Pre-launch hygiene pages/tasks — 8 confirmed gaps from a reconciled 20-point checklist
Full detail and rationale for each is in the SEO strategy playbook, Section 5c. Concrete build tasks:
- [ ] `/privacy` — privacy policy page
- [ ] `/terms` — terms of service page
- [ ] Custom branded 404 page (search box + links to pillar/commercial pages, not a bare error message)
- [ ] Google Analytics 4 (or Plausible/Fathom) wired in and linked to Search Console
- [ ] Cookie consent banner — real consent-gating (analytics doesn't fire pre-consent), not a dismiss-only notice
- [ ] Accessibility baseline audit — run WAVE or axe DevTools against every shared component (Section 2) and every unique page template, fix flagged issues before launch
- [ ] End-to-end form test on every form (signup, template downloads, any contact form) — validation errors and success states both confirmed working
- [ ] Broken-link crawl across the full site pre-launch

---

## 4. Competitor landscape — confirmed via live search research this session

This supersedes any earlier competitor list in the SEO strategy playbook — treat this as the current, authoritative research:

| Competitor | Owns | Where they're thin |
|---|---|---|
| CoachAccountable | "Coaching practice management," accountability & between-session tracking | Fitness-and-wellness-flavored UX; no meaningful AI |
| Paperbell | "Sell + deliver coaching," checkout-and-packages angle | Weak on ops/CRM depth once a client is signed |
| Satori | Qualification-heavy discovery calls, enterprise-leaning | Heavier, less approachable for a solo coach |
| Simply.Coach | Compliance / corporate coaching structure | Priced and positioned for organizations, not solos |
| Delenta | Group coaching, mobile-first delivery | Broad rather than deep on any one workflow |

**The number worth building the differentiation strategy around:** independent research into "AI coaching platforms 2026" found only about a third of coaching-software products offer real AI features today, and none of the five above lead with it. That's the wedge — use it as the core claim across the AI-cluster pages and every comparison page's AI feature row.

---

## 5. Where to compete — ordered by defensibility, not by keyword-volume guesswork

No tool-verified search-volume numbers here — that needs Ahrefs/SEMrush/GSC access not available this session. Treat the "why" as the actual research; the competition label is reasoned from real search results, not a paid keyword tool.

| Target | Why it's winnable | Competition | Page type |
|---|---|---|---|
| "[Competitor] alternatives" / "[Competitor] vs CoachEvaOS" | Bottom-of-funnel switching intent; incumbents structurally never write these about themselves | Low | 5 comparison pages (Section 6) |
| AI coaching software / AI client management for coaches | Validated gap — most competitors don't lead with AI at all (Section 4 stat) | Low | Landing + blog |
| Client management software for [niche] coaches | Niche-agnostic depth is a real differentiator — most incumbent tools default to fitness-flavored UX | Medium | Niche pages (pending Section 0.2 reconciliation) |
| Coaching CRM | Adjacent term contested by generalist CRM entrants (Salesmate-style), but less coaching-specific content saturation than "coaching software" | Medium | Blog + pricing copy |
| Coaching software / coaching practice management software | The head term — real volume, but five established players with years of backlinks already rank here | High | Long game only — don't expect this to move early |

---

## 6. Page build checklist — dependency order, everything before launch

No calendar phasing. Everything below is built in the order listed, all before launch — the only exceptions are the two items in Section 7 that are structurally impossible pre-launch (ongoing blog cadence beyond the initial set, and backlink accrual, which needs a live, referenceable domain).

### Step 0 — the blocking gate (Section 0.1) — must complete before any other step
- [ ] Real domain registered, `NEXT_PUBLIC_SITE_URL` set, all hardcoded domain strings removed and replaced with the env var, redeployed

### Step 1 — audit and align existing pages (don't rebuild — Section 0.2/0.3)
- [ ] Confirm `/about`, `/services`, `/works`, `/pricing` each have `generateMetadata()`, canonical tags, and appropriate JSON-LD (`Article` if blog-like, `BreadcrumbList` always)
- [ ] Confirm sitemap includes all of the above (should already be true per Section 0.3 — verify, don't assume)
- [ ] Confirm `/services` vs. this guide's originally-planned commercial pages don't conflict — resolve per Section 0.2 before Step 3
- [ ] Pull the real 12 onboarding niche labels from the codebase; update Section 0.2/Step 3 niche-page list below once confirmed

### Step 2 — shared components (Section 2)
- [ ] All 11 components built
- [ ] `robots.txt`, sitemap, meta tag template, root-layout JSON-LD verified against Section 0.3/3.1–3.4 (mostly already shipped — confirm, extend where noted)
- [ ] Google Preferred Sources script + button added to root `<head>` and `<Footer />` (Section 3.9)
- [ ] All 8 hygiene pages/tasks from Section 3.10 built: `/privacy`, `/terms`, custom 404, analytics + Search Console link, cookie consent, accessibility audit pass, form testing, broken-link crawl

### Step 3 — comparison pages (highest-leverage content per Section 5)
Build all 5, using `<ComparisonTable />` + the "best for X" honest framing (never "we're #1 because we're better"):
- [ ] `/compare/coachaccountable-alternative/`
- [ ] `/compare/paperbell-alternative/`
- [ ] `/compare/satori-alternative/`
- [ ] `/compare/simply-coach-alternative/`
- [ ] `/compare/delenta-alternative/`

Each needs a dedicated AI-features row leaning on the Section 4 differentiation stat, and its own `FAQPage` schema via `<FAQAccordion />`.

### Step 4 — AI cluster + niche pages
- [ ] AI coaching software landing page + supporting blog content — the validated-gap wedge, don't let this slip
- [ ] Niche pages built from the **real** 12 onboarding niches (Step 1 reconciliation) — reuse the existing niche-template copy from the product rather than writing from scratch
- [ ] Each niche page links to its relevant blog posts and to the comparison pages in Step 3

### Step 5 — blog content (initial full set — see Section 7 for what continues after)
- [ ] Audit the ~10 existing posts: each needs `generateMetadata()`, `Article` schema, and an `<FAQAccordion />` block with its own `FAQPage` schema if it doesn't have one
- [ ] Write and publish the remaining planned posts from the SEO strategy playbook's content calendar (AI cluster, client-management cluster, coaching-business-software cluster) — this is the full initial backlog, all of it ships before launch per prior scope decision

### Step 6 — QA and pre-flight
- [ ] Run Section 3.6 validation on every route
- [ ] Rich Results Test on all schema
- [ ] `grep` checks from Section 1 (brand spelling + hardcoded domain)
- [ ] Mobile QA on every unique template type
- [ ] Re-run the Section 3.10 form test and broken-link crawl one final time against the full built site, not just the pages that existed when first tested

### Step 7 — launch
- [ ] Deploy
- [ ] Submit sitemap to Search Console + Bing (Section 0.1)
- [ ] Verify `coachevaos.com` is recognized at `google.com/preferences/source` and the footer button resolves correctly on the live domain (Section 3.9)
- [ ] Directory submissions — see Section 7

---

## 7. What genuinely can't happen before launch, and why

Only two things, and both are structural, not priority calls:

- **Backlinks, domain age, indexed history (Section 0.4).** Can't be manufactured by code or content — it only starts accruing once there's a live, crawlable domain to link to. Start immediately at launch:
  - Submit to G2, Capterra, Product Hunt — several already index the 5 competitors above, so CoachEvaOS's current absence is a visible, closeable gap
  - Guest posts / quote contributions on coaching-business blogs in exchange for a real backlink
- **Ongoing blog cadence beyond the initial backlog.** The full initial set (Step 5) ships before launch. After that, new posts are inherently a forever-task — one every 1–2 weeks, alternating practical coaching-business advice (retention, pricing packages) with product-adjacent AI-in-coaching content. Every new post gets the same `<FAQAccordion />` + `FAQPage` schema treatment as the initial set — this is cheap to keep doing and directly improves both rich-result eligibility and AI-citation odds over time.

---

## 8. If anything in this guide conflicts with the actual codebase

Stop and flag it rather than guessing:
- If `/services` or `/works` already substantially covers what Section 5/6 describes as new pages, extend the existing page rather than building a duplicate
- If the real 12 onboarding niches differ meaningfully from coach types assumed in the SEO strategy playbook, update the playbook's niche section to match the real list
- If workout-builder features exist in the product, the original fitness-vertical caveat from the SEO strategy playbook still applies — check before writing fitness-niche copy
- If the brand name, tagline, or positioning sentence in Section 1 has changed, update this file first, then propagate to schema/metadata everywhere
