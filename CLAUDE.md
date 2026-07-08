# InstaSearch — Reel Capture Pipeline

Justin (Chief Social Media Manager, specialty: Instagram Reels 9:16) captures tactics
from creators he follows into a searchable swipe file, guided by the team playbook.

## What's here

- `instagram-reels-playbook.md` — team best-practices playbook (specs, algorithm, hooks, cadence). The reference doc; swipe-file learnings feed back into it.
- `swipe_file.md` — transcripts + takeaways from saved Reels. Every entry gets **Tags** (hooks / editing / strategy / ads / lead-gen / …) and a one-line **Key takeaway**.
- `discover_reels.py` — **sanctioned auto-discovery**: enumerates the ~53 watchlist creators via the Instagram Graph API `business_discovery` edge, records metrics to `reels_index.json`, and appends new permalinks to `inbox.txt`. Stdlib-only (no venv needed — runs under system `python3`). Creds: `.graph_token` + `.graph_user_id` (or `IG_GRAPH_TOKEN`/`IG_USER_ID`). See the **Graph API** note below.
- `refresh_token.py` — **keeps the Graph API token alive** (exchanges a valid token for a fresh 60-day one; `--check` / `--from-short`). Stdlib-only. See the **Graph API** note below.
- `fetch_reels.py` — downloads Reels listed in `inbox.txt` into `videos/` via yt-dlp (venv: `.venv/bin/python fetch_reels.py`). First run downloads the Whisper model to `models/`.
- `process_reels.py` — transcribes `videos/*` with faster-whisper (local model, CPU/int8), appends structured entries to `swipe_file.md`.
- `inbox.txt` — paste Reel URLs here, one per line. `.fetched_urls` / `.transcribed` track state (don't delete unless reprocessing intentionally).

## Environment

- Python venv at `.venv` with `yt-dlp` and `huggingface_hub`. `faster-whisper` may need installing: `.venv/bin/pip install faster-whisper`
- Whisper model: `models/faster-whisper-base` (already downloaded)
- macOS, Homebrew Python (PEP 668 — always use the venv, never global pip)

## Workflow ("process my reels")

1. New URLs → `inbox.txt` (from Justin, or from his Instagram Saved page: https://www.instagram.com/codesamur.ai/saved/all-posts/ — needs his logged-in browser)
2. `.venv/bin/python fetch_reels.py` — download new videos
3. `.venv/bin/python process_reels.py` — transcribe → swipe file (run with `.venv/bin/python` if faster-whisper is in the venv)
4. Fill in Tags + Key takeaway for each new entry: extract the *principle/tactic*, not a description. Note hook formula used, CTA structure, anything that maps to a playbook section.
5. If a tactic is significant, propose adding it to the playbook.

## Graph API (business_discovery) — permissions & gotchas

- **`business_discovery` requires the `instagram_manage_insights` permission**, on top of
  `instagram_basic` + `pages_read_engagement` ([Meta docs](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery/)).
  Without it the call fails with `(#10) Application does not have permission for this action` — a
  misleading error that looks app-level but is really the missing scope. `discover_reels.py` now
  **preflights** the token via `/debug_token` and aborts early naming the missing scope.
- **Fix a missing/expired token:** regenerate a long-lived User token for app *CodeSamur.ai Publisher*
  (`1665931797961650`) in the Graph API Explorer **with `instagram_manage_insights` added**, exchange
  for long-lived (`/oauth/access_token?grant_type=fb_exchange_token`), then `echo -n '<tok>' > .graph_token`.
- **`refresh_token.py` automates the exchange** so tokens don't keep dying mid-day. `python3 refresh_token.py`
  exchanges a *still-valid* token for a fresh 60-day one (needs the app secret in `.graph_app_secret`);
  `--check` reports expiry/scopes; `--from-short '<browser token>'` seeds a new one when the old is already
  dead (exchange only works on a valid token). Stdlib-only → system `python3`. `discover_reels.py`'s
  preflight now points here when the token is rejected.
- **Advanced Access caveat:** querying accounts you don't own with insights-class permissions may
  require **Advanced Access** for `instagram_manage_insights` (App Review), not just Standard. If
  `(#10)` persists *after* adding the scope, that App Review is the next gate — a Meta-side approval,
  not a code change.
- Only **public business/creator** targets return data; personal/private accounts are skipped and
  listed at the end (feed those to `inbox.txt` manually).
- **`.venv` is Linux-built** (created on the self-hosted runner / container, `/home/node/...`), so its
  `python` symlink is dead on macOS. Discovery is stdlib-only → run it with the Mac's system `python3`;
  `fetch_reels.py`/`process_reels.py` (faster-whisper) run on the Linux runner or a locally-rebuilt venv.

## Conventions

- Swipe entries: keep captions truncated ~500 chars; takeaways are one dense line.
- If a Reel has no speech (VFX/visual), note it and describe what to study visually.
- Downloads use Justin's Instagram session — if yt-dlp hits login walls, set `COOKIES_FROM_BROWSER = "chrome"` in `fetch_reels.py`, or (esp. in a headless container with no browser) drop a Netscape-format `cookies.txt` in the repo root — it's auto-detected and takes precedence.
- **Throttling:** `fetch_reels.py` paces itself to avoid rate limits/bans — `REEL_GAP` seconds between Reels (currently 30), capped at `MAX_PER_RUN` per run (extras stay in `inbox.txt` for the next run), and it aborts on the first real throttle signal (`STOP_ON_RATE_LIMIT`). All knobs are named constants at the top of the file. Unauthenticated + fast + big batches is what risks a ban; cookies + small, spaced runs is the safe mode.
- Personal research use only; don't republish downloaded content.

## Creator watchlist

See the "Creator Watchlist" section in `instagram-reels-playbook.md` — ~53 accounts grouped by what to study (growth strategy, content marketing, niche coaches, VFX/editing, paid ads, delivery, entertainment).
