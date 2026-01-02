# Cloudflare Pages Deployment (nameo.dev frontend)

This document describes how to deploy the static frontend in `frontend/` to Cloudflare Pages and configure DNS and branch mappings.

## Prereqs
- Cloudflare account with the `nameo.dev` zone added
- GitHub repository connected (this repo)

## Option A — Deploy via Cloudflare Pages UI (recommended to start)
1. Create project
   - Cloudflare Dashboard → Pages → Create a project → Connect to Git
   - Select this repo
2. Build settings
   - Project name: `nameo-frontend` (or your choice)
   - Framework preset: None
   - Root directory: `frontend/`
   - Build command: `npm run build`
   - Build output directory: `frontend/dist`
3. Environment variables
   - None required for MVP
4. Save and deploy
5. Branch mappings
   - Set Production branch: `main` (or your default branch)
   - Preview deployments: all other branches and PRs
6. DNS
   - After first successful deploy, add custom domain:
     - `nameo.dev` → bind to this Pages project
     - Optionally `www.nameo.dev` → set as redirect to apex (via Page Rule or DNS + `_redirects` in a separate tiny site)
     - Use `nameo.dev` as the primary app domain. No separate portal is required for MVP.

## Option B — GitHub Action (automated)
This repo does not include a GitHub Actions workflow for Pages deployment.

Cloudflare Pages deploys automatically via its Git integration (recommended).

## Routing
- Hash-based router avoids special server config. A SPA fallback is still provided by `public/_redirects`.

## Security headers
- `public/_headers` sets basic security and cache headers for static assets.

## Analytics
- When you have a Cloudflare Web Analytics token, un-comment the script in `index.html` and insert your token.

## Verify after deploy
- Open `https://nameo.dev/#/` (Home)
- Check `#/help`, `#/login`, `#/pricing`, `#/privacy`, `#/terms`, `#/test`
- Confirm the Home page name checker is calling the live Worker API.

---

## Backend Worker (API) Deployment

The API that powers name checking and suggestions lives in `backend/worker/` and is deployed as a Cloudflare Worker using Wrangler.

### Prereqs

- Cloudflare account (same as for Pages)
- `wrangler` CLI installed locally (via `npm i -g wrangler` or `npx wrangler`)

### Local development

From the repo root:

```bash
cd backend/worker
npm install          # install leo-profanity and deps (once)

cd ../..
npx wrangler dev    # runs the Worker locally
```

The default dev URL is:

- `http://127.0.0.1:8787/api/check?name=test`
- `http://127.0.0.1:8787/api/suggestions?name=test`

Auth is currently stubbed (all requests allowed) for MVP.

### Deploy Worker to Cloudflare

`wrangler.toml` in the repo root already points to `backend/worker/index.js`:

```toml
name = "nameo-worker"
main = "backend/worker/index.js"
compatibility_date = "2024-01-01"
```

From the repo root, log in and deploy:

```bash
npx wrangler login   # opens browser, authorize once
npx wrangler deploy  # builds and deploys the Worker
```

Wrangler will output a URL such as:

- `https://nameo-worker.<your-subdomain>.workers.dev`

You can test directly:

- `https://nameo-worker.<your-subdomain>.workers.dev/api/check?name=test`

### Environment variables (Auth0, later)

When you are ready to enforce Auth0:

```toml
[vars]
AUTH0_DOMAIN = "your-tenant.us.auth0.com"
AUTH0_AUDIENCE = "https://nameo-api"
```

Then update `verifyAuth0Token` in `backend/worker/index.js` to actually validate JWTs. For MVP, it is left as a stub.

---

## Wiring Frontend (Pages) to Backend (Worker)

For a minimal, working public site:

1. Deploy the frontend via Pages (see sections above).
2. Deploy the Worker via Wrangler (API endpoints under `*.workers.dev`).
3. Decide on your final domain strategy:
   - **Option A (MVP)**: Keep frontend on `nameo.dev` (Pages) and API on `nameo-worker.<sub>.workers.dev`.
     - In this case, update the frontend fetch URLs in `src/pages/home.js` to point to the Worker origin instead of `/api/...`.
   - **Option B (tighter integration, recommended later)**: Create a custom domain for the Worker (e.g. `api.nameo.dev`) via Cloudflare Workers → Custom Domains, then call `https://api.nameo.dev/api/...` from the frontend.

### Option A — Point frontend directly at workers.dev URL

In `frontend/src/pages/home.js`, change:

```js
fetchJson(`/api/check?name=${encodeURIComponent(name)}`)
```

to use the full Worker URL, for example:

```js
const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'
// then:
fetchJson(`${API_BASE}/api/check?name=${encodeURIComponent(name)}`)
```

This requires no extra Cloudflare config, just the Worker deployment.

### Option B — Custom domain for API (api.nameo.dev)

1. In Cloudflare Dashboard → Workers & Pages → Workers → select `nameo-worker`.
2. Add a **Custom Domain**, e.g. `api.nameo.dev`.
3. Cloudflare will create the necessary DNS record for you.
4. Update the frontend to call `https://api.nameo.dev/api/check?...` and `https://api.nameo.dev/api/suggestions?...`.

This keeps everything under the `nameo.dev` zone and avoids CORS / mixed-origin issues when you later add Auth.

### Quick verification checklist (public)

- Frontend (Pages) deployed and accessible at `https://nameo.dev/` (or your Pages preview URL).
- Worker deployed and responding at either:
  - `https://nameo-worker.<sub>.workers.dev/api/check?name=test`, or
  - `https://api.nameo.dev/api/check?name=test` if using a custom domain.
- Home page input successfully shows per-service availability and suggestions using the live Worker API.
