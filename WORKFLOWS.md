# Workflows (WIP)

This doc captures the current **advanced naming workflow stub** so you can pick it up on another machine.

## Front page entry

The home page now routes users into one of two paths:

- Basic path: `#/search`
- Advanced path: `#/advanced`

Implementation:

- `frontend/src/pages/home.js`

## Advanced workflow (stub)

### Pages / routes

- Wizard: `#/advanced`
  - File: `frontend/src/pages/advanced.js`
  - Collects:
    - `project_type` (startup/app/creator)
    - `description`
    - `seed`
    - `surfaces` (domain/x/instagram/facebook/youtube)
  - Creates an advanced report then navigates to:
    - `#/advanced-report?id=<reportId>`

- Report: `#/advanced-report?id=<id>`
  - File: `frontend/src/pages/advanced_report.js`
  - Loads report inputs, then renders **stub candidate names** + **stub availability** and **handle variation suggestions**.

### Storage behavior

The advanced workflow is designed to work in two modes:

- Logged in (preferred): store/load reports from the Worker API
- Anonymous (fallback): store/load from `localStorage`

Local storage keys:

- `nameo_advanced_report_<id>` -> JSON blob of report inputs (stub)

### Backend endpoints (stub)

These endpoints require Auth0 (same as campaigns/history).

- `POST /api/advanced-reports`
  - Creates a row in `advanced_reports`
  - Returns `{ id, created_at }`

- `GET /api/advanced-reports/:id`
  - Returns `{ report }`

Implementation:

- `backend/worker/index.js`

### Database schema

New table:

- `advanced_reports`
  - `id` (UUID)
  - `user_id` (Auth0 sub)
  - `report_json` (JSON blob)
  - `created_at` / `updated_at`

Schema:

- `backend/db/schema.sql`

Apply schema (cloud):

```bash
npx wrangler d1 execute nameo-db --file=backend/db/schema.sql
```

Apply schema (local):

```bash
npx wrangler d1 execute nameo-db --local --file=backend/db/schema.sql
```

## Intended product behavior (next steps)

The report is eventually meant to help a startup/business pick a **unified naming option** across:

- Domains (ex: `cloverapp.com`)
- Social handles (ex: `officialcloverapp` on Instagram/X)

Planned expansions:

- Real candidate generation (not hardcoded)
- Real availability checks for:
  - Domains (multiple TLDs)
  - Social handle variants
  - App store name collisions
  - Basic trademark signals
- A "Naming Campaign" that can contain multiple options and a final exported report
- UX polish:
  - multi-step wizard (stepper)
  - edit/iterate on candidates
  - export/share link
