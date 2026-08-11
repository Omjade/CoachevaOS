# CoachevaOS — Product Requirements Document

**An AI-powered operating system for independent coaches — replacing spreadsheets, WhatsApp, Drive, Calendly and Gmail with one dashboard.**

## 1. Problem & Vision
Coaches — business, fitness, career and consulting — currently run their practice across seven or eight disconnected tools: spreadsheets for client tracking, WhatsApp for messaging, Drive for files, Calendly for scheduling, Meet for calls, and Gmail for everything else. Nothing talks to anything else, so coaches spend more time administering their business than coaching. CoachevaOS is not a CRM bolted onto a calendar — it is the single place a coach opens every morning, with an AI assistant that already knows what happened overnight and what needs attention today.

> **AI Daily Briefing — the product's spine.** Every session opens with a generated summary: *"Good morning — today you have 4 client meetings, 2 clients haven't replied in 5 days, 1 subscription expires tomorrow, 3 leads are waiting on follow-up, and John has completed all his tasks — recommend his next milestone."* Every other module exists to feed this briefing with real data.

## 2. Users
- **Coach (primary):** Solo or small-team business/fitness/career coaches and consultants with 5–150 active clients. Not technical; wants fewer apps, not more dashboards.
- **Client (secondary):** Enters through a personalized branded link (e.g. `coachapp.com/rahulfitness`). Needs a minimal, mobile-first surface: messages, tasks, calendar, files, progress, check-in.

## 3. MVP Scope (2–3 week build)
| In scope | Cut for MVP |
|---|---|
| Email + Google auth, coach & client roles | SSO/SAML, 2FA |
| Coach dashboard incl. AI daily briefing | Revenue analytics beyond a simple MRR number |
| Leads: manual entry, kanban + table, stages | Lead scoring, multi-channel lead capture (ads, forms) |
| Clients: manual create + invite-link self-serve | Team/multi-coach org accounts |
| Branded client portal (single coach) | Custom domains, white-label branding beyond logo/color |
| 1:1 chat: text, image, PDF, voice note | Group chat, video calls in-app |
| Document upload/download (S3) | E-signature, version history |
| Calendar: Cal.com embed for booking + coach availability rules | Native calendar build, multi-calendar sync |
| Tasks (shared coach/client) with due date, priority | Dependencies, subtasks |
| Daily + weekly check-in (mood/progress/wins/challenges) | Custom check-in builder |
| Client onboarding intake form (feeds AI briefing/profile) | Dynamic form builder |
| Billing: subscription valid-until date + manual invoices + renewal reminders | Full payments/Stripe integration, automated charging |
| AI: daily briefing, client summary, risk flags, session-note → action items, smart reply drafts, progress insights | AI voice assistant beyond transcription, fully autonomous send |
| Notifications: in-app + email | SMS/WhatsApp notifications |
| Basic analytics (active/inactive, conversion, completion) | Cohort analysis, forecasting |

## 4. Feature Priority
| Tier | Features |
|---|---|
| P0 | Auth, Coach Dashboard, Client Mgmt + Invite Link, Client Portal shell, Chat, Tasks, Calendar booking, AI Daily Briefing |
| P1 | Lead Management, Documents, Check-Ins, Notifications, Basic Analytics, Billing/Invoicing |
| P2 | Branding/theming controls, richer AI (session assistant, smart replies, progress insights), Availability rules depth, Settings depth |

## 5. Core User Flows

**5.1 Coach onboarding** — Sign up (email or Google) → set coaching niche + timezone → claim portal slug (`/yourname`) → connect Cal.com (optional, skippable) → set availability rules (session length, buffer, days, slots) → land on dashboard with an empty-state briefing and a "add your first client" nudge.

**5.2 Lead → Client conversion** — Coach adds a lead manually or lead lands via portal contact form → stage moves New → Contacted → Follow Up → Booked (kanban drag or table dropdown) → on Converted, coach one-clicks "Create Client," which carries name/email/phone/notes across and sends the client an invite email/link.

