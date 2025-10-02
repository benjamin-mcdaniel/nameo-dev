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
   - Reserve `portal.nameo.dev` for the app later (separate project)

## Option B — GitHub Action (automated)
We include a workflow at `.github/workflows/cf-pages.yml`. To enable it:
- Add GitHub repository secrets:
  - `CF_API_TOKEN` (Pages write token)
  - `CF_ACCOUNT_ID`
  - `CF_PAGES_PROJECT` (e.g., `nameo-frontend`)
- Push to `main` to publish to production; PRs/branches publish to previews.

## Routing
- Hash-based router avoids special server config. A SPA fallback is still provided by `public/_redirects`.

## Security headers
- `public/_headers` sets basic security and cache headers for static assets.

## Analytics
- When you have a Cloudflare Web Analytics token, un-comment the script in `index.html` and insert your token.

## Verify after deploy
- Open `https://nameo.dev/#/` (Home)
- Check `#/help`, `#/login`, `#/pricing`, `#/privacy`, `#/terms`
- Test Portal links and support email link.
