# Nameo UI/UX Review
_April 2026 — pre-launch readiness pass_

---

## Summary

The product is in solid shape for an early-access launch. The hierarchy and copy are clear, and the core flows work end-to-end. What follows is a prioritized list of issues to fix, organized by page and then tier: **fix now** (small, high-impact), **fix before growth** (noticeable friction), and **nice to have** (polish).

---

## Home (`#/`)

**Fix now**

- **Future promises as present facts.** The hero says Nameo "stays useful as your product grows" and step 3 says "Nameo tracks alternatives and flags when better options open up." Neither of those exist yet. Rewrite step 3 to describe what's actually there: run reports, see results, pick your name.
- **Both session type cards link to the same URL.** The "Generate name ideas →" and "Check a name →" buttons both go to `#/sessions/new` with no pre-selection. Since you already have the `?prefill` logic, you could route them to `#/sessions/new?type=name_generator` and `#/sessions/new?type=brand_identity` — a tiny change that removes one click for the user.

**Fix before growth**

- **The "Why naming is hard" grid has 10 cards.** That's a lot of content to scroll through before hitting the features section. Consider trimming to 6 or using a 2-column masonry layout so it doesn't feel like a wall. The best 6: domain taken, dormant Twitter handle, Amazon product, trademark conflict, squatted domain, rename later — those are the most resonant.
- **The CTA section copy is weak relative to the page.** "It doesn't have to be your forever name" is good but "Get out the door" as an eyebrow is a bit blunt. Consider "Get started" or "Start today" — same energy, less aggressive.

**Nice to have**

- The smooth-scroll "See how it works ↓" button targets an `id="how-it-works"` on the page — works fine, but there's no keyboard fallback if JS fails. Low risk, noted.

---

## Sessions list (`#/sessions`)

**Fix now**

- **The auth notice wipes the content area.** When a signed-out user lands here, the sessions content area becomes blank and only the warning banner appears. The banner is good, but the empty content area looks broken. Replace the blank area with a short "Sign in to see your sessions" message or the same empty-state component as the logged-in empty state.
- **No way to delete or rename a session from the list.** Not a blocker, but users who create test sessions during onboarding will accumulate clutter. A simple "⋯" menu per card with a delete option would help. Can be done post-launch.

**Fix before growth**

- **Session cards don't show the brand names being researched.** The card shows session name, type, report count, and date — but not what name was being checked. For a brand identity session named "Series A audit," it's unclear what it contains. Consider showing the first brand name(s) as a sub-label on the card.
- **"Loading sessions…" text has no spinner or visual cue.** The empty-state text works, but a skeleton card or simple spinner looks more polished and reduces perceived wait time.

---

## New session wizard (`#/sessions/new`)

**Fix now**

- **No visible validation error when "Continue →" is clicked with an empty session name.** The code correctly prevents progression and focuses the field, but there's no red text or inline message explaining why it didn't work. Add a `field-error` message below the input when the field is empty on submit attempt.
- **"Session name" label is confusing.** Users think of a "session" as a concept unique to Nameo — they don't know yet what they're naming. Rename the label to **"Research label"** or **"Save this session as"** with hint text like "For your own reference — e.g. 'Series A naming' or 'Product v2 ideas'."

**Fix before growth**

- **Step 2b (Name Generator) questionnaire is long.** It has session name, product description, industry, 6 vibe cards, 3 length radio options, start letters, and avoid words — all on one scroll. Consider making industry + vibes + length a condensed optional section under "Additional preferences (optional)" collapsed by default. Product description is the only thing truly required.
- **Step 1 type selection cards advance automatically on click** (good!) but the "Continue →" button is still below. The card click already updates state, so the button is needed — but visually it creates ambiguity: did my click register? Consider a brief visual confirmation on the selected card (it does toggle the `is-selected` class, which should show a check). Make sure the check mark is visible enough in the CSS.

**Nice to have**

- Step 3 review card shows brand names as a comma-separated value string. If a user entered 4 names that are long, this wraps awkwardly. A simple list format would be cleaner.

---

## Session detail (`#/session?id=...`)

**Fix now**

- **PDF button is invisible while reports are still running.** This is by design (only shows when all complete/error), but there's no hint that a PDF will be available when complete. Consider a greyed-out "↓ Export PDF" button with a tooltip "Available when all reports finish" so users know the feature exists.
- **"Re-run" buttons on errored reports lack feedback on what went wrong.** The button re-runs successfully, but the user never sees why it failed. Even a generic "Report failed — click to retry" note in the error card would help.

