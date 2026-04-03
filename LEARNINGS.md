# Nameo — Learnings (v1 Social Handle Tool)

This document preserves how the original nameo.dev worked before the pivot to a startup brand research tool. It's a reference for patterns worth carrying forward.

---

## What the Product Was

A social media handle availability checker aimed at individuals — founders, creators, makers — who wanted to claim a consistent identity across platforms. You typed a name, it checked whether that handle was taken on X, Instagram, Facebook, YouTube, TikTok, LinkedIn, GitHub, Reddit, Medium, etc. It returned available/taken/unknown for each. It also suggested handle variations if your first choice was taken.

There was a secondary "advanced" workflow (stub-level) that was beginning to point toward startup use cases — comparing name candidates, generating reports — but it wasn't fleshed out.

---

## Architecture

### Frontend

- **Vanilla JS SPA** built with Vite. No framework (no React, no Vue).
- **Hash-based routing** via a hand-rolled router in `frontend/src/router.js`. Routes like `#/search`, `#/advanced`, `#/pricing`, etc.
- **Entry point**: `frontend/src/main.js` — mounts Header, main outlet, Footer, then delegates to the router.
- **Pages** (each a function returning a DOM element):
  - `home.js` — landing page
  - `search.js` — main search console (the workhorse page)
  - `advanced.js` — wizard stub: collected project type, description, seed, target surfaces
  - `advanced_report.js` — stub report page, loaded by report ID
  - `campaigns.js`, `pricing.js`, `features.js`, `help.js`, `login.js`, `terms.js`, `privacy.js`, `status.js`, `notfound.js`
- **Styles**: Three CSS files — `base.css` (resets/tokens), `theme.css` (colors), `layout.css` (components).
- **Build output**: `frontend/dist/` — a static bundle deployed to Cloudflare Pages.

### Backend — Two Cloudflare Workers

#### 1. `nameo-worker` (main API)
- Configured in root `wrangler.toml`.
- Entry: `backend/worker/index.js`.
- **Responsibilities**:
  - Auth0 JWT verification for protected routes.
  - Cloudflare D1 database access (users, campaigns, search history, advanced reports).
  - Calls the search orchestrator for name checks; falls back to local checks if it's down.
  - Turnstile (CAPTCHA) verification on the public `/api/check` endpoint.
- **Key endpoints**:
  - `GET /api/check?name=foo` — run availability checks for a name (public, Turnstile-protected)
  - `GET /api/suggestions?name=foo` — generate handle variations
  - `GET /api/health` — health check including orchestrator status
  - `GET /api/search-history` / `POST` / `DELETE` — per-user search history (auth required)
  - `GET /api/campaigns` / `POST` — user campaigns (auth required)
  - `POST /api/campaigns/:id/options` — add a name candidate to a campaign
  - `POST /api/options/:id/check` — run checks for a specific candidate
  - `GET /api/advanced-reports` / `POST` / `GET /:id` — advanced report storage (auth required)
  - `DELETE /api/account` — delete account (auth required)

#### 2. `nameo-search-worker` (orchestrator)
- Entry: `backend/search-worker/index.js`.
- **Responsibilities**:
  - Expose `/health` and `/v1/search-basic`.
  - Execute `url_status` checks from `config/services.json` and return normalized results.
  - Designed to grow into the home for heavier checks (domains, app stores, trademarks).
- The main worker calls this via a Cloudflare service binding (`SEARCH_ORCHESTRATOR`) and also via HTTP (`ORCHESTRATOR_URL` + `ORCHESTRATOR_TOKEN`). Falls back to local checks if orchestrator is down.

### Database — Cloudflare D1

Schema at `backend/db/schema.sql`. Tables:

| Table | Purpose |
|---|---|
| `users` | Auth0 sub as PK, email, tier (beta/free/standard/advanced), created_at |
| `campaigns` | Named collections of name candidates, owned by a user |
| `options` | Individual name candidates within a campaign |
| `option_checks` | Results of running checks against an option, stored as JSON |
| `advanced_reports` | JSON blobs for the advanced wizard flow |
| `search_history` | Per-user record of searches run |

Apply schema: `npx wrangler d1 execute nameo-db --file=backend/db/schema.sql`

### Auth — Auth0

