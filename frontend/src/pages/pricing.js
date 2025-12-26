export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <h1>Pricing</h1>
    <p class="sub">nameo.dev is still in early access. The main split we think about is between people doing quick, one-off checks and people doing deeper research for brands or launches. The details below are directional, not locked in.</p>

    <div class="plans">
      <div class="plan">
        <h3>Solo basics</h3>
        <p class="price">For individuals checking if a name is open</p>
        <ul>
          <li>Search across key social platforms with simple taken / available signals</li>
          <li>Lightweight local history and favorites for a single user</li>
          <li>A small number of saved explorations for personal or gaming brands</li>
        </ul>
        <a class="btn btn-primary" href="mailto:hello@nameo.dev?subject=Solo%20access">Join solo waitlist</a>
      </div>

      <div class="plan">
        <h3>Advanced research</h3>
        <p class="price">For launches, brand teams, and deeper naming work</p>
        <ul>
          <li>Richer availability data such as registration timelines where possible (future)</li>
          <li>Campaign-style organization for launches and multi-market projects</li>
          <li>Reports that summarize market penetration for shortlists of names (idea stage)</li>
          <li>Sharing and collaboration features for teams and clients (not built yet)</li>
        </ul>
        <a class="btn btn-primary" href="mailto:hello@nameo.dev?subject=Advanced%20research%20access">Talk about early access</a>
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
