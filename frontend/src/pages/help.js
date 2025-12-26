export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <h1>Help</h1>
    <p>nameo.dev is a small tool for checking whether a name is available across a few major platforms and keeping track of ideas. Most people fall into one of two buckets: quick solo checks, or deeper research for brands and launches. This page explains how it works today and what is being explored, without committing to timelines.</p>

    <h2>How it works right now</h2>
    <ul class="bullet-list">
      <li><strong>Solo checks.</strong> Use the Search page to type a name and see basic taken / not taken style availability across the supported platforms.</li>
      <li><strong>Safety.</strong> We block obviously unsafe or offensive names before running checks to avoid hitting external services with them.</li>
      <li><strong>History & favorites.</strong> Recent searches and simple favorites are stored locally in your browser so you can come back to a single stream of ideas.</li>
      <li><strong>Accounts.</strong> Logging in lets you save options into simple campaigns behind the scenes using Auth0 and a small database.</li>
    </ul>

    <h2>Solo vs advanced use (without promises)</h2>
    <p>Campaigns and future features are where the line between solo and advanced use shows up. The current implementation is very light weight and may change. The general idea is:</p>
    <ul class="bullet-list">
      <li><strong>Solo basics.</strong> An individual might only need one history of checks and a sense of whether a name is open for a single purpose.</li>
      <li><strong>Advanced research.</strong> Teams exploring names for launches or new brands might care about richer signals like when handles were registered or how widely a name is used in different markets (ideas, not built).</li>
      <li><strong>Future sharing.</strong> Longer term, the same structure could power reports or views you share in tools like chat or docs when comparing a shortlist.</li>
    </ul>

    <h2>Accounts, login, and data</h2>
    <p>Authentication is handled by Auth0. When you log in, we receive a minimal profile (for example, an email address and sometimes an avatar) that we can use to attach saved searches to you.</p>
    <ul class="bullet-list">
      <li><strong>Login.</strong> Use the Login page from the top navigation to sign in.</li>
      <li><strong>Logout.</strong> You can log out from the same Login page.</li>
      <li><strong>Delete account.</strong> There is an option on the Login page to delete your account and associated saved data. This is intended to keep things simple and reversible for you.</li>
    </ul>

    <h2>Support</h2>
    <p>If you run into issues or have ideas, you can always reach out. There is no formal support SLA, but feedback is welcome and helps shape the product.</p>
    <ul class="bullet-list">
      <li><strong>Email.</strong> Send questions or suggestions to <a href="mailto:support@nameo.dev">support@nameo.dev</a>.</li>
      <li><strong>Bug reports.</strong> Include the name you were searching and any console error messages if you can.</li>
    </ul>
  `
  return el
}