**Fix before growth**

- **Polling happens silently.** When reports are running, there's no "checking for updates…" indicator — the page just updates. Users sometimes think the page is frozen. A subtle "Checking for updates…" text or a spinning badge on the running report card would provide reassurance.
- **No "Run all pending" shortcut.** If a user adds report types later, they have to click "Run" on each one individually. A single "Run all pending" button would save clicks for users with 3–5 reports.

---

## Pricing (`#/pricing`)

**Fix now**

- **"Get Starter" and "Get Pro" CTAs go to `#/login`.** This is correct since payments aren't wired, but the login page has no context about why the user is there. The login page should accept a `?from=pricing` param and show "Sign in to get started with Starter" or similar. Low friction fix.
- **Free tier says "50 credits" but beta users see "∞" credits.** The pricing page and account page are inconsistent. Until billing is live, either remove the "50 credits" from the free tier description or add a note "During beta, credits are unlimited."

**Fix before growth**

- **Credit cost table is good but isolated.** Consider linking each row to the relevant help doc section so curious users can understand exactly what each check entails. e.g. "Trademark screening (US + EU)" → links to `#/help#doc-brand-identity`.

---

## Account (`#/account`)

**Fix now**

- **"Sign out" button location is awkward.** It's inserted dynamically *after* the session actions row, so it appears orphaned mid-page. Move it to the page header area or make it a clearly labelled standalone section. A lot of users will look for sign-out in the nav header first — make sure `header.js` surfaces it prominently when signed in (it does render a user menu, which is correct).
- **Delete account uses `window.confirm`.** This is a browser native dialog that looks out of place on a styled app. Replace with an inline confirmation: clicking "Delete my account" reveals a second row with a text input ("Type DELETE to confirm") and a red confirmation button. This also prevents accidental clicks.

**Fix before growth**

- **Credits remaining shows "—" for all non-beta tiers.** When billing is live this needs to show a real value. For now, the "—" is confusing — change it to "Unlimited (beta)" or hide the stat entirely.
- **"Sessions created" stat is shown but there's no link from the number to the sessions list.** Make the stat a link: clicking "7 sessions" navigates to `#/sessions`.

---

## Help (`#/help`)

**Fix now**

- **TODO comments are in the live HTML source.** Lines like `<!-- TODO: update with full TLD list... -->` are shipped to users via the built bundle. These need to either be removed or converted to real content before launch. Grep for `<!-- TODO` in help.js and remove all of them.

**Fix before growth**

- **The sidebar navigation (if present) should highlight the active section on scroll.** A sticky left nav with IntersectionObserver-based active highlighting is a standard docs pattern. Currently unclear if this is implemented.
- **No "Back to top" or persistent nav on mobile.** Long-form help pages need a way back up without excessive scrolling.

---

## Cross-cutting issues

| Issue | Where | Priority |
|---|---|---|
| No 404 / error page for invalid session IDs | Session detail | Fix now |
| `API_BASE` is hardcoded in every page file | All pages | Fix before growth — move to a shared `config.js` |
| `escHtml` / `escapeHtml` defined separately in sessions.js and session.js | sessions.js, session.js | Nice to have — consolidate into shared util |
| No "back" navigation when JS routing breaks (e.g. direct URL to hash route) | Router | Nice to have |
| Home page nav CTA says "Create a Report" but the sessions list CTA says "+ New Session" — inconsistent label for the same action | header.js, sessions.js | Fix now — pick one label |

---

## Recommended fix order

1. Remove `<!-- TODO` comments from `help.js`
2. Fix "Create a Report" vs "+ New Session" inconsistency — pick one
3. Add inline validation message to session name field in wizard
4. Rename "Session name" label to something more intuitive
5. Fix auth empty state on sessions list (not just a banner, show something in the content area)
6. Rewrite the "How it works" step 3 copy to not reference unbuilt features
7. `?type=` pre-selection routing from home page cards (2-line change in new-session.js)
8. Wire `?from=pricing` context to login page
9. Replace `window.confirm` on delete account with inline confirmation
10. Free/beta credit inconsistency — pick one message

---

_Build passes. 50 unit tests passing. PDF export works for Brand Identity sessions._
