# Nameo v2 — Repo Rules

This file governs how code is organized and how AI tools (Claude, etc.) should
work in this repo. Follow these rules on every change.

---

## Repo structure

```
nameo-dev/
├── .github/workflows/    # CI/CD — deploy-frontend.yml, deploy-worker.yml
├── frontend/             # Static SPA (Vite + vanilla JS) → Cloudflare Pages (nameo-dev)
├── backend/
│   ├── worker/           # Main API worker → Cloudflare Workers (nameo-worker)
│   └── search-worker/    # Legacy — leave alone, still deployed
├── config/
│   └── safety.json       # Profanity/length rules (still referenced by worker if needed)
├── wrangler.toml         # Wrangler config for nameo-worker (at root)
├── README.md
├── CLAUDE.md             # This file
└── DESIGN.md             # Product design doc — v2 spec
```

**Hard rules:**
- `frontend/` only — anything the browser loads
- `backend/` only — server-side code
- Root only — git config, direction files, wrangler.toml
- Nothing else belongs at the root

---

## Product v2 — what it is

**Product 1: "Find a name"** (launched)
- User inputs seed words + email → Stripe Checkout ($25)
- On payment: LLM director (Claude Haiku) → algorithmic name generator → domain checker (DoH→RDAP)
- Results: available domains ranked by length, accessible at /sweep/:id URL

Not built yet: Product 2 ("Watch my name" — subscription defense sweep).

---

## Frontend (`frontend/`)

- Framework: Vite + vanilla JS. No React, no framework.
- Entry: `frontend/index.html` → `frontend/src/main.js`
- Router: hash-based (`#/route`). Routes in `frontend/src/router.js`.
- Pages: `frontend/src/pages/<name>.js` — each exports a function `Name({ params, query })` returning a DOM element.
  - `home.js` — seed input form, Stripe CTA
  - `sweep.js` — polling progress + results
  - `notfound.js` — 404
- Styles: `frontend/src/styles/` — base.css, layout.css, theme.css
- API calls: always use `API_BASE` from `frontend/src/config.js`. Never hardcode worker URLs.
- Deploy: GitHub Actions → Cloudflare Pages (`nameo-dev` project)

**Page rules:**
- Minimum pages. One action per screen.
- No auth, no modals stacked on modals.

---

## Backend — main worker (`backend/worker/`)

- Entry: `backend/worker/src/index.js`
- Routes:
  - `GET  /api/health`
  - `POST /api/sweep/init`         — create sweep + Stripe Checkout session
  - `GET  /api/sweep/:id`          — poll sweep status/progress
  - `GET  /api/sweep/:id/results`  — paginated domain results
  - `POST /api/stripe/webhook`     — Stripe payment confirmation → kicks off pipeline
- Libs: `backend/worker/src/lib/`
  - `domain-checker.js`  — DoH→RDAP availability check
  - `name-generator.js`  — algorithmic factory (generateCandidates, expandToDomainPairs)
  - `llm-director.js`    — single Claude Haiku call → directions JSON
  - `sweep-pipeline.js`  — async pipeline: director → generator → checker → D1 writes
  - `stripe.js`          — Stripe Checkout creation + webhook verification
  - `json.js`            — CORS headers + json() helper
- Schema: `backend/worker/schema.sql` — D1 v2 schema (sweeps, sweep_results, rate_limits)
- Tests: `backend/worker/tests/unit/` — Vitest. Must pass before deploy.
- Deploy: GitHub Actions → `wrangler deploy` from repo root

**Pipeline rules:**
- `sweep-pipeline.js` is called via `ctx.waitUntil()` — never awaited in the response path
- Pipeline must never throw unhandled exceptions — always catch and write error status to D1
- Domain checker: DoH first, RDAP fallback, 'unknown' when both inconclusive — never guesses
- LLM director failure is non-fatal: pipeline continues with empty directions

---

## Cloudflare resources

- D1: `NAMEO_DB` → `nameo-db` (id: `4afe937a-4c9b-4cb1-bfad-64d8844ca26e`)
- Worker: `nameo-worker` (deployed from root wrangler.toml)
- Pages: `nameo-dev` project
- Legacy search-worker: still deployed, leave alone

**Wrangler secrets (set via `wrangler secret put`):**
- `ANTHROPIC_API_KEY` — Claude Haiku API key
- `STRIPE_SECRET_KEY` — Stripe secret (sk_live_... or sk_test_...)
- `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard webhook settings (whsec_...)

---

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy-worker.yml` | push to `main` touching `backend/worker/**` or `wrangler.toml` | Unit tests → deploy nameo-worker |
| `deploy-frontend.yml` | push to `main` touching `frontend/**` | Unit tests → deploy to Cloudflare Pages |

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`

---

## D1 schema migrations

After deploying for the first time (or on a clean reset):
```
wrangler d1 execute nameo-db --remote --file=backend/worker/schema.sql
```
This drops v1 tables and creates v2 tables. Safe to run on an empty DB.

---

## What NOT to do

- Do not add files or directories at the repo root except those listed above
- Do not hardcode API URLs in frontend — use `config.js`
- Do not implement Product 2 before Product 1 is validated
- Do not add auth (Clerk) before Product 1 is live and subscription demand exists
- Do not fake domain availability — return 'unknown' if both DoH and RDAP are inconclusive
- Do not await the sweep pipeline in the request handler — always use `ctx.waitUntil()`
