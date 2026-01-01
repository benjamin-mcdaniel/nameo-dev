export function Features() {
  const el = document.createElement('section')
  el.className = 'page features container'
  el.innerHTML = `
    <h1>What nameo.dev can do today</h1>
    <p class="sub">Were starting simple: fast checks across common platforms, with more guided search tools on the way.</p>

    <section class="features-section">
      <h2>Current features</h2>
      <ul class="bullet-list">
        <li><strong>Multi-platform handle checks.</strong> See if your name is available on major socials and creator platforms in one search.</li>
        <li><strong>Simple, honest results.</strong> We focus on taken vs available signals so you can quickly narrow down options.</li>
        <li><strong>Search history.</strong> Keep a lightweight history of the names youve explored to avoid repeating work.</li>
        <li><strong>Suggestions.</strong> Get basic alternative name ideas when your first choice is crowded.</li>
      </ul>
    </section>

    <section class="features-section">
      <h2>Coming soon</h2>
      <ul class="bullet-list">
        <li><strong>Guided search flows.</strong> Step-by-step guidance to help you ask better questions about your name and surface stronger options.</li>
        <li><strong>Niche and advanced checks.</strong> Deeper coverage for communities, domains, and app stores as we grow.</li>
        <li><strong>Campaigns & reports.</strong> Track multiple name candidates and share clean summaries with co-founders or clients.</li>
      </ul>
      <p class="hint">If theres a feature you need for your launch, reply to your beta invite or email support@nameo.dev  were actively shaping the roadmap.</p>
    </section>
  `
  return el
}
