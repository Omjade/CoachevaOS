# CoachevaOS
The AI Operating System for Coaches &amp; Business

## Repo layout
```
apps/
  web/     Next.js 14+ (App Router, TypeScript, Tailwind v4) — coach app, client portal, marketing site
  api/     FastAPI (async SQLAlchemy 2.0 + Alembic) — REST + WebSocket backend
docs/
  PRD.md   Product requirements (source of truth for scope/schema/API)
design_extracted/  Read-only design reference — do not edit or copy the .dc.html into app code
```

## Prerequisites
- Node.js 20+ (repo tested with Node 24)
- Python 3.11 (used for `apps/api/.venv` — do not use the system 3.8)
- A Neon Postgres project (free tier is fine for dev)

## First-time setup

### API (`apps/api`)
```
cd apps/api
py -3.11 -m venv .venv
./.venv/Scripts/activate        # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env            # then fill in DATABASE_URL from your Neon dashboard + JWT_SECRET
alembic upgrade head            # applies migrations once models exist
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
```

### Web (`apps/web`)
```
cd apps/web
npm install
npm run dev                     # http://localhost:3000
```

## Environment variables
See `apps/api/.env.example` for the full list (`DATABASE_URL`, `JWT_SECRET`, Google OAuth creds, CORS origins). Never commit `.env`.

## Build plan
The phased implementation plan (schema, auth, features, AI, etc.) lives at
`C:\Users\hp\.claude\plans\piped-tumbling-sunset.md` and mirrors `docs/PRD.md`.
