// ─── DOCS UPDATE NOTE ────────────────────────────────────────────────────────
// This help page is a living outline of what the documentation should cover.
// Each section marked [TODO: update when live] needs real content once the
// corresponding feature is shipped. See memory file: project_docs_plan.md
// ─────────────────────────────────────────────────────────────────────────────

export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Documentation</div>
      <h1>Nameo docs</h1>
      <p>How to research and generate product names with Nameo — built for startups.</p>
    </div>

    <div class="content-with-sidebar">
      <div class="help-body">

        <!-- ── Overview ─────────────────────────────────────────────────── -->
        <div class="help-section" id="doc-overview">
          <h2>What is Nameo?</h2>
          <p>Nameo is a brand research tool for startups naming a new product. It gives you two core workflows:</p>
          <div class="help-workflow-cards">
            <div class="help-workflow-card">
              <div class="hwc-icon">🔍</div>
              <div>
                <strong>Brand Identity Report</strong>
                <p>Research an existing or candidate name across domains, trademarks, marketplace listings, app stores, and social handles. Know what you're up against before you commit.</p>
              </div>
            </div>
            <div class="help-workflow-card">
              <div class="hwc-icon">✨</div>
              <div>
                <strong>Name Generator</strong>
                <p>Answer a short set of questions about your product, brand personality, and style preferences. Nameo builds a weighted profile and generates original name candidates for you to explore.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Sessions ──────────────────────────────────────────────────── -->
        <div class="help-section" id="doc-sessions">
          <h2>Sessions</h2>
          <p>A <strong>session</strong> is the top-level container for a naming research campaign. Every session is either a Brand Identity Report or a Name Generator. Sessions are private to your account and persist over time so you can pick up where you left off.</p>
          <p>To create a session, click <strong>+ Create a Report</strong> in the top navigation, or go to <a href="#/sessions">My Sessions</a> and click the button there.</p>

          <div class="help-note">
            <strong>Sign in required.</strong> Sessions are tied to your account. You'll need to sign in to create or access sessions.
          </div>
        </div>

        <!-- ── Brand Identity Report ──────────────────────────────────────── -->
        <div class="help-section" id="doc-brand-identity">
          <h2>Brand Identity Report</h2>
          <p>Use this when you already have a name (or a shortlist) and need to understand the competitive landscape before committing.</p>

          <h3>Setting up</h3>
          <p>During session setup you enter up to 5 name candidates and select which report types to run. You can run all of them or just the checks most relevant to your situation.</p>

          <h3>Report types</h3>
          <div class="help-report-list">
            <div class="help-report-row">
              <span class="report-type-chip">🌐 Domain Availability</span>
              <p>Checks .com, .io, .ai, .co, .app, .dev, and more. Results show which TLDs are registerable for each of your name candidates.</p>
              <!-- TODO: update with full TLD list and registration link integration when live -->
            </div>
            <div class="help-report-row">
              <span class="report-type-chip">⚖️ Trademark Check</span>
              <p>Screens US (USPTO) and EU (EUIPO) trademark databases for active registrations that could conflict with your name. Results are a signal, not legal advice.</p>
              <!-- TODO: add detail on exact classification logic and confidence scoring when live -->
            </div>
            <div class="help-report-row">
              <span class="report-type-chip">🛒 Products for Sale</span>
              <p>Searches Amazon, eBay, and major marketplaces for existing products using your name. Helps you understand whether consumers will find a competitor when they search.</p>
              <!-- TODO: update with full marketplace list and conflict scoring when live -->
            </div>
            <div class="help-report-row">
              <span class="report-type-chip">📱 Social Handles</span>
              <p>Checks availability on X/Twitter, Instagram, LinkedIn, YouTube, and GitHub. A 404 response indicates the handle is likely available.</p>
              <!-- TODO: add detail on check methodology and edge cases when live -->
            </div>
            <div class="help-report-row">
              <span class="report-type-chip">📦 App Store</span>
              <p>Checks iOS App Store and Google Play for existing apps that share your name. Reduces the risk of confusion in app store search results at launch.</p>
              <!-- TODO: add detail on match scoring (exact vs. partial) when live -->
            </div>
          </div>
        </div>

        <!-- ── Name Generator ─────────────────────────────────────────────── -->
        <div class="help-section" id="doc-name-generator">
          <h2>Name Generator</h2>
          <p>Use this when you're starting from scratch and need original name ideas tailored to your product and brand.</p>

          <h3>The questionnaire</h3>
          <p>The generator works by building a <strong>weighted preference matrix</strong> from your answers. The questions cover:</p>
          <ul class="help-list">
            <li><strong>Product description</strong> — what your product does and who it's for</li>
            <li><strong>Industry / category</strong> — the market context your name lives in</li>
            <li><strong>Brand personality (vibes)</strong> — up to 3 from: Technical, Friendly, Premium, Playful, Minimal, Bold</li>
            <li><strong>Name length</strong> — short (1–5 chars), medium (6–9), or no preference</li>
            <li><strong>Preferred starting sounds</strong> — letters or phonemes you like (optional)</li>
            <li><strong>Words or sounds to avoid</strong> — anything that feels off-brand (optional)</li>
          </ul>

          <h3>Name candidates</h3>
          <p>Once the questionnaire is submitted, Nameo generates a ranked list of original name candidates based on your weighted profile. Each candidate includes availability signals so you can immediately shortlist the strongest options.</p>
          <!-- TODO: update with scoring breakdown, candidate count, and re-generation options when live -->

          <div class="help-note">
            <strong>Coming soon.</strong> The name generation engine is in active development. Questionnaire responses are saved now so your preferences are ready when the generator launches.
          </div>
        </div>

        <!-- ── Reading results ────────────────────────────────────────────── -->
        <div class="help-section" id="doc-results">
          <h2>Reading your results</h2>
          <!-- TODO: fill this section with annotated screenshots and result interpretation guide when report UI is live -->
          <p>Each report has a status chip:</p>
          <div class="help-status-chips">
            <span><span class="badge badge-pending">Pending</span> — the report is queued but hasn't run yet.</span>
            <span><span class="badge badge-running">Running…</span> — checks are in progress.</span>
            <span><span class="badge badge-complete">Complete</span> — results are ready to view.</span>
            <span><span class="badge badge-error">Error</span> — something went wrong; you can re-run the report.</span>
          </div>
          <p style="margin-top:16px">Click <strong>View report</strong> on any completed report card to see the full breakdown. Results are surfaced with traffic-light indicators: green means available or low risk, red means taken or a likely conflict, grey means inconclusive.</p>
          <!-- TODO: update with exact indicator definitions and export/share instructions when live -->
        </div>

        <!-- ── Account & privacy ──────────────────────────────────────────── -->
        <div class="help-section" id="doc-account">
          <h2>Account &amp; privacy</h2>
          <p>Nameo uses Auth0 for secure sign-in. You can sign in with Google or email. Your sessions and reports are tied to your account and are never shared with other users.</p>
          <p>To delete your account and all associated data, go to your account settings after signing in.</p>
          <!-- TODO: add link to account page and data export option when built -->
        </div>

        <!-- ── FAQ ───────────────────────────────────────────────────────── -->
        <div class="help-section" id="doc-faq">
          <h2>FAQ</h2>
          <div class="help-faq">
            <details class="faq-item">
              <summary>Is the trademark check legal advice?</summary>
              <p>No. Nameo's trademark results are informational signals only. Always consult a trademark attorney before filing or making decisions based on trademark availability. Results may be incomplete or delayed relative to official databases.</p>
            </details>
            <details class="faq-item">
              <summary>How fresh are the results?</summary>
              <p>Domain and social checks are run live at the time you trigger the report. Trademark and marketplace data may be indexed on a delay. Re-run any report to get the most current results.</p>
              <!-- TODO: add specific cache/freshness windows per report type when defined -->
            </details>
            <details class="faq-item">
              <summary>Can I check the same name in multiple sessions?</summary>
              <p>Yes. Sessions are independent — you can run the same name through a Brand Identity Report in multiple sessions or compare it against different candidates across sessions.</p>
            </details>
            <details class="faq-item">
              <summary>How many name candidates can I include in one session?</summary>
              <p>Up to 5 candidates per Brand Identity Report session. The Name Generator produces its own candidate list based on your preferences.</p>
              <!-- TODO: update limits based on final pricing tiers -->
            </details>
            <details class="faq-item">
              <summary>What happens to my data if I delete my account?</summary>
              <p>Deleting your account permanently removes all your sessions, reports, and associated data from our database. This action cannot be undone.</p>
            </details>
          </div>
        </div>

        <!-- ── Contact ───────────────────────────────────────────────────── -->
        <div class="help-section" id="doc-contact">
          <h2>Need help?</h2>
          <p>Questions, feedback, or found a bug? Reach out at <a href="mailto:hello@nameo.dev">hello@nameo.dev</a>.</p>
        </div>

      </div>

      <!-- Sidebar -->
      <div class="help-sidebar">
        <div class="card-subtle help-sidebar-inner">
          <div class="help-sidebar-label">On this page</div>
          <nav class="help-toc">
            <a href="#doc-overview">What is Nameo?</a>
            <a href="#doc-sessions">Sessions</a>
            <a href="#doc-brand-identity">Brand Identity Report</a>
            <a href="#doc-name-generator">Name Generator</a>
            <a href="#doc-results">Reading results</a>
            <a href="#doc-account">Account &amp; privacy</a>
            <a href="#doc-faq">FAQ</a>
            <a href="#doc-contact">Contact</a>
          </nav>
          <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:16px;display:flex;flex-direction:column;gap:6px">
            <a href="#/sessions/new" class="btn btn-primary btn-sm" style="justify-content:center">+ Create a Report</a>
            <a href="#/sessions" class="btn btn-sm" style="justify-content:flex-start">My Sessions</a>
            <a href="#/pricing" class="btn btn-sm" style="justify-content:flex-start">Pricing</a>
            <a href="#/status" class="btn btn-sm" style="justify-content:flex-start">System Status</a>
          </div>
        </div>
      </div>
    </div>
  `

  // Smooth-scroll TOC links (same-page anchors within the SPA)
  el.querySelectorAll('.help-toc a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('#doc-')) {
        e.preventDefault()
        const target = el.querySelector(href)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })

  return el
}
