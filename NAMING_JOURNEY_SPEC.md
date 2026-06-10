# Nameo — Naming Journey Spec
## Product vision, UX strategy, and QA review
*April 2026*

---

## QA Review: What's Here Now

### The core problem with current copy

The site is written for someone who already knows they need to check domains, trademarks, and social handles. The actual user doesn't know any of that yet. They have a name idea — or no idea at all — and a feeling that they should figure it out before they're too far in. They don't know:

- Why `.io` costs more than `.com` but tech companies keep using it
- Whether `nike.com` is a good domain for their SaaS (it's not, and they don't know why)
- Whether the X handle `@MyProduct` being taken matters if no one's posted in 3 years
- What TLD means. What a trademark conflict actually costs them.

The current home page starts with "Domains, trademarks, marketplace listings, app stores, and social handles" — every word there is jargon to this user.

### Specific bugs found

| File | Issue |
|---|---|
| `pricing.js` | Free tier CTA links to `#/campaigns` — archived route, should be `#/sessions/new` |
| `pricing.js` | Free tier lists "1 active project" — should be "session" not "project" |
| `pricing.js` | Tier features don't reflect what's actually built (everything is stubbed) |
| `home.js` | "Brand Research for Startups" eyebrow — accurate but cold, not inviting |
| `home.js` | "Two ways to work" section assumes user knows which path they want |
| `help.js` | No content explaining why domain choice matters at all |
| `help.js` | No answer to "what TLD should I pick?" — most common actual question |

### Copy grading

| Section | Grade | Issue |
|---|---|---|
| Hero headline | B | "Know if your name is really available" — transactional, skips the emotional entry point |
| Hero sub | C | Jumps straight to feature list, doesn't meet the user where they are |
| Platform pills | C | "Checks include" is a feature label. User doesn't know why these matter yet |
| Session types | B+ | "Research a name. Or generate one." is good — two clear paths |
| Features grid | B | Good descriptions, but lead with what user doesn't know they care about |
| How it works | B | Steps are accurate but written for someone who already bought in |
| Bottom CTA | B- | "Name your next product right" is fine but generic |

---

## User Story: How the Target User Thinks

**Who they are:**
A first-time founder or early employee at a startup. They have a product that is 60–80% real. They have a name they've been calling it internally. Maybe it's a placeholder. They're not sure. They know they need to "figure out the name thing" before they tell anyone outside the team.

**What they're thinking:**
1. "We've been calling it Stonewall internally. Is that a good name?"
2. "Should I get stonewall.com? Is .com still a thing? I keep seeing .io everywhere."
3. "Someone named StonewallSecurity is on Twitter but they haven't posted in 2 years. Does that matter?"
4. "There's a Stonewall historical thing. Is that a problem?"
5. "We might rename it anyway when we find product-market fit. Should I even bother locking down a name?"

**What they don't know:**
- That a domain check, trademark check, and social handle check are three completely different things
- That .com still conveys legitimacy and .io / .ai are "tech-coded" shortcuts when .com isn't available
- That a dead social account still "owns" the handle
- That registering your domain AND a few nearby variants is standard practice

**What they actually want:**
Not a feature list. They want to feel like someone understands their situation and has a clear path for them. They want to feel less stuck. They want to get out the door.

---

## The Naming Journey: Three Phases

The product vision is a **companion over time**, not a one-shot checker. Names grow and change as products mature. Phase one is getting unstuck. The end goal is a brand identity that can be tracked, defended, and evolved.

### Phase 1 — Build Your Name Profile (Word Cloud)

**What it is:**
An AI-led conversation that surfaces what the user actually cares about, then turns it into a voteable word cloud.

**Flow:**
1. User is prompted with open-ended questions:
   - "Tell me about your product. What does it do and who is it for?"
   - "What three words do you want people to feel when they hear your brand name?"
   - "What are you definitely trying to avoid?"
   - "Is there a company or brand name you've always liked? What about it?"
2. AI extracts meaningful words, themes, emotions, concepts
3. Word cloud is displayed — every extracted concept shown as a chip
4. User votes on each chip:
   - `++` Very important — this should define the name
   - `+`  Important / like it
   - ` `  Neutral (no vote = passes through without weight)
   - `-`  Not for me
   - `--` Actively avoid in naming
5. Profile is built from weighted votes
6. User can repeat this process — each round refines the profile

**UI pattern:**
Word chips in a responsive grid. Tap/click to cycle through states:
neutral → + → ++ → - → -- → neutral
Color coded: green shades for positive, red shades for negative, grey for neutral.
Bottom bar shows "profile strength" (% of chips voted on).

**Data model:**
```sql
naming_profile_words (
  session_id, word, weight INT(-2 to 2),
  source TEXT -- 'ai_extracted' | 'user_added'
)
```

**Key behavior:**
- Words are adaptive, not defining. The initial word cloud is a starting point.
- User can add their own words to the cloud
- Returning to this view and re-voting updates the profile — it's never locked
- The profile persists and can be used across multiple name-generation runs

---

### Phase 2 — Comparative Preference Questions

**What it is:**
A second layer of fast, gut-reaction questions. Not yes/no — the user picks which of two poles is closer to what they want.

**Format:**
Forced binary choice, presented quickly. The goal is speed and gut reaction, not deliberation.

