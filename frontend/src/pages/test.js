import { getAccessToken } from '../auth/client.js'

export function Test() {
  const el = document.createElement('section')
  el.className = 'page test container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Dev</div>
      <h1>Test page</h1>
      <p>Internal development utilities.</p>
    </div>
    <div>
      <button id="btn-get-token" class="btn">Get access token</button>
      <pre id="token-output" style="margin-top:12px;font-size:0.8rem;background:var(--bg-subtle);padding:12px;border-radius:var(--radius-md);border:1px solid var(--border);overflow:auto;white-space:pre-wrap;word-break:break-all"></pre>
    </div>
  `

  const btn = el.querySelector('#btn-get-token')
  const out = el.querySelector('#token-output')
  if (btn && out) {
    btn.addEventListener('click', async () => {
      out.textContent = 'Fetching…'
      try {
        const token = await getAccessToken()
        out.textContent = token ? token : '(no token — not signed in)'
      } catch (err) {
        out.textContent = `Error: ${err.message}`
      }
    })
  }

  return el
}
