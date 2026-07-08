# Decision Doc — InstaSearch Advanced Access (`instagram_manage_insights`)

> Deliverable #1 of `APP_REVIEW_BRIEF.md`. Records the Step-0 findings (verified against
> live `developers.facebook.com` docs, July 2026), the chosen architecture, and the build
> plan. Read this before touching code.

## TL;DR

- **No pivot needed.** `business_discovery` is alive and current. Keep building on it.
- **Permission name confirmed:** `instagram_manage_insights` (NOT `instagram_business_manage_insights`).
- **The blocker is a Meta-side approval, not our plumbing:** Advanced Access via **App Review
  + Business Verification**. A registered legal entity exists → the hardest gate is passable.
- **Build:** a minimal hosted **Cloudflare Worker** app — Facebook Login → `business_discovery`
  demo page — that doubles as the reviewer demo and a real discovery tool.

## Step-0 findings (verified)

### 1. `business_discovery` status — ALIVE, no pivot

- Documented and current:
  - Reference: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery/
  - Guide: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery/
- Lives **only on "Instagram API with Facebook Login"** (formerly "Instagram Graph API",
  requires a linked Facebook Page). **NOT** available on "Instagram API with Instagram Login"
  (confirmed against the Instagram-Login product page and the Platform Overview comparison).
- No deprecation date in the [changelog](https://developers.facebook.com/docs/instagram-platform/changelog).

### 2. Exact permissions for a `business_discovery` call today

- `instagram_basic`
- **`instagram_manage_insights`** ← the critical, Advanced-Access-gated one
- `pages_read_engagement`
- Conditional: `ads_read` **or** `ads_management` — only if the User's Page role was granted
  via Business Manager.
- **`instagram_business_*` scopes do NOT apply** — those belong to the Instagram-Login product,
  which has no `business_discovery`. Our CLAUDE.md / `discover_reels.py` preflight are correct.

### 3. Data available on accounts we don't own

Via nested/field-expansion on the edge, for a **public business/creator** target:
`followers_count`, `media_count`, `username`, `name`, `biography`, `website`,
`profile_picture_url`, and per-media `caption`, `timestamp`, `permalink`, `media_type`,
`like_count`, `comments_count`, `view_count`.
Limitations (still current): can't `GET` a returned media ID directly (must nest media fields);
age-gated accounts return nothing; personal/private accounts are skipped.

### 4. Standard vs Advanced Access

- **Standard** — only accounts you own/manage.
- **Advanced** — required to query accounts you do NOT own/manage → **App Review + Business
  Verification**. Since `business_discovery` by definition targets others' accounts,
  `instagram_manage_insights` at Advanced Access is the correct, unavoidable gate.
- Advanced Access is granted **per-permission** — the app already being Live for publishing
  gives us nothing here.

### 5. Deprecations that do NOT affect us

- Instagram Basic Display API shut down 2024-12-04 — different (consumer) API, never provided
  competitor data. Irrelevant to this pipeline.
- Instagram-Login legacy scope rename (2025-01-27) — only affects the Instagram-Login product.

### Structural risk to watch (no action now)

Meta ships new features to Instagram-Login but has **not** ported `business_discovery` there,
and has **not** announced Facebook-Login's sunset. There is currently **no** Instagram-Login
equivalent. If Facebook-Login is ever deprecated, that's the pivot trigger — monitor the
changelog. No code change warranted today.

## Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| API surface | Instagram API with **Facebook Login** + `business_discovery` | Only product exposing the endpoint. |
| Permission requested | `instagram_manage_insights` (Advanced Access) | The one missing gate. Additive to publishing scopes. |
| Login method | **Facebook Login** | Required by the Facebook-Login product. |
| Hosting | **Cloudflare Workers** | Reuse sibling `crimson-scroll-learn` infra/pattern; cheap, fast deploy. |
| Data deletion | Static **instructions URL** page | App stores no third-party PII → no callback endpoint needed. |
| Token strategy | **Separate** discovery token from publishing token | Scope/review changes must never break live publishing. |
| Legal entity | Registered business (confirmed) | Passes Business Verification. |
| App mode during review | Stay in **Development** until approved | Meta's recommended demo path; avoid breaking existing roles. |

## Compliance surface to produce (checklist)

- [ ] Business Verification completed on the Business Portfolio (legal name, address, EIN/reg).
- [ ] Privacy policy URL (hosted).
- [ ] Data deletion instructions URL (hosted).
- [ ] App icon 1024×1024 (no Meta trademarks), category, purpose, verified contact email.
- [ ] Valid OAuth redirect URI(s) for the Worker's callback; app domain set.
- [ ] `instagram_manage_insights` added in Graph API Explorer / App Review, additive to
      existing publishing scopes.
- [ ] ≥1 successful `business_discovery` call logged within 30 days before submitting.
- [ ] Screencast (1080p, English): login → permission grant → `business_discovery` call →
      app rendering/recording the returned metrics.
- [ ] Written use-case justification (honest competitive/creator research on PUBLIC accounts).

## Build plan (proposed — for approval before implementing)

1. **Scaffold the Cloudflare Worker app** (`app/` in this repo): Facebook Login button →
   `/auth/callback` (OAuth code → token exchange) → `/discover?username=…` page that runs
   `business_discovery` and renders media + metrics. This IS the reviewer demo.
2. **Compliance pages** served by the same Worker: `/privacy`, `/data-deletion`.
3. **Meta dashboard config checklist** with exact values (redirect URI, app domain, icon,
   category, deletion URL, privacy URL).
4. **Submission package**: use-case justification text + step-by-step screencast script.
5. **Post-approval wire-up plan**: how the Advanced-Access long-lived token flows into THIS
   repo's GitHub secrets + local `.graph_token`, kept alive by `refresh_token.py`, WITHOUT
   touching the publishing token in `crimson-scroll-learn`.

## Constraints (carried from the brief)

- Additive only re: the shared Meta app — never remove publishing scopes/config.
- Public accounts only; truthful use-case framing; no redistribution of downloaded content.
- `.venv` here is Linux-built (dead on macOS); discovery scripts are stdlib-only → system `python3`.
