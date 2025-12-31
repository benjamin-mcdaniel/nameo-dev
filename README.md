# nameo.dev backend overview

## Workers

- **nameo-worker** (main API)
  - Handles `/api/check`, `/api/suggestions`, `/api/search-history`, `/api/campaigns`, `/api/health`, etc.
  - Owns Auth + D1 database access.
  - Today it performs all platform checks itself using `config/services.json`.
- **nameo-search-worker** (search orchestrator stub)
  - Exposes `/health` and `/v1/search-basic`.
  - Right now `/v1/search-basic` is a stub that returns an empty `results` list.
  - In the future it will own "heavier" and more custom search logic; `nameo-worker` will call it via the `SEARCH_ORCHESTRATOR` binding.

## How Facebook and Instagram checks work (today)

Facebook and Instagram are both checked entirely in the **main worker** using a simple URL status strategy.

- **Config:** `config/services.json`
  - Facebook entry:
    - `id: "facebook"`
    - `label: "Facebook"`
    - `strategy: "url_status"`
    - `urlTemplate: "https://www.facebook.com/{name}"`
  - Instagram entry:
    - `id: "instagram"`
    - `label: "Instagram"`
    - `strategy: "url_status"`
    - `urlTemplate: "https://www.instagram.com/{name}/"`
- **Runtime:** `backend/worker/index.js`
  - The worker loads the services list and calls `checkServiceAvailability(service, name)` for each:
    - Builds `urlTemplate` by replacing `{name}`.
    - Performs an HTTP request (default `HEAD`, or a per-service `method` override).
    - Interprets status codes:
      - `404` → `status: "available"` (handle not found).
      - Any `2xx` or `3xx` → `status: "taken"` (something exists at that URL).
      - Anything else → `status: "unknown"` (we keep the `code` for debugging).
  - Results are returned as part of `/api/check` in the `results` array.

This means **Facebook and Instagram checks run completely inside `nameo-worker`** today. The orchestrator / second worker is not involved yet.

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

For now, **Facebook stays in the primary worker** using the URL-based check described above. When we eventually move it, this README will be updated to note which worker owns the Facebook logic and the adapter filename.
