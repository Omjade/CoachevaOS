# Handoff: CoachevaOS — AI Operating System for Coaches & Businesses

## Overview
CoachevaOS replaces the 6-8 disconnected tools (spreadsheets, WhatsApp, Drive, Calendly, Gmail) that independent coaches (fitness, business, career) currently juggle, with one dashboard built around an **AI Daily Briefing** — a generated morning summary of what needs attention (at-risk clients, renewals due, leads waiting, tasks completed). Every module (leads, clients, chat, calendar, documents, tasks, check-ins, billing) exists to feed that briefing with real data. A parallel **client portal** gives each coach's clients a branded, minimal surface for messaging, tasks, booking, files, progress, and check-ins.

## About the Design Files
The files in this bundle (`Coaching OS - Prototype.dc.html`, screenshots) are **design references built as an interactive HTML prototype** — not production code to copy directly. They demonstrate exact layout, copy, states, and interaction flows. The task is to **recreate this design in your target stack** (React/Next.js is what the PRD below assumes, but adapt to your team's existing environment) using your own component architecture, real auth, and a real database — not by embedding this HTML.

The prototype's underlying styling engine is a proprietary internal templating format (`.dc.html` + a design-system CSS bundle) that will not run outside this tool. Treat the design tokens, layout descriptions, and interaction notes below as the spec; do not attempt to load or parse the `.dc.html` file itself in your codebase.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy in the screens below are final-direction (an editorial/premium "Classical" visual system — serif display type, hairline rules, warm off-white background, single gold accent). Recreate pixel-close using the design tokens in this doc; the interaction/state logic is fully specified and should be implemented as real, working behavior (not just visual).

## Brand
- **Name:** CoachevaOS
- **Tagline:** "The AI operating system for coaches and businesses"
- **Positioning:** Professional SaaS, coach-niche-agnostic (fitness, business, career, consulting) — not visually locked to any one vertical. A "Niche" setting reshapes copy/labels across the app (see Design Tokens → Niche variants).

---

## Screens / Views

### 1. Landing Page (marketing, logged-out)
**Purpose:** Convert a visiting coach into a signup ("Get started — it's free").
**Layout:** Full-width, single column, alternating warm-neutral (`--color-neutral-100`) and base (`--color-bg`) horizontal bands. Sticky-feel top nav (not actually sticky in MVP): 76px height, logo left, nav links + CTA right, bottom 1px divider.
**Sections top to bottom:**
1. **Nav bar** — "CoachevaOS" wordmark (heading font, 20px, 600 weight), links "Product"/"Pricing"/"Log in", primary CTA button.
2. **Hero** — dark plate (near-black `--color-neutral-900` background) with a large faint decorative "OS" glyph behind the copy (low-opacity, decorative only — optional to keep), eyebrow line ("CoachevaOS — the AI operating system for coaches and businesses", uppercase, letter-spacing 0.12em, gold `--color-accent-400`), headline "Bring your practice into one system." (heading font, 400 weight, 36px, near-white), primary CTA button ("Get started — it's free").
3. **Hero image** — full-width photo slot (coach with client, working session), placeholder until real asset provided.
4. **Feature grid** — 4 columns, each: 42px rounded icon tile (gold-tinted background, gold icon stroke), short feature title, 1-2 line description. Cards use `.card` styling (see tokens), fade-up + stagger entrance animation.
5. **Testimonial** — centered italic serif quote (26px) + attribution, niche-aware copy (fitness/business/career each get a distinct quote — swap based on selected niche).
6. **Footer CTA** — repeat of primary CTA.

### 2. Coach Dashboard
**Purpose:** Daily home screen — read the AI briefing, act on flagged items.
**Layout:** App shell = 248px dark sidebar + fluid main content area (max-width 1280px, centered, 36px padding).
**Sidebar** (persistent across all coach screens): near-black (`--color-neutral-900`) background (or light variant — see Sidebar Theme tweak), brand wordmark top, nav items (Dashboard, Leads, Clients, Chat, Calendar, Documents) each 44px-tall rounded row with icon + label, active item filled with accent-700 background, hover = subtle white-alpha background. Footer: avatar circle + coach name/role, pinned to bottom.
**Topbar:** 76px, page title (24px heading font) left, search input (pill-shaped, 280px) + icon buttons right.
**Content:**
1. **Greeting line** — "Tuesday, July 29 · Here's what's happening today" (muted, small).
2. **AI Briefing card** — soft gold gradient background card (`.briefing-card`), coach greeting ("Good morning, {name}"), 4-6 bullet list with small gold dot markers, each bullet a specific, actionable line (client X quiet 5 days, renewal due tomorrow, etc.) — copy must be dynamically generated from real client/lead/task data in production, not static.
3. **Ledger strip** — a single 4-column bordered row (not 4 separate cards) showing key metrics (active clients, MRR, at-risk count, leads waiting), each cell divided by a vertical hairline, big serif numerals (34px), small trend indicator.
4. **Recent activity / lead & client shortcuts** — supporting cards below, same card styling.
All content blocks use a fade-up entrance animation on page load; grouped card sets (ledger, feature grid) stagger each child's animation by ~40ms.

### 3. Leads (Pipeline)
**Purpose:** Track inbound leads from first contact to conversion.
**Layout:** Kicker "Pipeline" + page title + "Add Lead" primary button top. Below: kanban board, 1 column per stage (New → Contacted → Follow Up → Booked), each column header shows stage name + count, hairline bottom border.
**Lead card:** rounded card, accent-colored left rail stripe (indicates stage/urgency), name, contact channel tag, short note, avatar. Hover = lift + shadow.
**Add Lead dialog:** modal (see Dialog tokens) — name, contact, channel, notes fields, Save/Cancel actions.
**Also:** a table view alternative (list all leads with stage dropdown per row) exists in-prototype — implement whichever the codebase's list pattern favors; kanban is primary.

### 4. Clients
**Purpose:** Manage active/at-risk/paused client roster.
**Layout:** Top banner (if invite pending) — accent-tinted bar with invite link + "Copy" button. Below: 3-column grid of client cards.
**Client card:** avatar (ring highlight if active), name, program/goal label, progress bar (thin, rounded, gold fill), semantic status tag (`tag-live` = active/green-gold, `tag-risk` = at-risk/darker gold+bold — no red; stays within the accent palette). Card is fully clickable → client profile.
**Add Client dialog:** name, email, program, goal fields.

### 5. Client Profile (coach view)
**Purpose:** Single client's full record — the densest screen in the coach app.
**Layout:** 2-column: left rail (280px, avatar circle 140px, name, joined date, tags) + right content stack of cards:
1. **Intake responses card** — shows client's self-submitted onboarding answers (goal, experience, availability, notes) once submitted via the portal invite link; empty state ("Not submitted yet — sent with the client's invite link") otherwise.
2. **Goal card** — plain text goal statement.
3. **Progress card** — % bar **plus** a 6-step milestone timeline (Kickoff → Foundations → Midpoint review → Momentum phase → Final stretch → Complete), each step a small dot on a connecting line; dot fills gold when passed, outlined/neutral when upcoming, positioned by current progress %.
4. **Billing card** — subscription "valid until" date field (date input), auto-computed status tag (Active / "Renewal due in Nd" / "Overdue — renewal reminder sent" — tag color escalates accent intensity, still no red), invoice list (amount + due date + Paid/Pending toggle chip), "+ Add invoice" inline form (amount + due date).
5. **Coach notes card.**
6. **AI Session Assistant card** — the core AI feature (detail below).
7. **Documents card** — file list, upload button.
8. **Tasks card** — shared task list (detail below), addable by coach with due date.

### 6. AI Session Assistant (embedded in Client Profile)
**Purpose:** Turn a quick text note or 1-minute voice memo into a client-ready follow-up, with the coach always reviewing before send.
**States (implement as a small state machine, not just UI):**
1. **Idle** — textarea ("Type a quick summary...") + two buttons: "Record voice note" and "✨ Generate follow-up".
2. **Recording** — pulsing red-ish dot ( still accent-toned, not alarm-red, to match system — recommend a warm accent pulse instead of red in production, but a status-red is acceptable here as it's a real recording indicator), live mm:ss counter capped at 1:00, "Stop & transcribe" button.
3. **Transcribing** — brief loading text (real implementation: send audio to a transcription API, e.g. Whisper).
4. **Follow-up ready** — shows AI-drafted **summary**, a bulleted **action items** list, and an editable **draft message textarea** addressed to the client by name. Actions: "Discard" or "Review & send to client" (button label flips to "Sent ✓" for 2s on send, matching the rest of the app's optimistic-confirmation pattern).
**Production behavior:** POST the transcript/typed note + client history context to an LLM; parse structured JSON back (summary, action_items[], draft_message); persist the summary+actions to the client's timeline; sending should create a real message in the client's chat thread.

### 7. Chat
**Purpose:** 1:1 coach↔client messaging with attachments and AI-assisted replies.
**Layout:** 280px conversation list (avatar, name, last message preview, unread indicator, active conversation gets accent left-border + tinted background) + message thread pane.
**Composer:** attach button (opens a pill-button row: image/doc/video), a **sparkle "Suggest reply" icon button** (AI smart-reply — fills the composer with a draft grounded in that client's progress/history data, coach can edit before sending), text input, Send button.
**Message bubbles:** rounded 16px, sent messages accent-tinted with accent border, received neutral; file attachments render as a bordered pill with file-type icon + filename.
**Production behavior:** smart reply should call an LLM with recent thread history + client profile/progress context; never auto-send.

### 8. Calendar (coach)
**Purpose:** Manage availability rules and view/confirm upcoming meetings.
**Layout, top to bottom:**
1. **Integrations card** — connect/disconnect rows for Google Meet and Cal.com (icon + name + status + connect button).
2. **Availability & scheduling rules card** (new) — session length select (30/45/60/90 min), buffer-between-sessions select (0/10/15/30 min), a row of 7 day toggle chips (Mon-Sun, active = filled accent chip) for which days the coach is bookable, and a **recurring time slots** manager: chips showing existing recurring slots (e.g. "9:00 AM") with an ×-remove, plus a time input + "+ Add time slot" to add more. This directly drives what client-side booking should offer.
3. **Upcoming meetings card** — list of booked sessions (client name, time, type).

### 9. Documents
**Purpose:** Shared file library between coach and client.
**Layout:** Kicker "Documents" + upload button; file list/grid, each row shows filename, type icon, uploaded-by, date, download action.

### 10. Client Portal (client-facing app)
**Purpose:** The client's entire surface — deliberately narrower than the coach app.
**Layout:** 220px light sidebar (Onboarding, Dashboard, Messages, Tasks, Calendar, Files, Progress, Check-In, Settings) + content area, same visual system as coach app but no dark theme requirement necessarily (kept consistent with coach in prototype).
**Sub-screens:**
- **Onboarding (intake)** — shown to a brand-new client (first login after invite link accepted): short form (Primary goal, Experience level select, Availability, Notes) → Submit → confirmation card ("Thanks — you're all set!"). This is what populates the coach-side "Intake responses" card and should be fed into the AI briefing/profile automatically on submit.
- **Dashboard** — greeting + own snapshot (tasks due, next session, progress %).
- **Messages** — same chat UI as coach side, client's perspective.
- **Tasks** — shared task list (see below), client can add their own tasks alongside coach-assigned ones.
- **Calendar** — booking flow reading the coach's availability rules (respect session length/buffer/days/slots configured in coach Calendar screen) — pick a slot, confirm.
- **Files** — same document list, client-facing.
- **Progress** — % bar + the same 6-step milestone timeline as the coach view, plus an **"AI Progress Insight"** card: plain-language paragraph translating the raw % + notes into a trend statement ("You're ahead of pace at 72%...", "...behind pace — worth extra attention" etc., tone shifts by progress bracket). Generate this server-side from check-in + task-completion + attendance data, not just the % number.
- **Check-In** — **two tabs: Daily and Weekly.** Daily = quick mood segmented-control (Low/Okay/Good/Great) + one-line text input + Submit (button flips to "Submitted ✓" briefly). Weekly = mood + "Biggest win" + "Any challenges?" (optional) + Submit. Both persist to a check-ins table keyed by date/week.
- **Settings** — profile fields, notification preferences.

### 11. Shared Task System (coach + client, both profile and portal)
**Purpose:** Either party can add a task; both see who added what and can check off / edit.
**Behavior (implement as one shared list per client, not two separate lists):**
- Each task: title, due date, done (boolean), addedBy (`coach` | `client`).
- **Add:** inline row — title input + date input + Add button. Present on both the coach's Client Profile Tasks card and the client portal's Tasks page, both writing to the same underlying list.
- **Toggle done:** checkbox; done tasks get strikethrough + muted color + status tag flips to "Done" (tag-live style); not-done shows "Due {date}" (tag-accent style).
- **Edit:** pencil icon button toggles a row into edit mode (title + date inputs + Save) in place — no separate modal.
- **Attribution label:** each row shows "Added by {CoachFirstName}" or "Added by {ClientFirstName}/you" depending on which side is viewing.

### 12. Dialogs (Add Lead / Add Client / etc.)
**Layout:** Centered modal, backdrop at 50% black over near-black neutral-900, dialog surface `--color-surface`, `--radius-lg` corners, `--shadow-lg`. Title (20px heading font) + body fields + right-aligned action row (Cancel = ghost/secondary button, primary action = filled accent button).

---

## Interactions & Behavior
- **Page/section transitions:** fade-up entrance (`opacity 0→1`, `translateY(10px→0)`, ~500ms, custom cubic-bezier ease-out) on every route/view change.
- **Staggered grids:** ledger strip, lead columns, client card grid, feature grid — each child's fade-up delayed incrementally (~20-40ms per item, capped around 6 items) so groups reveal in sequence rather than popping in at once.
- **Buttons:** primary/secondary buttons lift 1px + gain shadow on hover; all interactive elements use a ~150ms ease transition on transform/background/border/shadow — no instant snaps.
- **Cards (clickable):** lift `translateY(-3px)` + elevate shadow on hover; border stays neutral (no color-shift border on hover, kept subtle).
- **Optimistic confirm pattern:** any "submit"/"send" action (check-ins, session follow-up send) flips its button label to a "✓ Sent/Submitted" state for ~2 seconds before reverting — used consistently across check-ins, invoices-paid toggle, and the AI follow-up send.
- **Theme toggle:** light/dark mode switch in settings/topbar; persists user choice (localStorage in the prototype; use real user preference storage in production). Dark mode must NOT invert the sidebar (it stays a fixed dark tone in both themes) — only the main content area and cards invert.
- **Niche tweak:** a "Niche" selector (Fitness / Business / Career) reshapes: coach's/clients' example names, meeting-type labels, landing testimonial copy, and greeting — implement as a data-driven config object per niche rather than hardcoded strings, so a real coach's actual niche selection at signup drives this permanently (not a runtime toggle in production).
- **Sidebar theme tweak:** dark vs. light sidebar variant — a coach preference, not user-facing at runtime necessarily; fine to keep as a per-account setting.
- **Briefing style tweak:** "edits" (bullet list) vs. "narrative" (prose paragraph) rendering of the same AI briefing content — a coach preference toggle.

## State Management
Key pieces of state to model server-side (not just client state):
- `selectedClientId` / `activeChatId` — current navigation context.
- Per-client: `intake` (submitted or not + answers), `billing` (validUntil + invoices[]), `tasks[]` (shared, addedBy-tagged), `progress` (%, milestone position derived from %), `notes`.
- Per-coach: `availabilityRules` (sessionLength, buffer, days{}, slots[]) — drives client-side booking options.
- Chat: `sentMessages`/thread history, `attachments`, draft text, AI-suggested-reply text (ephemeral, not persisted until sent).
- AI Session Assistant: `voiceState` (idle/recording/transcribing), `sessionInputText`, generated `summary`/`actionItems`/`draftMessage` (ephemeral until "sent", at which point persist to client record + create a chat message).
- Theme: `dark`/`light` (persisted per-user).
- Niche: persisted per-coach-account (set once at onboarding in production, not a live per-session toggle).

## Design Tokens

### Colors (Classical system)
```
--color-bg: #f3f2f2
--color-surface: #eae9e9
--color-text: #201f1d
--color-divider: color-mix(in srgb, #201f1d 16%, transparent)

Neutral ramp: 100 #f8f4f4 → 200 #eae7e7 → 300 #d7d3d3 → 400 #bab6b6 →
              500 #9b9797 → 600 #7d7979 → 700 #605d5d → 800 #444141 → 900 #2d2b2b

Accent (gold) ramp: 100 #fff3e4 → 200 #ffe3bf → 300 #facb8d → 400 #e1ad66 →
              500 #c28d41 → 600 #a06f24 → 700 #7d5411 → 800 #5a3b0a → 900 #3a270d
```
**Dark mode overrides** (sidebar stays fixed dark in both modes; only these invert):
```
--color-bg: #18161b   --color-surface: #1e1c22   --color-text: #eeebe5
--color-divider: rgba(255,255,255,0.11)
neutral ramp inverted (100 darkest → 900 near-black-adjacent, see prototype for exact stops)
accent-100/200 darkened via oklch() to stay legible on dark surfaces
```
Semantic usage — no red/green traffic-light colors anywhere; status communicated via accent intensity + label:
- Active/done → `tag-live` (light accent bg, accent-700 text)
- At-risk/pending/due → `tag-accent` or `tag-risk` (deeper accent bg/text, bold)
- Neutral/not-started → `tag-outline` (accent border, transparent fill) or `tag-neutral` (neutral bg)

### Typography
- **Heading font:** Cormorant Garamond (serif), weight 600 for UI headings/titles, weight 400 for large display text (hero headline, big serif numerals). Google Font.
- **Body font:** Lora (serif), weight 400. Google Font.
- Scale: h1 42px / h2 32px / h3 25px / page-title 24px / card-title 17-19px / body 14-15.5px / small/meta 11-13px, all with `line-height: 1.5-1.65` on body copy.
- Kickers/eyebrows: uppercase, letter-spacing 0.08-0.12em, 11-12px, accent-700 (or accent-400 on dark surfaces).

### Spacing scale
`4.6px, 9.2px, 13.8px, 18.4px, 27.6px, 36.8px` (an unusual non-power-of-2 scale — keep it if matching pixel-for-pixel matters, otherwise a standard 4/8px scale is a safe substitute).

### Radius (modernized from the base design system's near-flat 2/4/7px)
`--radius-sm: 8px` · `--radius-md: 12px` · `--radius-lg: 20px` — used for cards, dialogs, chat bubbles, pill buttons/search/tags.

### Shadows (modernized — soft/diffused, not the base system's tight ink-shadows)
```
--shadow-sm: 0 1px 2px rgba(32,31,29,.05), 0 1px 1px rgba(32,31,29,.04)
--shadow-md: 0 8px 24px rgba(32,31,29,.08), 0 2px 6px rgba(32,31,29,.05)
--shadow-lg: 0 24px 56px rgba(32,31,29,.16), 0 6px 16px rgba(32,31,29,.08)
```

### Motion
- Entrance: `fadeUp` keyframes — `opacity 0→1`, `translateY(10px→0)`, `500ms cubic-bezier(.16,1,.3,1)`.
- Stagger children: +20-40ms delay per item, cap ~6 items.
- Interactive hover: `150-180ms ease` on transform/background/border/box-shadow.

### Niche variants (data-driven, not hardcoded copy)
Each niche config supplies: example client/coach first names, meeting-type labels (e.g. fitness: "Strength check-in", business: "Founder check-in", career: "Mock interview"), landing testimonial quote + attribution, coach title/label.

---

## Assets
- **Hero image** (landing page): user-supplied photo of a coach with a client in a working session — currently a placeholder image slot, awaiting the real asset (`wmremove-transformed.jpeg` was supplied in the design tool but is a design-tool-local upload; source the final hero photo separately for production).
- **Avatars:** placeholder circular photo slots throughout (client profile, sidebar footer) — wire to real user-uploaded avatars or generated initials-avatars as fallback.
- **Icons:** all inline SVG (stroke-based, 1.8px stroke width, currentColor/accent-tinted) — no icon font/library dependency; recreate with your icon set of choice (Lucide/Feather-style line icons match this weight).
- **Fonts:** Cormorant Garamond + Lora, both Google Fonts (loaded via `@import` in the prototype; use `next/font` or a `<link>` in production for performance).

## Files
- `Coaching OS - Prototype.dc.html` — full interactive design reference (all screens/states described above).
- `Coaching OS - PRD.dc.html` (source for the PRD summary below) — product requirements: scope, schema, API, sprint plan.
