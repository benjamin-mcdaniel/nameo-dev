export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <h1>Help</h1>
    <p>Getting started is simple: create an account in the portal and start generating names.</p>
    <h2>FAQ</h2>
    <details>
      <summary>Where do I access the tool?</summary>
      <p>Use the <a href="https://portal.nameo.dev" target="_blank" rel="noopener">portal</a>.</p>
    </details>
    <details>
      <summary>How do I get support?</summary>
      <p>Email <a href="mailto:support@nameo.dev">support@nameo.dev</a> or <a href="https://portal.nameo.dev/support/tickets" target="_blank" rel="noopener">submit a ticket</a> in the portal.</p>
    </details>
  `
  return el
}