**5.3 Client self-serve join** — Client visits `coachapp.com/rahulfitness` → creates an account → is automatically scoped to that coach (no client ever sees another coach's data) → completes the onboarding intake form (goal, experience, availability, notes) → answers feed directly into the coach's AI briefing and the client's profile → lands on their own dashboard.

**5.4 Daily coach loop** — Open dashboard → read AI briefing → act on flagged items (message an at-risk client via a smart-reply draft, confirm a booking, review a renewal reminder, turn a session voice-note into a client follow-up) → briefing items resolve out of the list as acted on.

**5.5 Session capture loop** — After a call, coach types a quick note or records a ≤60s voice memo → AI transcribes (if voice) → AI drafts a summary + action items + a client-facing follow-up message → coach reviews/edits → sends → summary+actions saved to the client record, message posted to the chat thread.

## 6. Database Schema (core tables)
| Table | Key fields |
|---|---|
| `users` | id, email, password_hash, role (coach/client), name, avatar_url, timezone, created_at |
| `coach_profiles` | user_id, portal_slug, business_name, niche, brand_color, logo_url, cal_com_url, subscription_tier, availability_rules_json |
| `clients` | id, coach_id, user_id, goals, program, status (active/at_risk/paused/churned), joined_at, subscription_valid_until, tags[] |
| `leads` | id, coach_id, name, phone, email, interested_in, stage, notes, created_at, last_contacted_at |
| `messages` | id, thread_id, sender_id, type (text/image/pdf/video/voice), body, media_url, read_at, created_at |
| `threads` | id, coach_id, client_id, last_message_at |
| `documents` | id, coach_id, client_id (nullable = template), name, type, s3_key, uploaded_by, created_at |
| `tasks` | id, coach_id, client_id, title, due_date, done, added_by (coach/client), priority, is_recurring |
| `meetings` | id, coach_id, client_id, calcom_booking_id, starts_at, ends_at, status, meeting_url |
| `checkins` | id, client_id, type (daily/weekly), period_key, mood, one_liner, progress_notes, challenges, wins, submitted_at |
| `intake_responses` | id, client_id, goals, experience, availability, notes, submitted_at |
| `invoices` | id, client_id, amount, due_date, paid, created_at |
| `ai_insights` | id, coach_id, client_id (nullable), type (briefing/risk/renewal/follow_up/progress/session_summary), payload_json, created_at, resolved_at |
| `notifications` | id, user_id, type, payload_json, read_at, created_at |
| `platform_subscriptions` | id, coach_id, tier (trial/starter/growth/scale/enterprise), status (trialing/active/trial_expired/past_due/canceled), trial_ends_at, current_period_end, client_limit, created_at, updated_at |

**Platform billing (CoachevaOS → coach, added post-MVP-scope discussion):** 14-day free trial, then tiered by active client count — Starter <50 clients $29/mo, Growth ≤100 $49/mo, Scale ≤200 $89/mo, Enterprise 200+ contact sales. No payment provider wired for MVP: tier/status are tracked and set manually. Near a tier's client limit, show a soft upgrade nudge only (never block adding clients). If the trial ends with no plan selected, flip to read-only (writes blocked, reads still allowed) until a plan is chosen. This is separate from the existing `invoices` / `subscription_valid_until` fields on `clients`, which remain the coach's own manual client-billing tracker.

## 7. API Design (representative endpoints)
```
Auth        POST /auth/register  POST /auth/login  POST /auth/google  GET /auth/me
Leads       GET/POST /leads   PATCH /leads/:id   PATCH /leads/:id/stage
Clients     GET/POST /clients   GET /clients/:id   POST /clients/invite
Portal      GET /portal/:slug   POST /portal/:slug/join
Intake      POST /clients/:id/intake   GET /clients/:id/intake
Messages    GET /threads/:id/messages   POST /threads/:id/messages   WS /ws (socket.io)
Documents   POST /documents (S3 presigned)   GET /documents?clientId=
Calendar    GET/POST /meetings   GET/PATCH /coach/availability   Cal.com webhook /webhooks/calcom
Tasks       GET/POST /tasks   PATCH /tasks/:id   PATCH /tasks/:id/complete
Check-ins   POST /checkins   GET /checkins?clientId=&type=
Billing     GET/POST /clients/:id/invoices   PATCH /invoices/:id/paid   PATCH /clients/:id/subscription
AI          GET /ai/briefing   GET /ai/clients/:id/summary   GET /ai/risk-flags
            POST /ai/session-note (text or audio) → { summary, action_items[], draft_message }
            POST /ai/suggest-reply (threadId) → { draft }
            GET /ai/clients/:id/progress-insight
Notify      GET /notifications   PATCH /notifications/:id/read
```

## 8. Suggested Folder Structure
```
coachevaos/
├─ apps/
│  ├─ web/                 # Next.js (coach + client web app)
│  │  ├─ app/(coach)/dashboard, leads, clients, chat, calendar, documents, settings
│  │  ├─ app/(client)/[slug]/onboarding, dashboard, messages, tasks, calendar, files, progress, checkin, settings
│  │  └─ components/  ui/  hooks/
│  └─ api/                 # Node + Express
│     ├─ src/modules/ auth, leads, clients, messages, documents,
│     │        calendar, tasks, checkins, billing, ai, notifications
│     ├─ src/jobs/         # BullMQ workers (reminders, AI briefing gen, transcription)
│     └─ prisma/schema.prisma
└─ packages/ shared-types/  ui/
```

## 9. Authentication Flow
JWT access + refresh tokens, httpOnly cookies. Coach and client are the same `users` table with a `role` field and separate route guards; a client's session is additionally scoped to their `coach_id` so no query can cross accounts. Google OAuth reuses the same session issuance. Invite-link join creates the user pre-linked to a coach via a signed slug token, and routes the client straight to the onboarding intake form on first login.

## 10. AI Architecture
A nightly + on-demand job aggregates each coach's data (messages, attendance, tasks, check-ins, subscription dates) into a compact JSON context, then calls an LLM (Claude/OpenAI) with a fixed prompt template per insight type; results are cached in `ai_insights` and surfaced on the dashboard rather than called live on every page load, keeping latency and cost predictable.

**Prompt templates (abbreviated):**
```
DAILY_BRIEFING:
"You are {coach.name}'s coaching assistant. Given today's meetings,
messages with no reply in 5+ days, subscriptions expiring within 3 days,
leads awaiting follow-up, and clients who completed all tasks — write a
warm, specific 4-6 bullet morning briefing. Recommend one concrete next
action per flagged item."

CLIENT_RISK:
"Given {client.name}'s last-reply date, attendance trend and latest
check-in mood/progress, flag risk level (low/medium/high) and a one-line
reason a coach could act on today."

SESSION_NOTE_TO_FOLLOWUP:
"Given this session note/transcript and {client.name}'s program and
history, produce JSON: { summary, action_items: string[3-5],
draft_message: a warm, specific follow-up in the coach's voice }."

SMART_REPLY:
"Given the last N messages in this thread and {client.name}'s current
progress/program, draft one reply the coach could send as-is or edit."

PROGRESS_INSIGHT:
"Given {client.name}'s % progress, recent check-ins, and task completion
rate, write one plain-language paragraph: are they ahead, on, or behind
pace, and why — for the client to read directly."
```
**Voice notes:** capture ≤60s audio client-side → upload → transcribe (e.g. Whisper API) → feed transcript into `SESSION_NOTE_TO_FOLLOWUP`. Never auto-send; coach always reviews/edits the draft first.

## 11. Notification Flow
Triggers: meeting starting soon, task due, subscription expiring, unread message after 24h, lead awaiting follow-up, invoice due/overdue. Each writes a `notifications` row and fans out to in-app (always) and email (user preference); a scheduler handles time-based triggers, event-based ones fire inline from the relevant API call.

## 12. Build Order & Sprint Plan
| Week | Focus |
|---|---|
| Week 1 | Auth (coach+client+Google), DB schema/Prisma, coach dashboard shell, client CRUD + invite link + portal shell + intake form |
| Week 2 | Chat (socket.io + S3 media) + smart replies, tasks (shared), documents, Cal.com booking embed + availability rules, lead kanban/table, daily/weekly check-in, billing/invoices |
| Week 3 | AI briefing + risk/follow-up/session-assistant/progress-insight jobs, notifications, basic analytics, polish + responsive pass, deploy (Docker → Railway) |

## 13. Design Guidelines
Clean modern SaaS in the spirit of Linear and Notion, expressed through an editorial "Classical" visual system: serif display type, hairline rules, warm off-white background, single gold accent (no red/green traffic-light colors — status is accent-intensity + label). Generous whitespace, softly rounded cards (8-20px radius), diffused shadows, smooth fade-up micro-animations. Client-side UI is deliberately narrower than coach-side — onboarding, dashboard, messages, tasks, calendar, files, progress, check-in, settings, and nothing else. Full detail in `README.md`'s Design Tokens section.

## 14. Future Roadmap (post-MVP)
- Multi-coach team accounts & permissions
- Native calendar with multi-provider sync
- Full payments & automated subscription billing (Stripe)
- WhatsApp/SMS notification channel
- Custom check-in & form builder
- Full white-label custom domains
- Fully autonomous AI-drafted client replies & voice briefing playback
- Cohort & revenue forecasting analytics
- Group/cohort coaching view
