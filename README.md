# Reel Capture Pipeline (hybrid)

Save a Reel → it ends up as a tagged, searchable transcript in `swipe_file.md`.

## The split

| Step | Who | How |
|---|---|---|
| Save Reels on Instagram | You | Tap Save in the app |
| Collect URLs from Saved | Claude | Reads your Saved page via Chrome → fills `inbox.txt` |
| Download videos | You | `python3 fetch_reels.py` (needs your Instagram session) |
| Transcribe + summarize + tag | Claude | Runs `process_reels.py` in its sandbox, updates `swipe_file.md` |

## One-time setup (your Mac)

macOS Python is Homebrew-managed (PEP 668), so use a local virtual environment:

```bash
cd ~/projects/instasearch
python3 -m venv .venv
.venv/bin/pip install yt-dlp huggingface_hub
```

First run of `fetch_reels.py` also downloads the speech model (~145 MB) into
`models/` — Claude's sandbox can't reach model servers, so it comes through you once.

## Routine

1. Save Reels during the week
2. In Cowork: "collect my saved reels" → Claude fills `inbox.txt`
3. On your Mac: `.venv/bin/python fetch_reels.py`
4. In Cowork: "process my reels" → transcripts + takeaways land in `swipe_file.md`

If downloads fail with login errors, open `fetch_reels.py` and set
`COOKIES_FROM_BROWSER = "chrome"`.

## Auto-discovery (optional)

`python3 discover_reels.py` pulls new Reels from your watchlist creators via the sanctioned
Instagram Graph API and queues them into `inbox.txt` — no manual saving needed. It needs a
long-lived token in `.graph_token` that includes the **`instagram_manage_insights`** scope; without
it, `business_discovery` returns a misleading `(#10) … does not have permission` error. The script
preflights the token and tells you if the scope is missing. (Stdlib-only — plain `python3`, no venv.)

### Keeping the token alive

Tokens expire — a short-lived one in hours, a long-lived one in ~60 days. `refresh_token.py`
keeps yours fresh so you rarely touch the browser:

```bash
python3 refresh_token.py --check    # show expiry + scopes
python3 refresh_token.py            # refresh if it's expiring soon (needs .graph_app_secret)
```

Refreshing works by exchanging a *still-valid* token for a fresh 60-day one, so run it
periodically (or before a discovery run) and it stays alive indefinitely. One-time setup: put the
app secret (Meta app → Settings → Basic → App Secret) in `.graph_app_secret`
(`echo -n '<secret>' > .graph_app_secret`).

If the token has **already** expired, exchange is impossible — seed a new one from the browser once:
generate a User token in the Graph API Explorer (app *CodeSamur.ai Publisher*, with
`instagram_basic` + `pages_read_engagement` + `instagram_manage_insights`), then
`python3 refresh_token.py --from-short '<that token>'` to exchange and save it.

Videos are kept in `videos/` — delete them after processing if you want the space back;
transcripts stay in the swipe file.
