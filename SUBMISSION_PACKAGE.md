# App Review Submission Package — `instagram_manage_insights` (Advanced Access)

Everything the reviewer reads/watches. Honest framing: InstaSearch is a legitimate
competitive-intelligence tool that uses Meta's own `business_discovery` endpoint on **public
professional accounts**. No scraping, no private data, no redistribution.

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

## 3. Screencast script (1080p, English, ~2–3 min)

Record the actual hosted app. Show the whole flow end to end:

1. **(0:00) Landing page** — show `instasearch.codesamur.ai`, read the one-line value prop, point to
   Privacy / Data Deletion / Terms links in the footer.
2. **(0:15) Login** — click **Continue with Facebook**. Show the Facebook login screen, then the
   **permissions dialog** — pause so the reviewer clearly sees `instagram_manage_insights` being
   granted and the Page/IG account selection.
3. **(0:45) Dashboard** — arrive signed in; note "Signed in as @youraccount".
4. **(1:00) Add an account** — type a public creator username, click **Track account**. Show the
   success message with follower count + posts captured. *This is the `business_discovery` call.*
5. **(1:30) Account detail** — open the account; show followers KPI, the follower-trend sparkline,
   and **Top content by engagement** with like/comment counts and Instagram permalinks. Narrate:
   "This is public data InstaSearch retrieved via business_discovery, which is what we use the
   insights permission for."
6. **(2:15) Refresh** — click **Refresh all metrics**; explain each refresh stores a snapshot so we
   can chart competitors' growth over time.
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
