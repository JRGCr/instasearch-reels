# App Review Submission Package — `instagram_manage_insights` (Advanced Access)

Everything the reviewer reads/watches. Honest framing: InstaSearch is a legitimate
competitive-intelligence tool that uses Meta's own `business_discovery` endpoint on **public
professional accounts**. No scraping, no private data, no redistribution.

**App purpose declaration:** set to **"Yourself or your own business"** — this is an internal tool
for our own social team, not a service offered to clients. Note: this declaration is accurate but
does **not** reduce the review requirements. Meta gates Advanced Access on *whose accounts the data
is about* (we query accounts we don't own → Advanced Access + App Review + Business Verification are
all still required), not on whether the app has external users. The full package below applies.

**App mode:** submit and record the demo in **Development mode** (querying your own connected IG
account works under Standard Access — enough for the screencast and the "≥1 successful call" gate).
Flip the app to **Live only after approval**, which is when Advanced Access permits querying the
non-owned watchlist in production. See `META_DASHBOARD_CHECKLIST.md`.

---

## 1. Use-case justification (paste into App Review, per permission)

**Permission:** `instagram_manage_insights`

> InstaSearch is a competitive-intelligence dashboard for social media managers who run Instagram
> professional (business/creator) accounts. After a user signs in with Facebook and connects the
> Instagram professional account they manage, InstaSearch uses the Instagram Graph API
> `business_discovery` endpoint to retrieve **public** profile metrics (follower count, media count)
> and **public** recent media (captions, permalinks, like and comment counts, timestamps) for the
> public business/creator accounts the user chooses to benchmark.
>
> `instagram_manage_insights` is required because `business_discovery` returns insights-class public
> metrics for accounts the user does not own, which needs Advanced Access. InstaSearch stores
> periodic snapshots of these public metrics so users can track competitors' growth and content
> performance over time — the core value of the product.
>
> InstaSearch accesses only public data on professional accounts exactly as the API exposes it. It
> never accesses private accounts, private posts, messages, or any non-public data, and it does not
> republish creators' content. Data is used solely to render analytics to the signed-in user who
> requested it.

## 2. Step-by-step test instructions for reviewers

> 1. Go to `https://instasearch.codesamur.ai`.
> 2. Click **Continue with Facebook** and log in. Grant the requested permissions, selecting the
>    Facebook Page and connected Instagram professional account.
> 3. You land on the dashboard. In the **Track account** box, enter a public Instagram
>    business/creator username (e.g. `nasa`) and click **Track account**.
> 4. InstaSearch calls `business_discovery` and shows that account's follower count, post count, and
>    captured posts. Click the account row to open its detail page — follower trend and top content
>    by engagement.
> 5. Click **Refresh all metrics** to capture a new snapshot (demonstrates the ongoing-tracking use).
> 6. (Data deletion) Visit `/data-deletion` and click **Delete all my data** to see removal.
>
> Test credentials, if the reviewer prefers ours: _[add a test Facebook user from Roles → Test Users,
> or provide login]_.

## 3. Screencast script (~2–3 min)

**Recording specs (verified against Meta's screen-recording doc):**
- **No audio** — reviewers don't listen to it. Use **on-screen captions / text overlays** for every
  narration line below instead of voice-over.
- **1080p or higher**; keep the browser window **≤1440px wide**; **English** UI; **enlarged cursor**;
  use the mouse (not keyboard shortcuts) so actions are visible.
- Start **logged out** (log out of Facebook first) and capture the **complete** logged-out → login →
  grant → use flow. Omitting the grant or the data-in-use step is the #1 rejection cause.
- Sign in with a **role user** (an Admin/Developer/Tester on the app). **Never a fake account** —
  that's an automatic rejection.

**IMPORTANT — demo target:** In the recording, **Track an Instagram professional account you OWN /
manage** (e.g. your own brand account). Non-owned creators require the very Advanced Access you're
requesting, so they won't return data until approval; a self-owned query works now at Standard Access
and is the correct way to demonstrate the mechanism + satisfy the "≥1 successful API call" prerequisite.

Shot list (put each italic line on screen as a caption):

1. **(0:00) Landing** — show `instasearch.codesamur.ai`; caption the value prop; point to the
   Privacy / Data Deletion / Terms footer links.
2. **(0:15) Login** — click **Continue with Facebook** from a logged-out state. Show the Facebook
   login, then the **permissions dialog** — pause on it so `instagram_manage_insights` is clearly
   visible being granted, and show the Page / IG account selection.
3. **(0:45) Dashboard** — arrive signed in; caption "Signed in as @youraccount (an account we manage)".
4. **(1:00) Track (the API call)** — type **your own** professional account's username, click
   **Track account**. Show the success flash with follower count + posts captured. *Caption: "This is
   the business_discovery call — instagram_manage_insights is what authorizes it."*
5. **(1:30) Account detail (data in use)** — open the account; show the followers KPI, the
   follower-trend sparkline, and **Top content by engagement** with like/comment counts and permalinks.
   *Caption: "The insights data returned by business_discovery, rendered and stored by our app."* This
   is the critical "show what the app does with the data" step reviewers require.
6. **(2:15) Refresh** — click **Refresh all metrics**; *caption: "each refresh stores a snapshot so we
   can chart growth over time."*
7. **(2:30) Data deletion** — open `/data-deletion`, click **Delete all my data**, show confirmation.
8. **(2:45) Privacy** — briefly show `/privacy` describing exactly this data use.

Narrate what each permission does as it's used. Reviewers reject screencasts that show a grant but
never show the data being used — steps 4–6 are the ones that matter most.

## 4. Common rejection reasons — pre-empt each

| Risk | Mitigation in this build |
|---|---|
| App not loadable / login broken | Hosted on `codesamur.ai`, real OAuth callback, `/health` check |
| Screencast doesn't show permission *in use* | Script steps 4–6 show the `business_discovery` call + rendered data |
| Generic justification | §1 maps directly to `business_discovery` + public-data framing |
| No successful API call logged | Do a real capture against your own account (works under Standard) before submitting |
| Missing privacy / deletion | `/privacy`, `/data-deletion` (instructions URL) live |
| "Why access accounts you don't own?" | Justification states it plainly: benchmarking public professional accounts, Meta's sanctioned use of `business_discovery` |
| Business Verification incomplete | Complete on the registered entity first (hardest gate) |

## 5. Honest risk note

The single biggest judgment call is that reviewers scrutinize insights access to accounts you don't
own. This submission is truthful and uses Meta's own endpoint for its intended purpose, and the app
is a real, substantive product — the strongest posture available. Still, budget for at least one
resubmission; if rejected, read the specific reason (usually screencast completeness or justification
specificity) and iterate.
