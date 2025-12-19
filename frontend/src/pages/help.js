export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <h1>Help</h1>
    <p>nameo.dev is a small tool for checking whether a name is available across a few major platforms and keeping track of ideas. This page explains how it works today and what is planned, without committing to timelines.</p>

    <h2>How it works right now</h2>
    <ul class="bullet-list">
      <li><strong>Search.</strong> Use the Search page to type a name and see basic availability results across the supported platforms.</li>
      <li><strong>Safety.</strong> We block obviously unsafe or offensive names before running checks to avoid hitting external services with them.</li>
      <li><strong>History & favorites.</strong> Recent searches and simple favorites are stored locally in your browser so you can come back to ideas.</li>
      <li><strong>Accounts.</strong> Logging in lets you save options into simple campaigns behind the scenes using Auth0 and a small database.</li>
    </ul>

    <h2>What campaigns mean (without promises)</h2>
    <p>Campaigns are a way to group a handful of naming options around a specific project. The current implementation is very light weight and may change. The general idea is:</p>
    <ul class="bullet-list">
      <li><strong>One place per project.</strong> Keep a few names together for a launch or product line.</li>
      <li><strong>Saved checks.</strong> Re-run or review which options looked promising without having to remember them all.</li>
      <li><strong>Future sharing.</strong> Longer term, the same structure could power links you share with teammates or clients.</li>
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
