export function Features() {
  const el = document.createElement('section')
  el.className = 'page features container'
  el.innerHTML = `
    <h1>What nameo.dev can do today</h1>
    <p class="sub">Were starting simple: one search to understand your "Everywhere Identity" across common platforms, with guided and advanced checks on the way.</p>

    <section class="features-section">
      <h2>Current features</h2>
      <ul class="bullet-list">
        <li><strong>Unified multi-platform checks.</strong> Type a name once and see availability across major social and creator platforms in a single view.</li>
        <li><strong>Simple, honest signals.</strong> We focus on clear <em>available</em> vs <em>taken</em> style results rather than over-complicated ratings.</li>
        <li><strong>Search history.</strong> Keep track of names youve explored. When you log in, recent searches are saved to your account so you can pick up on another device.</li>
        <li><strong>Suggestions.</strong> Get basic alternative ideas when your first choice is crowded, helping you iterate instead of getting stuck.</li>
        <li><strong>Status and transparency.</strong> A public status page shows when our checks are healthy and when specific platforms may need a refresh.</li>
      </ul>
    </section>

    <section class="features-section">
      <h2>Coming soon</h2>
      <ul class="bullet-list">
        <li><strong>Guided search flows.</strong> Step-by-step flows that help you move from rough ideas to a shortlist of strong, available names.</li>
        <li><strong>Advanced checks.</strong> Deeper coverage for domains, app stores, and basic trademark-style signals when the stakes are higher.</li>
        <li><strong>Smarter suggestions.</strong> Variations (prefixes, suffixes, creative spellings) that preserve the feel of your idea while opening up availability.</li>
        <li><strong>Campaigns & reports.</strong> Ways to compare multiple candidates and share clean summaries with co-founders or clients.</li>
      </ul>
      <p class="hint">If theres a feature you need for your launch, email <a href="mailto:support@nameo.dev">support@nameo.dev</a>  were actively shaping the roadmap.</p>
    </section>
  `
  return el
}
