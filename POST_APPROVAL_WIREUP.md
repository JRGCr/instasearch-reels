# Post-Approval Wire-Up Plan

What to do once Meta grants Advanced Access to `instagram_manage_insights`, so the token flows into
this repo's automation **without disturbing the publishing integration** in `crimson-scroll-learn`.

## Token strategy: keep discovery and publishing tokens separate

Both projects use the same Meta app (`1665931797961650`), but they should use **distinct long-lived
User tokens**:

- **Publishing token** — lives as `META_ACCESS_TOKEN` in the **`crimson-scroll-learn`** GitHub
  secrets. Untouched by any of this.
- **Discovery token** — a separate long-lived token minted *after* Advanced Access is granted, with
  the insights scope. Used by this repo's `discover_reels.py` and the web app.

Why separate: a token carries whatever scopes it was granted at mint time. Re-minting the publishing
token to add insights would mean touching the live publishing credential — unnecessary risk. Two
tokens = blast-radius isolation. If the discovery token is ever revoked or rejected in review,
publishing keeps working.

## Steps after approval

1. **Mint the discovery token** in Graph API Explorer for app `1665931797961650` with
   `instagram_basic`, `pages_read_engagement`, `instagram_manage_insights` (now available at Advanced
   Access). Exchange for long-lived:
   ```bash
   python3 refresh_token.py --from-short '<explorer token>'   # writes ./.graph_token
   python3 refresh_token.py --check                            # confirm expiry + scopes
   ```
2. **Local use** — `discover_reels.py` reads `./.graph_token` + `./.graph_user_id` (already present).
   Its `/debug_token` preflight will now pass the `instagram_manage_insights` check.
3. **This repo's GitHub secrets** — set a secret so `reels.yml` stops referencing an undefined value:
   ```bash
   gh secret set META_ACCESS_TOKEN --repo JRGCr/instasearch-reels < <(printf %s "$LONG_LIVED_DISCOVERY_TOKEN")
   # also, if the workflow needs them:
   gh secret set META_APP_ID     --repo JRGCr/instasearch-reels --body 1665931797961650
   gh secret set META_APP_SECRET --repo JRGCr/instasearch-reels   # paste when prompted
   ```
   > Note: this repo currently has **no** secrets set, so `reels.yml`'s `secrets.META_ACCESS_TOKEN`
   > is undefined. This step is what makes scheduled discovery actually run.
4. **Web app** — set the app secret once: `cd app && npx wrangler secret put META_APP_SECRET`.
   The app itself gets user tokens via Facebook Login at runtime (no static token needed).
5. **Keep it alive** — `refresh_token.py` exchanges a still-valid token for a fresh 60-day one.
   Run it on a schedule (locally via cron, or a small GitHub Action) so the discovery token never
   dies mid-cycle. It needs `./.graph_app_secret` (or the app secret via env) for the exchange.

## Token refresh automation (optional)

Add a scheduled job that runs `python3 refresh_token.py` weekly and re-writes `.graph_token`, and —
if you want CI discovery — updates the `META_ACCESS_TOKEN` GitHub secret via `gh secret set`. Keep
this in **this** repo only; never point it at the `crimson-scroll-learn` publishing secret.

## Guardrails (must hold)

- Never overwrite `crimson-scroll-learn`'s `META_ACCESS_TOKEN`.
- Never remove publishing scopes when minting the discovery token — request a superset if you ever
  consolidate, never a subset.
- Rotate the discovery token independently; a problem with it must not touch publishing.
