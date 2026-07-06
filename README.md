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

Videos are kept in `videos/` — delete them after processing if you want the space back;
transcripts stay in the swipe file.
