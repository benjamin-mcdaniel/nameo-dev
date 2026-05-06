# Nameo — Design Document

Brand research tool for startups finding a name for their product.
Check everything that matters — domains, social handles, trademarks, marketplaces — in one session.

---

## User workflow

The entire product is one loop: **enter a name → get a report → decide**.
No account required to start. No multi-step wizard unless the user is generating names from scratch.

### Flow A — Check a name (primary)

```
Home  →  "Check a name"  →  Enter name(s)  →  Session runs  →  Results
```

1. **Home** — single CTA: "Check a name" or "Generate name ideas"
2. **New session** — one input: the name(s) to check. Optional: toggle which checks to run (all on by default). No other fields required.
3. **Session page** — results appear as they complete (domain in ~200ms, trademark in ~3s). Each check is a card: green/red/yellow. No drill-down until the user taps a card.
4. **Decision** — user sees at a glance what's clear, what's taken, what needs more research.

### Flow B — Generate name ideas

```
Home  →  "Generate name ideas"  →  Describe product  →  Session runs  →  Candidates + availability
```

1. **New session (name generator)** — one required field: describe what your product does. Optional: tone/vibe pills.
2. **Session page** — AI generates candidates, availability is checked in parallel. Same result cards.

### Navigation

- **/** — home (hero + how it works)
- **/#/sessions/new** — new session (both flows, selectable)
- **/#/session?id=** — session results
- **/#/sessions** — session history (auth required)
- **/#/account** — account settings (auth required)
- **/#/pricing** — pricing page
- **/#/help** — docs
- **/#/login** — sign in

Everything else is archived or does not exist. No `/advanced`, no `/campaigns`, no `/search`.

---

## Check types

Each check is a **runner** in `backend/worker/src/runners/`. Runners are independent, run in parallel, and write results back to D1 when done.

### 1. Social handles (`social_handles`)

Check username availability across platforms.

| Platform | Method | Status |
|---|---|---|
| GitHub | `api.github.com/users/{name}` — 404=available | ✅ Live |
| Reddit | `reddit.com/user/{name}/about.json` — 404=available | ✅ Live |
| X (Twitter) | `api.twitter.com/2/users/by/username/{name}` — needs `TWITTER_BEARER_TOKEN` | ⚠️ Needs API key |
| Instagram | Worker IPs blocked — no public API | 🔲 Stub (unknown) |
| TikTok | Worker IPs blocked | 🔲 Stub (unknown) |
| LinkedIn | Worker IPs blocked | 🔲 Stub (unknown) |
| YouTube | Worker IPs blocked | 🔲 Stub (unknown) |
| Facebook | Worker IPs blocked | 🔲 Stub (unknown) |
| Telegram | `t.me/{name}` — may be checkable | 🔲 Stub (unknown) |
| WhatsApp | No public username system | 🔲 Always unknown |

**Stub behavior:** blocked/unavailable platforms return `{ status: 'unknown', note: 'Cannot check from server' }`. The UI shows these clearly so users know to check manually — no fake data.

### 2. Domain availability (`domain_availability`)

Layered approach — try each method in order, use first successful result.

| Layer | Method | Covers |
|---|---|---|
| 1 | Cloudflare DoH (`1.1.1.1/dns-query`) | All TLDs — fast, always available |
| 2 | RDAP (`rdap.org/domain/{name}`) | Most gTLDs — richer data |
| 3 | Manual fallback | Mark unknown if both fail |

TLDs checked by default: `.com`, `.io`, `.ai`, `.co`, `.dev`, `.app`

**Stub behavior:** all TLDs unknown if both layers fail for a TLD.

### 3. Trademark screening (`trademark`)

Check for conflicts in US and EU trademark databases.

| Registry | Method | Status |
|---|---|---|
| USPTO (US) | `tsdrapi.uspto.gov` search | 🔲 Stub |
| EUIPO (EU) | `euipo.europa.eu` API | 🔲 Stub |

**Stub behavior:** returns `{ status: 'stub', checked_at }` — never returns fake clear/conflict signals.

### 4. Marketplace listings (`products_for_sale`)

Check if a product with this name is already selling on major marketplaces.

| Marketplace | Method | Status |
|---|---|---|
| Amazon | Autocomplete API (public) | ✅ Live (heuristic) |
| Walmart | Autocomplete API (public) | 🔲 Stub |

**Stub behavior:** Walmart returns empty result set with `stub: true`.

### 5. App store (`app_store`)

Check for name conflicts in iOS App Store and Google Play.

| Store | Method | Status |
|---|---|---|
| iOS App Store | iTunes search API (public) | ✅ Live |
| Google Play | No public API | 🔲 Stub (unknown) |

---

## Architecture

```
Browser (SPA on Cloudflare Pages)
    │
    │  REST API (JWT auth)
    ▼
nameo-worker  (Cloudflare Worker)
    ├── Auth: Auth0 JWT validation
    ├── Users: create/read (D1)
    ├── Sessions: create/read/list (D1)
    ├── Session reports: create/poll (D1)
    └── Runners (via ctx.waitUntil — parallel):
        ├── social_handles    → src/runners/social.js
        ├── domain_availability → src/runners/domains.js
        ├── trademark         → src/runners/trademark.js
        ├── products_for_sale → src/runners/products.js
        ├── app_store         → src/runners/app-store.js
        └── name_generator    → src/runners/name-generator.js

nameo-search-worker  (Cloudflare Worker — product orchestrator)
    ├── Health check
    └── Reserved for heavier orchestration (future: batch checks, caching layer)
```

**D1 tables (active):**
- `users` — Auth0 sub, email, tier
- `sessions` — session container (brand_identity or name_generator)
- `session_reports` — one row per check type, status pending→running→complete
- `subscriptions` — user tier and session allowance
- `token_transactions` — audit trail for AI token usage
- `rate_limits` — per-IP and global daily caps

---

## UX principles

1. **One action per screen.** The home page has one job: start a session. The session page has one job: show results.
2. **No required fields except the name.** Everything else is optional and hidden behind "+ More options".
3. **Results appear as they arrive.** Don't make users wait for the slowest check before showing anything.
4. **Honest about unknowns.** If a platform can't be checked, say so. Never show green when the answer is unknown.
5. **Sessions save everything.** Users can close the tab and come back. No work is lost.
6. **Auth is optional to start.** Anonymous users get one session. Auth unlocks history and higher limits.

---

## Build order

Phase 1 (current): check a name correctly
- [x] Session model in D1
- [x] Social handles (GitHub + Reddit live, others stubbed)
- [x] Domain availability (Cloudflare DoH)
- [x] App store (iTunes live, Google Play stubbed)
- [x] Marketplace (Amazon live, Walmart stubbed)
- [x] Trademark (stub)
- [ ] Social handles expanded to all 7 platforms
- [ ] Domain RDAP layer 2

Phase 2: generate a name
- [ ] Questionnaire runner
- [ ] Name candidates runner (Claude API)
- [ ] Availability sweep on generated candidates

Phase 3: grow
- [ ] Stripe payments
- [ ] Tier enforcement (session limits)
- [ ] Email notifications when slow checks complete
