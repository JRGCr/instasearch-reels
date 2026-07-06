#!/usr/bin/env python3
"""
process_reels.py — CLAUDE's side of the pipeline (runs in Claude's sandbox).

Transcribes every unprocessed video in ./videos with faster-whisper
(local model in ./models) and appends structured entries to swipe_file.md.
Claude then fills in tags and takeaways.
"""

import sys
from datetime import date
from pathlib import Path

BASE = Path(__file__).parent
VIDEOS = BASE / "videos"
MODELS = BASE / "models" / "faster-whisper-base"
SWIPE = BASE / "swipe_file.md"
DONE = BASE / ".transcribed"

VIDEO_EXTS = {".mp4", ".mov", ".webm", ".mkv", ".m4a", ".mp3"}


def main():
    if not (MODELS / "model.bin").exists():
        sys.exit("Model not found — run fetch_reels.py on the Mac first (downloads it once).")

    from faster_whisper import WhisperModel
    done = set(DONE.read_text().split()) if DONE.exists() else set()
    todo = [p for p in sorted(VIDEOS.glob("*")) if p.suffix.lower() in VIDEO_EXTS and p.stem not in done]

    if not todo:
        print("No new videos to transcribe.")
        return

    print(f"Transcribing {len(todo)} video(s)…")
    model = WhisperModel(str(MODELS), device="cpu", compute_type="int8")

    if not SWIPE.exists():
        SWIPE.write_text("# Reels Swipe File\n\nAuto-captured transcripts, tagged by playbook section.\n")

    for vid in todo:
        sc = vid.stem
        uploader, caption = "unknown", ""
        meta = VIDEOS / f"{sc}.meta"
        if meta.exists():
            lines = meta.read_text().splitlines()
            uploader = lines[0] if lines else "unknown"
            caption = "\n".join(lines[1:]).strip()
        if len(caption) > 500:
            caption = caption[:500] + " …"

        segments, info = model.transcribe(str(vid), vad_filter=True)
        text = " ".join(s.text.strip() for s in segments).strip()

        entry = f"""
---

## @{uploader} — {date.today().isoformat()}

**Link:** https://www.instagram.com/p/{sc}/
**Tags:** _(pending)_
**Key takeaway:** _(pending)_

**Caption:**
> {caption or "(none)"}

**Transcript:**
{text or "(no speech detected — visual/music Reel)"}
"""
        with SWIPE.open("a") as f:
            f.write(entry)
        with DONE.open("a") as f:
            f.write(sc + "\n")
        print(f"  ✓ {sc} (@{uploader}) — {len(text)} chars")

    print("Done. Entries appended to swipe_file.md.")


if __name__ == "__main__":
    main()
