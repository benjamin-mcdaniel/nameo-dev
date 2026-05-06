# Nameo

Brand research tool for startups finding a name for their product.
Check domains, social handles, trademarks, and marketplace listings in one session.

---

## Repo structure

```
nameo-dev/
├── frontend/             # Static SPA (Vite + vanilla JS) → Cloudflare Pages
├── backend/
│   ├── worker/           # Main API worker → Cloudflare Workers (nameo-worker)
│   └── search-worker/    # Product orchestrator → Cloudflare Workers (nameo-search-worker)
├── .github/workflows/    # CI/CD pipelines
├── wrangler.toml         # Cloudflare config for nameo-worker
├── CLAUDE.md             # Repo rules for AI tools
└── DESIGN.md             # Product design doc — user workflow, feature stubs, build order
```

See **CLAUDE.md** for structure rules and **DESIGN.md** for product goals and user workflow.

---

## Local development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Worker (from repo root)
cd backend/worker && npm install
npx wrangler dev
```

---

## Deploy

Push to `main`. GitHub Actions handles everything:
- `backend/**` or `wrangler.toml` changed → unit tests → deploy workers
- `frontend/**` changed → build → deploy to Cloudflare Pages

Requires GitHub secret: `CLOUDFLARE_API_TOKEN`

---

## Secrets (set via `wrangler secret put <NAME>`)

| Secret | Worker | Purpose |
|---|---|---|
| `ORCHESTRATOR_TOKEN` | both | Shared auth between nameo-worker and search-worker |
| `TWITTER_BEARER_TOKEN` | nameo-worker | X/Twitter handle checks |
| `ANTHROPIC_API_KEY` | nameo-worker | Name generator (phase 2) |
| `NTFY_TOPIC` | nameo-worker | Operator push alerts |

---

## First-time setup

1. Run `bash cleanup.sh` to remove legacy files, then delete `cleanup.sh`
2. Set secrets above via `wrangler secret put`
3. Push to `main` to trigger first deploy
4. Verify at `https://nameo-worker.benjamin-f-mcdaniel.workers.dev/health`
