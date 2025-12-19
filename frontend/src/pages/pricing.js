export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <h1>Pricing</h1>
    <p class="sub">nameo.dev is still in early access. Pricing and plans will evolve as we learn how people actually use the tool. Below is how we're thinking about it today.</p>

    <div class="plans">
      <div class="plan">
        <h3>Solo builder</h3>
        <p class="price">For founders and indie hackers</p>
        <ul>
          <li>Search across key social platforms</li>
          <li>Simple history and favorites</li>
          <li>Save a small number of naming explorations</li>
        </ul>
        <a class="btn btn-primary" href="mailto:hello@nameo.dev?subject=Solo%20access">Join solo waitlist</a>
      </div>

      <div class="plan">
        <h3>Team launch</h3>
        <p class="price">For small marketing and product teams</p>
        <ul>
          <li>Shared naming workspaces (planned)</li>
          <li>Campaign-style organization for launches</li>
          <li>Exportable summaries for decks and docs</li>
        </ul>
        <a class="btn btn-primary" href="mailto:hello@nameo.dev?subject=Team%20launch%20access">Talk about early access</a>
      </div>

      <div class="plan">
        <h3>Custom</h3>
        <p class="price">For agencies and larger teams</p>
        <ul>
          <li>Flexible limits and seats</li>
          <li>Workflow integrations (not built yet)</li>
          <li>Shared views you can send to clients</li>
        </ul>
        <a class="btn" href="mailto:hello@nameo.dev?subject=Custom%20plan">Email us</a>
      </div>
    </div>
  `
  return el
}
