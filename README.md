# nameo.dev backend overview

## Workers

- **nameo-worker** (main API)
  - Handles `/api/check`, `/api/suggestions`, `/api/search-history`, `/api/campaigns`, `/api/health`, etc.
  - Owns Auth + D1 database access.
  - For availability checks it will call the search orchestrator when configured, and falls back to local checks.
- **nameo-search-worker** (search orchestrator)
  - Exposes `/health` and `/v1/search-basic`.
  - Executes `url_status` checks from `config/services.json` and returns a normalized `results` list.
  - In the future it will own "heavier" and more custom search logic; `nameo-worker` can call it via the `SEARCH_ORCHESTRATOR` binding.

## How availability checks work (current)

Availability checks are **best-effort HTTP fetches** (no headless browser rendering) and are classified using string signatures.

Key files:

- `config/services.json`
  - Source of truth for which services are checked.
  - Each service has:
    - `id`, `label`, `urlTemplate`
    - `strategy`: `url_status` or `coming_soon`
    - optional `method`: `GET` for services that require body text matching.

- `config/availability_signatures.json`
  - User-editable signatures used to classify a response as:
    - `available`
    - `taken`
    - `unknown`
  - Matching is case-insensitive substring search against:
    - final redirected URL
    - response body text (fetched with `GET` when needed)
  - Supports `{name}` placeholder.
  - Supports `global.taken` keywords.

Runtime:

- `backend/worker/index.js`
  - `/api/check` runs `runChecksForName`.
  - When the orchestrator is configured and healthy, it will use it.
  - Otherwise it falls back to local checks using the same signature-based classifier.

- `backend/search-worker/index.js`
  - `/v1/search-basic` runs `checkServiceAvailability` for all configured services.

## Known limitation: bot protection / JS-rendered pages

Many large platforms return `403` / `429` or a JS-only shell to server-side requests.
This repo intentionally treats those cases as `unknown`.

This is expected behavior and is why the project includes a debug mode + user-tunable signatures.

## Abuse / cost protection (rate limiting)

The public endpoints (`/api/check` and `/api/suggestions`) are intentionally accessible without login.
To prevent unattended cost surprises, the Worker enforces simple D1-backed caps:

- **Global daily cap** for `/api/check` and `/api/suggestions` (default: `5000`/day)
- **Per-IP daily cap** for `/api/check` and `/api/suggestions` (default: `5000`/day)

When a cap is exceeded, the Worker returns HTTP `429` with a `Retry-After` header.

Knobs (Cloudflare Worker env vars):

- `DAILY_CHECK_LIMIT` (or `RATE_LIMIT_DAILY_GLOBAL`)
  - Sets the global daily cap.
- `RATE_LIMIT_DAILY_IP`
  - Sets the per-IP daily cap.

Setting either value to `0` disables the endpoint (it will return `429`).

## Debug mode

- Backend: `/api/check?name=<name>&debug=1` will include per-service debug fields.
- Frontend: the Search page has a Debug checkbox (stored in `localStorage` as `nameo_debug`) that appends `debug=1` and displays:
  - HTTP `code`
  - which signature matched
  - whether body was fetched
  - final redirected URL link

## Deploy

Workers:

```bash
# search orchestrator
cd backend/search-worker
npx wrangler deploy

# main API worker
cd ../..
npx wrangler deploy
```

Frontend:

- Frontend is in `frontend/` and should be deployed via your preferred static hosting (Cloudflare Pages recommended).

## Parking / maintenance notes

If leaving this repo untouched for a while:

- Prefer updating only `config/availability_signatures.json` when platform copy changes.
- If a platform becomes consistently blocked, change its `strategy` in `config/services.json` to `coming_soon`.

## Current split: which worker does what

To keep it easy to see where a platform is handled as we grow:

- **Primary worker (`nameo-worker`)**
  - Handles `/api/check` and orchestrates searches.
  - Owns Auth, D1, campaigns, history, and account tiers.
  - Calls the search orchestrator for basic social availability checks when configured, and falls back to local checks if the orchestrator is down.
- **Search orchestrator worker (`nameo-search-worker`)**
  - Exposes `/health` and `/v1/search-basic`.
  - Executes the `url_status` strategy for all configured social platforms in `config/services.json` and returns a normalized `results` array.
  - Is designed to grow into the home for more complex, multi-step, or high-volume checks over time (domains, app stores, trademark lookups, adjacent-name search).
  - Per-platform adapters in clearly named files (for example `adapters/facebook.js`, `adapters/domains.js`) when we move that logic out of the primary.

As we migrate a platform from the primary worker to the orchestrator, we will:

1. Add an adapter module for that platform in `backend/search-worker/adapters/` with a clear filename (e.g. `facebook.js`).
2. Update the orchestrator to use that adapter for `/v1/search-basic`.
3. Update `nameo-worker` to treat the orchestrator result as the source of truth for that platform, while keeping the old `url_status` code as a fallback during rollout.

For now, availability checks for all configured `url_status` services use the same signature-based classifier (both in the orchestrator and as a local fallback). If a platform becomes consistently blocked or unstable, prefer marking it `coming_soon` in `config/services.json`.
