export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <h1>Pricing</h1>
    <div class="plans">
      <div class="plan">
        <h3>Starter</h3>
        <p class="price">$5/mo</p>
        <ul>
          <li>Limited suggestions</li>
          <li>Basic checks</li>
        </ul>
        <a class="btn btn-primary" href="https://portal.nameo.dev/signup" target="_blank" rel="noopener">Get Started</a>
      </div>
      <div class="plan">
        <h3>Pro</h3>
        <p class="price">$15/mo</p>
        <ul>
          <li>Unlimited suggestions</li>
          <li>Advanced checks</li>
        </ul>
        <a class="btn btn-primary" href="https://portal.nameo.dev/signup" target="_blank" rel="noopener">Start Free Trial</a>
      </div>
    </div>
  `
  return el
}
