# Meta Dashboard Checklist — exact values

Everything to set in the Meta App Dashboard (developers.facebook.com/apps → app
`1665931797961650`, "CodeSamur.ai Publisher") to satisfy App Review for **Advanced Access on
`instagram_manage_insights`**. All changes are **additive** — do not remove any publishing config.

> Replace `instasearch.codesamur.ai` below with the final hosted domain if different.

## Settings → Basic

| Field | Value |
|---|---|
| App icon | 1024×1024 PNG, no Meta trademarks (InstaSearch logo) |
| App domains | `codesamur.ai` |
| Category | Business and pages (or Utilities & productivity) |
| Privacy Policy URL | `https://instasearch.codesamur.ai/privacy` |
| Terms of Service URL | `https://instasearch.codesamur.ai/terms` |
| User data deletion | **Data Deletion Instructions URL** → `https://instasearch.codesamur.ai/data-deletion` |
| Contact email | blackbaysolutions@gmail.com |

## Facebook Login → Settings

| Field | Value |
|---|---|
| Valid OAuth Redirect URIs | `https://instasearch.codesamur.ai/auth/callback` (+ `http://localhost:8787/auth/callback` for dev) |
| Client OAuth Login | Enabled |
| Web OAuth Login | Enabled |
| Enforce HTTPS | Enabled |

## Business Verification

- Complete verification on the **Business Portfolio** that owns the app (registered legal entity:
  legal name + address + EIN/registration number).
- Required for Advanced Access. Allow ~3 business days.

## App Review → Permissions and Features

Request **Advanced Access** for:

- `instagram_manage_insights`  ← the one this whole effort is for
- (confirm `instagram_basic` and `pages_read_engagement` are at least Standard/Advanced as needed)

Existing publishing permissions stay exactly as they are.

## Before you click Submit (hard gates)

- [ ] Business Verification approved.
- [ ] App icon, category, privacy URL, ToS URL, data-deletion URL, contact email all set.
- [ ] OAuth redirect URI live and login works end-to-end on the hosted domain.
- [ ] At least **one successful `business_discovery` API call** made within the last 30 days
      (do a real capture from the dashboard against your own IG account, which works under
      Standard Access).
- [ ] Screencast recorded (see `SUBMISSION_PACKAGE.md`).
- [ ] Written use-case justification pasted per permission (see `SUBMISSION_PACKAGE.md`).
- [ ] App stays in **Development** mode until approval — do NOT flip to Live pre-approval
      (it can disrupt existing app roles / the live publishing integration).

## App mode note

The app is already **Live** for publishing. Advanced Access is granted **per permission**, so the
insights request is reviewed on its own. Record the demo in Development mode using your own
admin/developer account per Meta's guidance; don't change the live app mode to submit.
