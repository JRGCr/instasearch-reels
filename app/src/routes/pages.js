// Public pages: landing, privacy policy, data-deletion instructions, terms.
// These satisfy Meta App Review compliance requirements AND explain the product.

import { html, layout, esc } from "../lib/html.js";
import { PRODUCT_NAME, PRODUCT_TAGLINE, CONTACT_EMAIL } from "../lib/config.js";

export function landing(req, env, url, user) {
  const cta = user
    ? `<a class="btn" href="/app">Open dashboard</a>`
    : `<a class="btn fb" href="/auth/login">Continue with Facebook</a>`;
  const body = `
  <div class="hero">
    <span class="eyebrow">📈 Instagram competitive intelligence</span>
    <h1>${PRODUCT_NAME}</h1>
    <p class="muted" style="font-size:19px;max-width:620px;margin:0 auto 26px">${esc(PRODUCT_TAGLINE)}.
    Track public Instagram business & creator accounts, benchmark their reach and engagement,
    and watch how their content strategy evolves — powered by Instagram's official Graph API.</p>
    ${cta}
  </div>
  <div class="wrap">
    <div class="grid">
      <div class="card"><h3>📊 Benchmark competitors</h3><p class="muted">Add any public professional
        account and see followers, post volume, and engagement side by side.</p></div>
      <div class="card"><h3>📈 Track growth over time</h3><p class="muted">Every refresh saves a snapshot,
        so you get real follower and posting trends — not just a one-time number.</p></div>
      <div class="card"><h3>🎬 Study top content</h3><p class="muted">Browse each account's recent posts
        and reels ranked by likes and comments to learn what's working.</p></div>
    </div>
    <div class="card">
      <h3>How it works</h3>
      <ol class="muted">
        <li>Sign in with Facebook and connect the Instagram professional account you manage.</li>
        <li>Add the public business/creator accounts you want to benchmark.</li>
        <li>${PRODUCT_NAME} calls the Instagram Graph API <code>business_discovery</code> endpoint to
            fetch public profile metrics and recent media, and stores snapshots so you can see trends.</li>
      </ol>
      <p class="muted">${PRODUCT_NAME} only reads <strong>public</strong> data on
      <strong>professional</strong> (business/creator) accounts, exactly as Meta's API permits.
      It never accesses private accounts or private data.</p>
    </div>
  </div>`;
  return html(layout({ title: "Competitive intelligence for Instagram", body, user }));
}

export function privacy(req, env, url, user) {
  const body = `<div class="wrap"><div class="card">
    <h1>Privacy Policy</h1>
    <p class="muted">Last updated: 2026-07-06</p>

    <h3>Who we are</h3>
    <p>${PRODUCT_NAME} (${esc(PRODUCT_TAGLINE)}) is operated by CodeSamur.ai. Contact:
       <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

    <h3>What we access</h3>
    <p>When you sign in with Facebook, we request permission to read your connected Instagram
       professional account and to use the Instagram Graph API's <code>business_discovery</code>
       feature. We use this to:</p>
    <ul>
      <li>identify the Instagram professional account you manage (your account id and username), and</li>
      <li>retrieve <strong>public</strong> profile metrics and public media for the public
          business/creator accounts <em>you choose to track</em>.</li>
    </ul>
    <p>We do <strong>not</strong> access private accounts, private posts, direct messages, or any
       data Meta does not expose publicly through <code>business_discovery</code>.</p>

    <h3>What we store</h3>
    <ul>
      <li>Your Instagram account id and display name (to scope your data to you).</li>
      <li>An access token, stored server-side only, used to make API calls on your behalf.</li>
      <li>The list of public accounts you track, plus periodic snapshots of their public metrics
          and public media, so we can show you trends over time.</li>
    </ul>

    <h3>What we do not do</h3>
    <p>We do not sell your data, share it with third parties, use it for advertising, or
       republish creators' content. Data is used solely to provide the analytics you request.</p>

    <h3>Retention &amp; deletion</h3>
    <p>You can remove any tracked account at any time, or delete all of your data — see our
       <a href="/data-deletion">Data Deletion instructions</a>. Signing out and removing the app
       from your Facebook settings revokes our access token.</p>

    <h3>Changes</h3>
    <p>We'll update this page if our practices change. Questions:
       <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
  </div></div>`;
  return html(layout({ title: "Privacy Policy", body, user }));
}

export function dataDeletion(req, env, url, user) {
  const signedIn = user
    ? `<form method="POST" action="/app/delete-all" onsubmit="return confirm('Delete ALL of your ${PRODUCT_NAME} data? This cannot be undone.')">
         <button class="btn danger" type="submit">Delete all my data now</button>
       </form>`
    : `<a class="btn fb" href="/auth/login">Sign in to delete your data</a>`;
  const body = `<div class="wrap"><div class="card">
    <h1>Data Deletion</h1>
    <p>You control your ${PRODUCT_NAME} data and can delete it at any time.</p>

    <h3>Delete it yourself (instant)</h3>
    <p>Sign in and use the button below. This permanently removes your account record, your tracked
       accounts, and all stored snapshots and media metrics from our database.</p>
    ${signedIn}

    <h3>Revoke access</h3>
    <p>You can also revoke ${PRODUCT_NAME}'s access entirely from
       <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener">
       Facebook Settings → Business Integrations</a>. Removing the app there invalidates our token.</p>

    <h3>Request deletion by email</h3>
    <p>Prefer we handle it? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> from the
       address on your account, or with your Instagram username, and we will delete all associated
       data within 30 days and confirm by reply.</p>
  </div></div>`;
  return html(layout({ title: "Data Deletion", body, user }));
}

export function terms(req, env, url, user) {
  const body = `<div class="wrap"><div class="card">
    <h1>Terms of Service</h1>
    <p class="muted">Last updated: 2026-07-06</p>
    <p>${PRODUCT_NAME} provides analytics on public Instagram professional accounts via Meta's
       official Instagram Graph API. By using it you agree to:</p>
    <ul>
      <li>use it only for lawful competitive and creative research on public professional accounts;</li>
      <li>not attempt to access private data or circumvent Meta's API limits;</li>
      <li>not republish or redistribute creators' content retrieved through the service.</li>
    </ul>
    <p>The service is provided "as is" without warranty. We may change or discontinue it at any time.
       ${PRODUCT_NAME} is not affiliated with or endorsed by Meta or Instagram. Contact:
       <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
  </div></div>`;
  return html(layout({ title: "Terms of Service", body, user }));
}
