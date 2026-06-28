# Nameo v3 — Repo Rules

---

## Repo structure

```
nameo-dev/
├── .github/workflows/
│   ├── deploy-worker.yml      # tests → deploy nameo-worker
│   ├── deploy-collector.yml   # deploy nameo-collector (DO)
│   └── deploy-frontend.yml    # build → deploy to CF Pages
├── frontend/                  # Astro SSR → Cloudflare Pages (nameo-dev)
├── worker/                    # Main API + MCP → Cloudflare Workers (nameo-worker)
├── collector/                 # Background indexer → Cloudflare Workers (nameo-collector)
├── config/
│   └── tld-strategies.json   # Per-TLD check method (doh or rdap)
├── schema.sql                 # D1 schema — run once on new DB
├── wrangler.toml              # Config for nameo-worker
├── wrangler.collector.toml    # Config for nameo-collector
└── CLAUDE.md                  # This file
```

**Hard rules:**
- `frontend/` only — anything the browser loads
- `worker/` only — API + MCP server code
- `collector/` only — background index builder
- Root only — git config, CLAUDE.md, wrangler configs, schema, config/
- Nothing else belongs at the root

---

## Product — what it is

Name finder for AI early adopter / pet projects. Two search modes:

- **Short**: randomly generated pronounceable strings ≤6 chars (≥1 vowel, no numbers, ≤2 consecutive same-type chars)
- **Brandable**: real English words and blends from a curated wordlist

Both modes draw from a pre-built index of domain-checked names. Results are delivered as snapshots saved to user history, not live queries.

---

## Worker (`worker/`)

- Entry: `worker/src/index.js`
- Routes:
  - `GET  /api/health`             — no auth
  - `POST /api/search`             — search index, save snapshot, burn 1 unit
  - `GET  /api/history`            — get saved snapshots
  - `GET  /api/name/:word`         — single name profile
  - `POST /api/refresh/:id`        — re-check snapshot, burn 1 unit
  - `POST /api/stripe/webhook`     — Stripe events → update user tier in D1
  - `POST /mcp`                    — MCP Streamable HTTP (4 tools, auth required)
- Lib: `worker/src/lib/`
  - `db.js`             — D1 helpers
  - `domainChecker.js`  — per-TLD check using tld-strategies.json
  - `nameGenerator.js`  — short name generation + validation
  - `resultFilter.js`   — tier-based filtering (free sees ceil(n/2), randomized)
  - `socialChecker.js`  — stub (returns unknown for all)
  - `conflictScorer.js` — stub (returns score 0)
  - `json.js`           — CORS + json() helper
- Tests: `worker/tests/unit/` — Vitest. Must pass before deploy.
- Deploy: wrangler.toml (main = worker/src/index.js)

---

## Collector (`collector/`)

- Entry: `collector/src/index.js`
- Durable Object: `NameCollector` — single global instance (`idFromName('global')`)
- State tracked in DO storage: `mode`, `cursor`, `wordlist_cursor`, `last_run`, `last_error`, `last_full_pass`
- Routes (internal): `/run`, `/status`, `/reset`
- Cron trigger: every 5 minutes
- Alternates between `shorts` and `brandable` modes each batch
- Only indexes words where ≥1 TLD is free
- Wordlist: `collector/src/lib/wordlist.js` — extend via KV key `wordlist` for production scale
- Deploy: wrangler.collector.toml

---

## Frontend (`frontend/`)

- Framework: Astro 5 + minimal vanilla JS. No React.
- Adapter: @astrojs/cloudflare (SSR mode)
- Auth: @clerk/astro — all routes require sign-in (middleware.ts)
- Entry pages:
  - `src/pages/index.astro`   — search (Short / Brandable toggle, stacking results)
  - `src/pages/history.astro` — saved snapshots, per-entry refresh button
- API client: `src/lib/api.js` — always uses `API_BASE` from `src/lib/config.js`
- Deploy: GitHub Actions → Cloudflare Pages (nameo-dev project)

---

## Cloudflare resources

- D1: `DB` → `nameo-db` (id: `4afe937a-4c9b-4cb1-bfad-64d8844ca26e`)
- Worker: `nameo-worker` (wrangler.toml)
- Worker: `nameo-collector` (wrangler.collector.toml)
- Pages: `nameo-dev` project

**Secrets needed:**

| Secret | Where | Purpose |
|---|---|---|
| `CLERK_SECRET_KEY` | nameo-worker | JWT verification |
| `CLERK_PUBLISHABLE_KEY` | nameo-worker | Clerk client init |
| `STRIPE_SECRET_KEY` | nameo-worker | Payments |
| `STRIPE_WEBHOOK_SECRET` | nameo-worker | Webhook verification |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | GitHub → frontend build | Clerk frontend |
| `CLOUDFLARE_API_TOKEN` | GitHub | Wrangler deploys |

**GitHub vars:**
- `PUBLIC_API_BASE` — the deployed worker URL (e.g. `https://nameo-worker.your-account.workers.dev`)

---

## Tiers

| | Free | Paid |
|---|---|---|
| Daily limit | 20 | 150 |
| Categories | short only | short + brandable |
| Data shown | name + TLDs (ceil 50%, randomized) | full (all TLDs + socials + conflict) |
| Refresh | 1 at a time, costs 1 unit | same |
| History | last 100 snapshots | last 100 snapshots |

---

## MCP server

Endpoint: `POST /mcp` — MCP Streamable HTTP transport (2024-11-05). Requires Clerk Bearer token.

Four tools: `search_names`, `get_name_profile`, `get_history`, `refresh_result`.

MCP client config example:
```json
{
  "mcpServers": {
    "nameo": {
      "url": "https://nameo-worker.your-account.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <clerk-session-token>" }
    }
  }
}
```

---

## What NOT to do

- Do not open MCP to the internet without auth — every /mcp call checks Clerk JWT
- Do not hardcode the worker URL in frontend — use config.js API_BASE
- Do not guess domain availability — return 'unknown' if check is inconclusive
- Do not add TLD fallback chains — each TLD has one defined strategy in tld-strategies.json
- Do not await the collector pipeline in the request path — always ctx.waitUntil()
- Do not implement social checking or conflict scoring until stub is explicitly replaced
- Do not add Product 2 (watch/defense sweep) until Product 1 is validated
