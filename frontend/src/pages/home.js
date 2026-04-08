export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'

  el.innerHTML = `
    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero-inner container">
        <div class="eyebrow">Naming companion for startups</div>
        <h1>You need a name.<br>Not a degree.</h1>
        <p class="home-hero-sub">
          Most founders spend weeks stuck on naming — unsure if their idea is taken,
          whether .com still matters, or if a dead social account blocks them.
          Nameo gets you unstuck today, and stays useful as your product grows.
        </p>
        <div class="home-hero-actions">
          <a class="btn btn-primary btn-lg" href="#/sessions/new">Find my name</a>
          <a class="btn btn-lg" href="#how-it-works" data-scroll-to="how-it-works">See how it works ↓</a>
        </div>
        <p class="home-hero-note">Free to start &mdash; no credit card required</p>
      </div>
    </section>

    <!-- Where are you right now? -->
    <section class="home-entry">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">Where are you right now?</div>
          <h2>Start wherever you are.</h2>
          <p>You don't need to have figured anything out first. Both paths work from zero.</p>
        </div>
        <div class="session-type-showcase">
          <div class="stshow-card">
            <div class="stshow-icon">✨</div>
            <h3>I need a name</h3>
            <p>Start with a blank page. Tell us what your product does and how you want it to feel. We'll build a name profile from the conversation and generate original candidates — with availability already checked.</p>
            <div class="stshow-reports">
              <span class="report-type-chip">💬 Guided conversation</span>
              <span class="report-type-chip">🗂 Word profile</span>
              <span class="report-type-chip">✨ Name candidates</span>
              <span class="report-type-chip">🌐 Availability included</span>
            </div>
            <a class="btn btn-primary" href="#/sessions/new">Generate name ideas →</a>
          </div>
          <div class="stshow-card">
            <div class="stshow-icon">🔍</div>
            <h3>I have a name to check</h3>
            <p>Got a name you're already using — or a shortlist of options? Run it through the full suite: domains, trademarks, marketplace listings, app stores, and social handles. Know every risk before you commit.</p>
            <div class="stshow-reports">
              <span class="report-type-chip">🌐 Domains</span>
              <span class="report-type-chip">⚖️ Trademarks</span>
              <span class="report-type-chip">🛒 Marketplace listings</span>
              <span class="report-type-chip">📱 Social handles</span>
            </div>
            <a class="btn btn-primary" href="#/sessions/new">Check a name →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Why naming is hard -->
    <section class="home-why">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">Why naming is hard</div>
          <h2>It's not just one question. It's ten.</h2>
          <p>Every name you like probably raises five more questions you didn't know you had to answer.</p>
        </div>
        <div class="home-why-grid">
          <div class="why-card">
            <div class="why-q">"Is the domain taken?"</div>
            <div class="why-a">And if it is, does <em>.io</em> or <em>.ai</em> work instead? What does your choice say about your brand?</div>
          </div>
          <div class="why-card">
            <div class="why-q">"The Twitter handle exists but no one's posted."</div>
            <div class="why-a">Dormant accounts still own the handle. You have options — but you need to know them.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"There's a product on Amazon with a similar name."</div>
            <div class="why-a">Is that a problem? It depends on your category and how close the names actually are.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"Should I lock down multiple domains?"</div>
            <div class="why-a">Yes — at minimum your primary domain plus the <em>.com</em> if you chose something else. We'll tell you which ones matter.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"Is there a trademark conflict?"</div>
            <div class="why-a">Maybe. Trademark issues depend on industry class, not just whether the name exists somewhere.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"What if we rename later?"</div>
            <div class="why-a">Most companies do. Get a good-enough name out the door. Nameo helps you track better options as you grow.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"My name is taken on one platform but free everywhere else."</div>
            <div class="why-a">Consistency matters — but it's not always a dealbreaker. We show you exactly what's taken and what's open so you can decide.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"Someone's squatting the domain and wants $4,000."</div>
            <div class="why-a">Domain squatters are real. Sometimes the alt TLD is the smarter move — and sometimes it's worth paying. Context changes everything.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"My name is fine in English. What about other markets?"</div>
            <div class="why-a">Words that are neutral in one language can mean something very different in another. Worth a check before you print anything.</div>
          </div>
          <div class="why-card">
            <div class="why-q">"How do I know if the name is too close to a competitor?"</div>
            <div class="why-a">Exact matches are obvious. Confusingly similar is harder — it depends on your category, geography, and how loud they are. Nameo surfaces the overlap.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- What gets checked -->
    <section class="home-features">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">What gets checked</div>
          <h2>Every surface that matters for launch.</h2>
          <p>Most name checkers only look at one thing. Nameo runs every check that's going to come up when you talk to a lawyer, a co-founder, or an investor.</p>
        </div>
        <div class="home-features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Domain availability</h3>
            <p>Check .com, .io, .ai, .co, and more. See which extensions are open, which are taken, and which ones you should register to protect your brand even if they're not your primary.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚖️</div>
            <h3>Trademark screening</h3>
            <p>US and EU trademark checks to surface potential conflicts early — before you've spent money on a logo, a deck, or a legal filing. Results are a signal, not legal advice.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Marketplace listings</h3>
            <p>Amazon, eBay, and major marketplaces. Know if consumers searching your name will find someone else's product first.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Social handles</h3>
            <p>X, Instagram, LinkedIn, YouTube, GitHub — checked with common prefix and suffix variations so you know exactly what's available and what pattern to use across platforms.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>App store signals</h3>
            <p>iOS App Store and Google Play. Catch name collisions before your app review, not after.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Sessions that save your work</h3>
            <p>All your research is organized into sessions. Run checks across multiple candidates, compare them side by side, and pick up where you left off.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="home-how" id="how-it-works">
      <div class="container">
        <div class="home-how-header">
          <div class="eyebrow">How it works</div>
          <h2>Get unstuck. Then stay ahead.</h2>
          <p>Nameo is built for the whole naming journey — not just the first search.</p>
        </div>
        <div class="home-how-steps">
          <div class="how-step">
            <div class="how-step-num">1</div>
            <div class="how-step-body">
              <h3>Tell us what you're building</h3>
              <p>Answer a few questions about your product, your market, and how you want the brand to feel. No jargon required — just describe it like you would to a friend.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">2</div>
            <div class="how-step-body">
              <h3>Get names with availability built in</h3>
              <p>Nameo generates candidates and immediately checks domains, trademarks, and handles — so every option you see is one you can actually have.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">3</div>
            <div class="how-step-body">
              <h3>Lock it down, then keep watching</h3>
              <p>Register your name and the domains around it. Come back as your product evolves — Nameo tracks alternatives and flags when better options open up.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="home-cta">
      <div class="container">
        <div class="eyebrow">Get out the door</div>
        <h2>It doesn't have to be your forever name.</h2>
        <p>Good enough and protected beats perfect and paralyzed. Start today — you can always evolve it.</p>
        <div class="actions">
          <a class="btn btn-primary btn-lg" href="#/sessions/new">Start finding my name</a>
          <a class="btn btn-lg" href="#/pricing">See pricing</a>
        </div>
      </div>
    </section>
  `

  // Smooth-scroll "How it works" button
  el.querySelector('[data-scroll-to]')?.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById('how-it-works')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  return el
}