- **Frontend SDK**: `@auth0/auth0-spa-js` — lazy-loaded, singleton client in `frontend/src/auth/client.js`.
- **Config**: `frontend/src/auth/config.js` — domain, clientId, audience, redirectUri.
- **Flow**: Auth0 redirect flow. On return, `handleAuthRedirectCallbackIfNeeded()` is called at app boot before first render, so the header always shows the right state on load.
- **Token handling**: Access tokens fetched silently (`getTokenSilently`), stored in `localStorage`, refreshed via refresh tokens.
- **Backend verification**: `backend/worker/index.js` uses `jose` to verify JWTs against Auth0's JWKS endpoint. The JWKS client is cached in worker memory.
- **Credentials** (non-secret, already in code):
  - Domain: `dev-17f30x2uvmivb8or.us.auth0.com`
  - Client ID: `JUnYcjxL8rqX7lMKscJZYmFCxteo8UON`
  - Audience: `https://nameo-api`
- **D1 user row**: On first authenticated request, the worker auto-creates a user row keyed by Auth0 `sub`. Tier defaults to `beta`.

### Deployment

- **Frontend**: Cloudflare Pages, deploying from `frontend/dist/`.
- **Workers**: `wrangler deploy` (root `wrangler.toml` for main worker, `backend/search-worker/wrangler.toml` for orchestrator).
- **Secrets** (set via Wrangler/dashboard, never committed): `ORCHESTRATOR_TOKEN`, `TURNSTILE_SECRET`.

---

## How Platform Checks Work

### The URL-status strategy

All 15 platforms used a simple HTTP probe:

1. Build URL from `config/services.json` template: e.g., `https://x.com/{name}` → `https://x.com/myhandle`.
2. Make a HEAD (or GET for some platforms) request.
3. Interpret status code:
   - `404` → `available`
   - `2xx` / `3xx` → `taken`
   - Anything else → `unknown`
4. Special cases: Instagram and Facebook return `200` even for non-existent profiles, with tell-tale body text. The worker reads the response body and checks for those strings.

### Services configured (v1)

X/Twitter, Instagram, Facebook, YouTube, TikTok, Pinterest, LinkedIn, GitHub, Reddit, Medium, Twitch, Product Hunt, Substack, Behance, Dribbble.

All defined in `config/services.json` with `strategy: "url_status"`.

### Name safety

`config/safety.json` defines `minLength`, `maxLength`, `allowedPattern`, and `bannedSubstrings`. The worker runs this check before any platform probe, plus a `leo-profanity` check. Returns structured error reasons (`empty`, `length`, `pattern`, `banned_substring`, `profanity`).

### Suggestions

`generateSuggestions()` in the main worker produces handle variations: prefixed with `the`, `real`, `its`; suffixed with `_`, `1`, `app`, `hq`, `official`. Each candidate is run through the safety check before being returned.

---

## Patterns Worth Carrying Forward

These are the parts of v1 that are well-built and should survive the pivot intact or with minimal changes:

1. **Auth layer** — The entire `frontend/src/auth/` module and the `verifyAuth0Token` / `getOrCreateUser` functions in the worker. Clean, correct, handles edge cases well.

2. **Two-worker split with fallback** — The pattern of a main worker that tries the orchestrator first and falls back to local checks is a good resilience pattern. The orchestrator is where to put heavier checks (domains, trademark APIs) as they come online.

3. **`runChecksForName` + `checkServiceAvailability`** — The abstraction is sound. The new product will need new check types (domain registrars, trademark APIs, app stores) but the pattern of a named strategy per service in a config file and a dispatcher in the worker is worth keeping.

4. **D1 schema foundation** — `users`, `campaigns`, `options`, `option_checks` map naturally to the startup use case. A campaign becomes a "product launch" project. Options become name candidates. `option_checks` already stores JSON blobs of results per candidate.

5. **Name safety pipeline** — Profanity filter + configurable rules is still needed. Keep as-is.

6. **Router pattern** — Simple hash router works fine for a SPA without SSR needs. No reason to change it.

7. **Cloudflare D1 + Workers + Pages stack** — Stays the same. No infra changes needed.

---

## What Was Dropped / Reset

- All frontend page copy and UI design (consumer-focused, social-handle language).
- The `search.js` page logic (still social-platform-centric).
- The `home.js` hero copy.
- The `campaigns.js` page (will be redesigned as a "launch project" concept).
- `config/services.json` will be updated to add domain/trademark/app store check types and reorganize social checks around what's relevant for product launches (LinkedIn company pages, App Store, etc.) rather than personal handles.
- The `advanced.js` wizard stub — concept survives but the form fields and framing change completely.
