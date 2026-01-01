export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <h1>Help</h1>
    <p>nameo.dev helps you understand where a name can realistically live across today&apos;s social and creator platforms. Most people fall into two buckets: quick solo checks, or deeper research for brands and launches. This page explains how it works today and what is being explored, without promising specific timelines.</p>

    <h2>How it works right now</h2>
    <ul class="bullet-list">
      <li><strong>Unified checks.</strong> Use the Search page to type a name once and see basic taken / available style signals across the supported platforms.</li>
      <li><strong>Safety.</strong> We block obviously unsafe or offensive names before running checks to avoid hitting external services with them.</li>
      <li><strong>History & favorites.</strong> If you are not logged in, recent searches and favorites are stored locally in your browser. When you log in, recent searches are also saved to a small database so you can see them again on another device.</li>
      <li><strong>Simple signals.</strong> Results focus on whether you can likely use a name, not on legal advice or exhaustive risk scoring.</li>
    </ul>

    <h2>Solo vs advanced use (without promises)</h2>
    <p>Future features are where the line between solo and advanced use shows up. The current implementation is intentionally light weight and may change. The general idea is:</p>
    <ul class="bullet-list">
      <li><strong>Solo basics.</strong> An individual might only need one history of checks and a sense of whether a name is open for a single purpose.</li>
      <li><strong>Advanced research (future).</strong> Teams exploring names for launches or new brands might care about richer signals like when handles were registered or how widely a name is used in different markets. These are ideas, not built features.</li>
      <li><strong>Future sharing.</strong> Longer term, the same structure could power simple reports or views you share in tools like chat or docs when comparing a shortlist.</li>
    </ul>

    <h2>Accounts, login, and data</h2>
    <p>Authentication is handled by Auth0. When you log in, we receive a minimal profile (for example, an email address and sometimes an avatar) that we can use to attach saved searches to you.</p>
    <ul class="bullet-list">
      <li><strong>Login.</strong> Use the account menu in the header to sign in with Auth0 when available.</li>
      <li><strong>Logout.</strong> You can log out from the same account menu.</li>
      <li><strong>Data stored.</strong> For logged-in users, we store a small amount of data: your profile (from Auth0) and a history of recent searches tied to your account.</li>
      <li><strong>Privacy.</strong> We do not front-run your ideas, sell your search data, or register domains or handles based on your searches.</li>
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
