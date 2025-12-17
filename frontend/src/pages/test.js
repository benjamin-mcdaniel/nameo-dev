export function Test() {
  const el = document.createElement('section')
  el.className = 'page test container'
  el.innerHTML = `
    <h1>Test page</h1>
    <p>Use this page while developing and testing new flows. The main home page already exposes the live name checker.</p>
    <p>
      Go back to <a href="#/">Home</a> to try the availability checker UI, or keep this tab open for experiments.
    </p>
  `
  return el
}
