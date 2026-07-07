# InstaSearch — web app (Cloudflare Worker)

The hosted, reviewer-facing product: a competitive-intelligence dashboard for Instagram
professional accounts, powered by the Instagram Graph API `business_discovery` endpoint.
This app both **is the real product** and serves as the **App Review demonstration surface**
for Advanced Access on `instagram_manage_insights`.

## Architecture

- **Cloudflare Worker** (`src/index.js` router) — server-rendered HTML, no build step.
- **Facebook Login** OAuth (`src/routes/auth.js`) — `business_discovery` is a Facebook-Login
  product feature, so login is via Facebook. Token is exchanged for a long-lived (~60d) token
  and stored **server-side in KV**; it never reaches the browser.
- **D1** (`schema.sql`, `src/lib/db.js`) — tracked accounts + **metric snapshots over time**
  (the real trend feature) + latest media metrics.
- **Graph client** (`src/lib/graph.js`) — mirrors `../discover_reels.py`: same Graph version,
  same `business_discovery` field expansion.

Routes: `/` landing · `/privacy` · `/data-deletion` · `/terms` · `/auth/*` · `/app` dashboard ·
`/app/account/:id` detail.

## One-time setup

```bash
cd app
npm install

# 1. Create the KV namespace and D1 database, paste their ids into wrangler.toml
npx wrangler kv namespace create SESSIONS
npx wrangler d1 create instasearch

# 2. Create the schema
npm run db:init          # remote
npm run db:init:local    # local dev

# 3. App secret (from the crimson-scroll-learn secrets / Meta dashboard)
npx wrangler secret put META_APP_SECRET
```

`META_APP_ID` is set in `wrangler.toml` (`1665931797961650`, the shared "CodeSamur.ai Publisher"
app). Adding `instagram_manage_insights` is **additive** — it does not affect the app's existing
publishing scopes used by `crimson-scroll-learn`.

## Local dev

```bash
npm run dev            # http://localhost:8787
```

For OAuth to work locally, add `http://localhost:8787/auth/callback` to the app's **Valid OAuth
Redirect URIs** in the Meta dashboard (Facebook Login → Settings). Create a `.dev.vars` file
(gitignored) with `META_APP_SECRET=...` for local runs.

## Deploy

```bash
npm run deploy
```

Then map the custom domain (uncomment the `routes` block in `wrangler.toml` and set DNS), e.g.
`instasearch.codesamur.ai`, and add `https://instasearch.codesamur.ai/auth/callback` to the app's
Valid OAuth Redirect URIs.

## Notes

- The app works end-to-end **before** Advanced Access is granted — but live `business_discovery`
  calls against accounts you don't own will return a permission error until Meta approves
  `instagram_manage_insights` at Advanced Access. Against your OWN account it works under Standard
  Access, which is enough to record the demo.
- See `../SUBMISSION_PACKAGE.md` for the App Review justification + screencast script, and
  `../META_DASHBOARD_CHECKLIST.md` for exact dashboard values.
