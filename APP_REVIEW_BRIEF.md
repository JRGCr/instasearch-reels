# App Review Brief — Advanced Access for `instagram_manage_insights`

> Paste-ready brief for a Claude Code session **in this repo** (`../instasearch` /
> `JRGCr/instasearch-reels`). Goal: build InstaSearch into a real, hosted app that can
> PASS Meta App Review for Advanced Access on `instagram_manage_insights`, so
> `discover_reels.py`'s `business_discovery` auto-discovery works in production.
> Timeline of weeks is acceptable. Do it properly, not a hack.

## Hard context (already established — don't re-derive)

- Meta app: **"CodeSamur.ai Publisher", App ID `1665931797961650`**. This SAME app is
  used by a sibling project (`../crimson-scroll-learn`) for IG/FB Reels **PUBLISHING**,
  which is LIVE and must NOT break. Any scope/token changes must be **additive** (a
  superset of the existing publishing scopes) so publishing keeps working.
- App secret + a working long-lived token live as **GitHub Actions secrets in the
  `crimson-scroll-learn` repo**: `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`.
  **THIS repo (`JRGCr/instasearch-reels`) currently has NO GitHub secrets set** — its
  `reels.yml` workflow references `secrets.META_ACCESS_TOKEN`, which is undefined.
- `business_discovery` requires scopes: `instagram_basic`, `pages_read_engagement`, and
  **`instagram_manage_insights`** (the critical one). `discover_reels.py` already
  preflights these via `/debug_token` and aborts if `instagram_manage_insights` is missing.
- The blocker is **NOT** token plumbing. It's that `instagram_manage_insights` against
  accounts we don't own needs **ADVANCED ACCESS via App Review** — Standard Access only
  covers our own/test accounts. The permission isn't even offered in Graph API Explorer
  for us right now.
- Existing pieces already built: `discover_reels.py` (business_discovery + scope
  preflight), `refresh_token.py` (`fb_exchange_token` 60-day refresh), `fetch_reels.py`
  (yt-dlp via IG session cookies), `process_reels.py` (faster-whisper transcribe).
  Watchlist of ~53 creators is in `instagram-reels-playbook.md`.

## Step 0 — VERIFY CURRENT REQUIREMENTS FIRST (do not skip)

Meta changes this constantly and training may be stale. Before writing any code, use
WebSearch/WebFetch on official `developers.facebook.com` docs to confirm, as of now:

1. Does `business_discovery` still exist, and under which product — the legacy
   "Instagram Graph API (Facebook Login)" or "Instagram API with Instagram Login"?
   Confirm the EXACT permission name today (`instagram_manage_insights` vs
   `instagram_business_manage_insights`) and whether `business_discovery` survived the
   deprecations. **If it's gone, find the current equivalent** for pulling public
   competitor/creator media + metrics, and adapt the whole plan to that.
2. The exact App Review requirements for Advanced Access on that permission: business
   verification, hosted app + Facebook Login test flow for reviewers, privacy policy URL,
   data deletion callback/instructions, app icon/category/domain, screencast, use-case
   justification. List what we don't yet have.

**Report findings and a recommended architecture BEFORE building.**

## Deliverables

1. A **decision doc**: which product/permission model we're building on and why, given
   Step 0. Flag if `business_discovery` is dead and we must pivot.
2. A **real, hosted, minimal-but-functional app** that DEMONSTRABLY exercises the
   permission (reviewers must be able to log in and see it work) — Facebook Login flow +
   a page that shows discovered creator media/metrics. Keep it deployable on infra we
   already use (Cloudflare Workers is used by the sibling repo — reuse if it fits, else
   pick the simplest hosted option and justify).
3. **Compliance surface**: privacy policy page, data deletion mechanism, app settings
   (icon, category, app domain, valid OAuth redirect URIs) — a checklist of what to set
   in the Meta dashboard, with exact values.
4. **Submission package**: the written use-case justification (honest framing — this is
   legitimate competitive/creator research via Meta's own `business_discovery` tool, on
   PUBLIC business/creator accounts, for our own brand's social strategy), plus a
   step-by-step screencast script that shows the permission in use.
5. **Wire-up plan for after approval**: how the resulting Advanced-Access long-lived
   token flows into THIS repo's GitHub secrets + local `.graph_token`, and how
   `refresh_token.py` keeps it alive — WITHOUT disturbing the publishing token in
   `crimson-scroll-learn`. (If it's a distinct token, keep them separate and document why.)

## Constraints

- **Additive only** re: the shared Meta app — never remove publishing scopes/config.
- Personal/competitive research use on **PUBLIC** accounts only; be truthful with Meta.
  Don't fabricate a use case — describe the actual one accurately.
- `.venv` here is Linux-built (dead on macOS); discovery scripts are stdlib-only so run
  under system `python3`.

**Start with Step 0 and come back with findings + a build plan before implementing.**