**Example questions:**
- "More like: `Iron` or `Spark`?"
- "More like: `Vault` or `Breeze`?"
- "More like: `trustworthy institution` or `scrappy underdog`?"
- "More like: `sounds like what it does` or `sounds like nothing, totally fresh`?"
- "More like: `one real word` or `invented word`?"
- "More like: `long and memorable` or `short and punchy`?"

**Flow:**
- 8–12 questions, presented one at a time
- Large tap targets, fast transitions — built for mobile
- No back button on individual questions — just react
- Results weighted into the naming profile alongside Phase 1
- User can retake at any time

**Data model:**
```sql
naming_profile_comparatives (
  session_id, question_id, choice TEXT -- 'a' | 'b', timestamp
)
```

---

### Phase 3 — Name Generation + Availability

**What it is:**
The system generates root name candidates from the weighted profile, expands each into hundreds of derivatives, then sweeps them all against domain and social availability.

**Step 3a — Root Candidates:**
- 5–15 root name options generated (e.g., "Stonewall", "Ironveil", "Clearpath")
- User rates each: love / maybe / not for me
- Choosing "love it" or "maybe" unlocks derivative exploration for that root

**Step 3b — Derivative Generation:**
From a root like "Stonewall", generate:
- Direct variants: `stonewall`, `stonewalled`, `stonewalling`
- Prefix options: `thestonewall`, `teamstonewall`, `usestonewall`, `gostonewall`
- Suffix options: `stonewallhq`, `stonewallapp`, `stonewallco`
- Invented variants: `stonewallen`, `stonewallr`, `wallio`
- TLD combinations: `.com`, `.io`, `.ai`, `.co`, `.app`, `.dev`
- Full combinations across all of the above

This produces potentially hundreds or thousands of options per root.

**Step 3c — Availability Sweep:**
Each combination is checked for:
- **Domain available?** Is `stonewall.ai` registerable right now?
- **Near-match squat candidates** — domains the user should register to protect the brand (e.g., `stonewalls.com`, `getsonewall.com`)
- **Competitor proximity** — is `stonewall.com` an active product? Too close?
- **Social handles** — across X, Instagram, LinkedIn, YouTube, GitHub:
  - Direct: `@stonewall`
  - With prefixes: `@thestonewall`, `@teamstonewall`
  - With suffixes: `@stonewallhq`, `@stonewallofficial`, `@stonewallapp`

**Output — Name Package:**
A curated package for each shortlisted root:
- Primary domain recommendation
- Squat domain list (register these too)
- Best available social handle per platform
- Risk flags: competitor proximity, trademark signals, confusingly similar active brands

**Data model:**
```sql
name_candidates (
  session_id, root_name TEXT, score FLOAT, user_rating TEXT -- 'love'|'maybe'|'no'|null
)
name_derivatives (
  candidate_id, variant TEXT, type TEXT, -- 'domain'|'handle'|'squat'
  platform TEXT, status TEXT -- 'available'|'taken'|'unknown'
)
```

---

## Messaging Strategy

### Core positioning

**Not:** "A brand research tool for startups"
**Yes:** "Your naming companion — from first idea through launch and beyond."

This is not a tool you use once. It's a product that grows with your company.

### Voice

- Direct. No filler words.
- Knows the user is busy and a little intimidated.
- Doesn't condescend. Doesn't oversell.
- Plain language. "Domain" is fine. "TLD" is not (unless explained immediately).

### Key messages

1. **"You need a name. Not a degree."** — You don't need to understand how domain registrars work or what a trademark class means. We handle the research. You just need to know if you can have the name.

2. **"Get out the door today."** — This doesn't have to be your forever name. Get something real, get it protected, and get moving. You can always evolve it.

3. **"Your name should grow with your product."** — No product is exactly what it set out to be. Nameo tracks your options over time so you can evolve your brand identity as you learn.

4. **"We check everywhere it matters."** — Not just the domain. The trademark, the social handles, the app store, the thing your competitor named their product on Amazon.

### Domain education (for help docs and in-product tooltips)

**The .com question:**
`.com` still signals legitimacy — especially for B2B. If you can get it, get it. If you can't, `.io` is the accepted tech-startup alternative. `.ai` makes sense if AI is genuinely core to your product. `.co` works for consumer brands. Avoid obscure extensions (`.xyz`, `.info`) for your primary domain — they signal spam or a side project.

**The squatting question:**
Register your primary domain and at minimum: the `.com` if you chose a different extension, and a common misspelling. These are cheap — usually $10–15/year each — and protect you from someone parking them after you get press.

**The social handle question:**
A dormant account is still a taken handle. If `@YourName` is inactive, your options are: try a variation (`@YourNameHQ`, `@YourNameApp`), reach out to the account owner, or report it as abandoned to the platform. Pick a naming pattern and stay consistent across every platform.

---

## Implementation Priority

### Immediate — copy and bugs (no new features)
1. Rewrite home page with user-journey-first framing
2. Fix pricing.js (`#/campaigns` link, "project" language)
3. Add domain education content to help.js

### Short-term — Phase 1
1. Word cloud UI (chip components, voting state machine)
2. AI conversation intake (structured extraction from freeform answers)
3. Naming profile persistence

### Medium-term — Phase 2 + 3
1. Comparative questions flow
2. Root name generation from profile
3. Derivative generation engine
4. Availability sweep integration (domain + social)
5. Name package output view

### Long-term — tracking
1. Monitor name over time (is a competitor growing into your space?)
2. Track alternative candidates you didn't choose
3. Team sharing of sessions and name packages

---

*Living spec — update as features ship.*
