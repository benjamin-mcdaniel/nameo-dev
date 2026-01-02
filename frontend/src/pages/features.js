export function Features() {
  const el = document.createElement('section')
  el.className = 'page features container'
  el.innerHTML = `
    <h1>Use case</h1>
    <p class="sub">Nameo helps you go from an idea in your head to a name you can actually use across domains and social platforms. The goal is not to overwhelm you with stats - it is to help you make a confident decision.</p>

    <section class="features-section">
      <h2>Use case 1: quick checks while brainstorming</h2>
      <p>When you are exploring ideas, you want fast answers and low friction.</p>
      <ul class="bullet-list">
        <li><strong>Start with a seed.</strong> Type a name and instantly see basic availability across common platforms.</li>
        <li><strong>Iterate quickly.</strong> Use suggestions and history to move through ideas without losing momentum.</li>
        <li><strong>Shortlist.</strong> Save the few names that feel right before you do deeper work.</li>
      </ul>
      <div class="actions-inline">
        <a class="btn btn-primary" href="#/search">Run a basic search</a>
      </div>
    </section>

    <section class="features-section">
      <h2>Use case 2: aligning a real brand (startup or business)</h2>
      <p>When you are launching something real, the problem is usually not "find a cool word" - it is "find a name you can own everywhere".</p>
      <ul class="bullet-list">
        <li><strong>One identity across surfaces.</strong> A workable domain plus handle patterns that can match across X, Instagram, and more.</li>
        <li><strong>Tradeoffs made obvious.</strong> Sometimes <code>cloverapp.com</code> is available but the handle requires <code>officialcloverapp</code>. A report should make that clear.</li>
        <li><strong>Multiple options.</strong> A naming campaign usually ends with a few viable choices, not just one.</li>
      </ul>
      <div class="actions-inline">
        <a class="btn btn-primary" href="#/advanced">Start an advanced workflow</a>
      </div>
    </section>

    <section class="features-section">
      <h2>Use case 3: agencies and teams (future)</h2>
      <p class="hint">As workflows mature, the same structure can support teams comparing shortlists with clients.</p>
      <ul class="bullet-list">
        <li><strong>Report exports.</strong> A clean summary you can share in a deck or doc.</li>
        <li><strong>Repeatable process.</strong> A consistent set of questions and surfaces checked every time.</li>
        <li><strong>Higher limits.</strong> More searches and more platforms when the work is ongoing.</li>
      </ul>
    </section>

    <section class="features-section">
      <h2>Product principles</h2>
      <ul class="bullet-list">
        <li><strong>Honest signals.</strong> We focus on best-effort availability checks, not legal advice.</li>
        <li><strong>Guidance over noise.</strong> The product should reduce decision fatigue, not create it.</li>
        <li><strong>Privacy-first.</strong> Your naming ideas are not sold or used to front-run domains/handles.</li>
      </ul>
    </section>
  `
  return el
}
