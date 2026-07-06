#!/usr/bin/env python3
"""
fetch_reels.py — YOUR side of the pipeline (runs on your Mac).

What it does:
  1. First run only: downloads the Whisper speech model (~145 MB) into ./models
  2. Reads Reel URLs from ./inbox.txt
  3. Downloads each video into ./videos/

Then Claude takes over: transcribes, summarizes, and updates swipe_file.md.

One-time setup:
  python3 -m venv .venv
  .venv/bin/pip install yt-dlp huggingface_hub

Usage:
  .venv/bin/python fetch_reels.py
"""

import re
import subprocess
import sys
import time
from pathlib import Path

BASE = Path(__file__).parent
INBOX = BASE / "inbox.txt"
VIDEOS = BASE / "videos"
MODELS = BASE / "models" / "faster-whisper-base"
DONE = BASE / ".fetched_urls"

# --- Auth (an authenticated session is the best defense against rate limits) --
# Option 1 (on a Mac with a logged-in browser): pull cookies from it, e.g.
# "chrome" or "safari". Won't work in a headless container (no browser there).
COOKIES_FROM_BROWSER = None
# Option 2 (any machine, incl. this container): export your logged-in Instagram
# cookies to a Netscape-format file at ./cookies.txt (use a browser extension
# like "Get cookies.txt"). If present, it takes precedence over the browser.
COOKIES_FILE = BASE / "cookies.txt"

# --- Throttling: after each Reel finishes, wait REEL_GAP seconds, then next ---
REEL_GAP = 30                  # seconds to wait after each Reel before the next
SLEEP_REQUESTS = 2             # small pause between requests during extraction
RETRIES = 4                    # retry a failed request/fragment this many times
RETRY_SLEEP = "linear=10:120"  # backoff between retries: 10s, 20s… capped 120s

# --- Safety guards (cheap insurance; don't slow the happy path) --------------
MAX_PER_RUN = 12               # cap downloads per run; the rest wait for next run
STOP_ON_RATE_LIMIT = True      # abort on the FIRST real throttle signal
                               # (pushing through a soft throttle is what earns a ban)

URL_RE = re.compile(r"https?://(www\.)?instagram\.com/(reel|reels|p)/[\w\-]+")


def shortcode(url):
    m = re.search(r"instagram\.com/(?:reel|reels|p)/([\w\-]+)", url)
    return m.group(1) if m else None


def ensure_model():
    if (MODELS / "model.bin").exists():
        return
    print("First run: downloading Whisper model (~145 MB, one time only)…")
    from huggingface_hub import snapshot_download
    snapshot_download("Systran/faster-whisper-base", local_dir=str(MODELS))
    print("Model ready.")


def main():
    ensure_model()
    VIDEOS.mkdir(exist_ok=True)
    done = set(DONE.read_text().split()) if DONE.exists() else set()

    urls = []
    if INBOX.exists():
        for line in INBOX.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and URL_RE.match(line):
                sc = shortcode(line)
                if sc and sc not in done:
                    urls.append((sc, line))

    if not urls:
        print("Nothing new in inbox.txt.")
        return

    throttle = ["--sleep-requests", str(SLEEP_REQUESTS),
                "--retries", str(RETRIES),
                "--retry-sleep", RETRY_SLEEP]

    if COOKIES_FILE.exists():
        auth = ["--cookies", str(COOKIES_FILE)]
        print(f"Auth: cookies file ({COOKIES_FILE.name})")
    elif COOKIES_FROM_BROWSER:
        auth = ["--cookies-from-browser", COOKIES_FROM_BROWSER]
        print(f"Auth: {COOKIES_FROM_BROWSER} browser cookies")
    else:
        auth = []
        print("Auth: none — anonymous download (higher rate-limit risk).")

    deferred = 0
    if len(urls) > MAX_PER_RUN:
        deferred = len(urls) - MAX_PER_RUN
        urls = urls[:MAX_PER_RUN]

    print(f"Fetching {len(urls)} new Reel(s)"
          + (f" (+{deferred} held for next run)" if deferred else "")
          + f" — {REEL_GAP}s pause between each…")

    rate_limited = False
    fetched = 0
    for i, (sc, url) in enumerate(urls):
        if i:                       # after the first, wait REEL_GAP before the next
            time.sleep(REEL_GAP)

        cmd = [sys.executable, "-m", "yt_dlp", "--no-playlist", *throttle, *auth,
               "--print-to-file", "%(uploader)s\n%(description)s", str(VIDEOS / f"{sc}.meta"),
               "-o", str(VIDEOS / f"{sc}.%(ext)s"), url]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0:
            with DONE.open("a") as f:
                f.write(sc + "\n")
            fetched += 1
            print(f"  ✓ {url}")
        else:
            err = r.stderr.strip().splitlines()[-1] if r.stderr else "unknown error"
            print(f"  ✗ {url} — {err}")
            low = err.lower()
            # Hard throttle/ban signals → stop the whole run. (A single "empty media
            # response" is usually just transient, so it is NOT in this set — that URL
            # simply stays in inbox.txt and retries next run.)
            if any(k in low for k in ("rate", "429", "login required",
                                      "wait a few", "please wait", "temporarily")):
                rate_limited = True
                if STOP_ON_RATE_LIMIT:
                    remaining = len(urls) - i - 1 + deferred
                    print(f"\n⛔ Throttle signal from Instagram — stopping now to avoid a ban."
                          f"\n   {remaining} URL(s) left untouched in inbox.txt for a later run.")
                    break

    if rate_limited:
        print("\n⚠ Instagram rate-limited or walled us. Un-fetched URLs stayed in inbox.txt"
              "\n  and retry next run. Best fixes: add ./cookies.txt (a logged-in session),"
              "\n  wait 15-30+ min before retrying, and keep MAX_PER_RUN small.")
    elif deferred:
        print(f"\n{deferred} URL(s) intentionally held back (MAX_PER_RUN={MAX_PER_RUN})."
              "\n  Run again later to fetch the rest.")

    print("\nDone. Now tell Claude: “process my reels” — transcription happens on Claude's side.")


if __name__ == "__main__":
    main()
