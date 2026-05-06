# Nameo — Repo Rules

This file governs how code is organized and how AI tools (Claude, etc.) should
work in this repo. Follow these rules on every change.

---

## Repo structure

```
nameo-dev/
├── .github/workflows/    # CI/CD — deploy-frontend.yml, deploy-worker.yml
├── frontend/             # Static SPA (Vite + vanilla JS) → Cloudflare Pages
├── backend/
│   ├── worker/           # Main API worker (auth, sessions, runners) → Cloudflare Workers
│   └── search-worker/    # Product orchestrator worker → Cloudflare Workers
├── wrangler.toml         # Wrangler config for nameo-worker (must stay at root)
├── README.md             # Project overview
├── CLAUDE.md             # This file — repo rules for AI tools
└── DESIGN.md             # Product design doc — user workflow, feature stubs
```

**Hard rules:**
- `frontend/` only — anything the browser loads: HTML, JS, CSS, images, public assets
- `backend/` only — any server-side code: Cloudflare Workers, scripts, schemas
- Root only — git config, direction files (README, CLAUDE.md, DESIGN.md), wrangler.toml
- Nothing else belongs at the root. No `portal/`, no `config/`, no loose scripts, no scratch notes.

---

## Frontend (`frontend/`)

- Framework: Vite + vanilla JS. No React, no framework.
- Entry: `frontend/index.html` → `frontend/src/main.js`
- Router: hash-based (`#/route`). All routes in `frontend/src/router.js`.
- Pages: `frontend/src/pages/<name>.js` — each exports a single function returning a DOM element.
- Styles: `frontend/src/styles/` — `base.css`, `layout.css`, `theme.css`
- API calls: always use `API_BASE` from `frontend/src/config.js`. Never hardcode worker URLs.
- Deploy: GitHub Actions → Cloudflare Pages (`nameo-dev` project)

**Page rules:**
- Minimum pages and buttons. Think Apple: one action per screen.
- No modals stacked on modals. No wizard steps that could be one screen.
- New routes must be added to `router.js`. Unused routes go in `archivedRoutes`.

---

## Backend — main worker (`backend/worker/`)

- Entry: `backend/worker/src/index.js`
- Handles: auth (Auth0 JWT), user CRUD, session CRUD, rate limiting, health endpoint
- Runners: `backend/worker/src/runners/` — one file per report type
  - Each runner is called by `executeAllPendingReports` via `ctx.waitUntil()` (parallel)
  - Runners write results back via `updateReportStatus()` in `lib/report-status.js`
- Schema: `backend/worker/schema.sql` — D1 database schema
- Tests: `backend/worker/tests/unit/` — Vitest unit tests. Must pass before deploy.
- Deploy: GitHub Actions → `wrangler deploy` (from repo root, uses root `wrangler.toml`)
- Secrets (set via `wrangler secret put`): `ORCHESTRATOR_TOKEN`, `ANTHROPIC_API_KEY`, `NTFY_TOPIC`, `TWITTER_BEARER_TOKEN`

**Runner rules:**
- Each runner must call `updateReportStatus(env, reportId, 'complete', result)` or `'error'`
- Runners must never throw unhandled exceptions — always catch and call error status
- Stub runners return `{ stub: true, checked_at }` — never fake availability data
- Live runners return real data or `status: 'unknown'` — never guess

---

## Backend — search worker (`backend/search-worker/`)

- Purpose: product feature orchestrator — runs availability checks that are too slow
  or resource-heavy for the main worker
- Entry: `backend/search-worker/index.js`
- Auth: requires `ORCHESTRATOR_TOKEN` Bearer header on all non-health requests
- Deploy: same GitHub Actions pipeline as main worker
- Secrets: `ORCHESTRATOR_TOKEN` (must match main worker's copy)

---

## Wrangler / Cloudflare

- `wrangler.toml` at repo root configures `nameo-worker`
- `backend/search-worker/wrangler.toml` configures `nameo-search-worker`
- D1 binding: `NAMEO_DB` → `nameo-db` (id: `4afe937a-4c9b-4cb1-bfad-64d8844ca26e`)
- Service binding: `SEARCH_ORCHESTRATOR` → `nameo-search-worker`
- Worker URL: `https://nameo-worker.benjamin-f-mcdaniel.workers.dev`

---

## GitHub Actions

Two workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy-worker.yml` | push to `main` touching `backend/**` or `wrangler.toml` | Run unit tests → deploy nameo-worker → deploy search-worker → QA tests |
| `deploy-frontend.yml` | push to `main` touching `frontend/**` | Build Vite → deploy to Cloudflare Pages |

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`
Required GitHub variables: `WORKER_URL`

---

## What NOT to do

- Do not add files or directories at the repo root except the ones listed above
- Do not hardcode API URLs in frontend — use `config.js`
- Do not add new npm packages at the root level (root has no package.json)
- Do not implement features inside runners before the stub is validated end-to-end
- Do not use the `backend/worker/index.js` file — it is a deprecated stub pointing to `src/index.js`
- Do not reference archived routes (`/search`, `/advanced`, `/advanced-report`, `/campaigns`)
