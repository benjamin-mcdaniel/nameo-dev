export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1>Name your product in minutes.</h1>
        <p class="sub">A minimalist naming tool for founders and indie hackers.</p>
        <div class="actions">
          <a class="btn btn-primary" href="https://portal.nameo.dev" target="_blank" rel="noopener">Open Portal</a>
          <a class="btn" href="#/pricing">See Pricing</a>
        </div>
      </div>
    </section>

    <section class="features container">
      <div class="feature">
        <h3>Simple</h3>
        <p>Clean interface focused on results, not distractions.</p>
      </div>
      <div class="feature">
        <h3>Fast</h3>
        <p>Optimized suggestions with minimal latency.</p>
      </div>
      <div class="feature">
        <h3>Available</h3>
        <p>Check domain availability and social handle ideas.</p>
      </div>
    </section>
  `
  return el
}
