# InstaSearch — Reel Capture Pipeline

Justin (Chief Social Media Manager, specialty: Instagram Reels 9:16) captures tactics
from creators he follows into a searchable swipe file, guided by the team playbook.

## What's here

- `instagram-reels-playbook.md` — team best-practices playbook (specs, algorithm, hooks, cadence). The reference doc; swipe-file learnings feed back into it.
- `swipe_file.md` — transcripts + takeaways from saved Reels. Every entry gets **Tags** (hooks / editing / strategy / ads / lead-gen / …) and a one-line **Key takeaway**.
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

## Conventions

- Swipe entries: keep captions truncated ~500 chars; takeaways are one dense line.
- If a Reel has no speech (VFX/visual), note it and describe what to study visually.
- Downloads use Justin's Instagram session — if yt-dlp hits login walls, set `COOKIES_FROM_BROWSER = "chrome"` in `fetch_reels.py`, or (esp. in a headless container with no browser) drop a Netscape-format `cookies.txt` in the repo root — it's auto-detected and takes precedence.
- **Throttling:** `fetch_reels.py` paces itself to avoid rate limits/bans — `REEL_GAP` seconds between Reels (currently 30), capped at `MAX_PER_RUN` per run (extras stay in `inbox.txt` for the next run), and it aborts on the first real throttle signal (`STOP_ON_RATE_LIMIT`). All knobs are named constants at the top of the file. Unauthenticated + fast + big batches is what risks a ban; cookies + small, spaced runs is the safe mode.
- Personal research use only; don't republish downloaded content.

## Creator watchlist

See the "Creator Watchlist" section in `instagram-reels-playbook.md` — ~53 accounts grouped by what to study (growth strategy, content marketing, niche coaches, VFX/editing, paid ads, delivery, entertainment).
