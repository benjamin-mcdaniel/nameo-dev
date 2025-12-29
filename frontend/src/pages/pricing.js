export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <h1>Pricing</h1>
    <p class="sub">nameo.dev is in beta. Right now everything is effectively free while we learn. Long term, we expect features to split into Free, Basic, and Advanced tiers like this (subject to change).</p>

    <div class="plans">
      <div class="plan">
        <h3>Free (beta)</h3>
        <p class="price">For anyone trying out simple checks</p>
        <ul>
          <li>Up to 25 searches per day during beta</li>
          <li>Basic taken / not taken style results across a core set of common platforms (X, Instagram, Facebook, YouTube, LinkedIn)</li>
          <li>Single stream of local history and favorites in your browser</li>
        </ul>
        <p class="price">Today, all users are effectively on this tier while we iterate and expand the list of platforms.</p>
      </div>

      <div class="plan">
        <h3>Basic</h3>
        <p class="price">For solo builders and side projects</p>
        <ul>
          <li>Up to 500 searches per day</li>
          <li>Taken / not taken plus an estimate of how long a handle has been in use where possible (future)</li>
          <li>Gentle guidance when a name looks crowded so you can adjust or pick an adjacent option</li>
          <li>Access to common platforms plus a growing set of niche and community destinations as we add them</li>
        </ul>
        <p class="price">Intended for individuals who want a bit more signal without full reports.</p>
      </div>

      <div class="plan">
        <h3>Advanced</h3>
        <p class="price">For startups, brand teams, and deeper research</p>
        <ul>
          <li>Unlimited searches (within reasonable fair use)</li>
          <li>Richer context on taken names, including age and basic saturation patterns where we can infer them (planned)</li>
          <li>Suggestions for adjacent names and new word combinations to help avoid collisions</li>
          <li>Exportable reports per name or per campaign that summarize options for teams and clients (idea stage)</li>
          <li>Full access to common, niche, and advanced-search areas such as domains, app stores, and basic trademark checks as those features come online</li>
        </ul>
        <p class="price">This is where more of the "help a business find a stable, distinct identity" features will land.</p>
      </div>
    </div>
  `
  return el
}
