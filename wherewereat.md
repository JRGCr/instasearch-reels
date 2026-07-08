# Where we're at — Graph API token

## The problem
Discovery (`discover_reels.py`) wasn't broken for lack of creds — the creds exist
(`.graph_token`, `.graph_user_id` = `17841425569475500`). The **token expired**:

```
Session has expired on Monday, 06-Jul-26 13:00:00 PDT (code 190)
```

It was a short-lived token (lasted hours, not the ~60 days a long-lived one gives).
`business_discovery` failed at preflight because of this.

## What we built: `refresh_token.py`
Stdlib-only helper (runs under system `python3`) that keeps the token alive by
exchanging a *still-valid* token for a fresh 60-day one via `fb_exchange_token`.

```bash
python3 refresh_token.py --check    # show expiry + scopes, write nothing
python3 refresh_token.py            # refresh if expiring soon (needs .graph_app_secret)
python3 refresh_token.py --from-short '<browser token>'   # reseed when already dead
```

Also fixed `discover_reels.py` preflight: an expired/invalid token now stops
immediately and points at `refresh_token.py` instead of limping on and failing
cryptically. Docs updated in `README.md` and `CLAUDE.md`. New secret files added
to `.gitignore` (`.graph_app_secret`, `.graph_app_id`). Nothing committed yet.

## Next steps (to get running again)
The current token is already dead, so exchange won't work until we reseed. Two
one-time things:

1. **App secret** — Meta app → Settings → Basic → App Secret, then:
   `echo -n '<secret>' > .graph_app_secret`  (already gitignored)
2. **Fresh browser token** — [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   → app *CodeSamur.ai Publisher* (`1665931797961650`) → add scopes
   `instagram_basic`, `pages_read_engagement`, `instagram_manage_insights` →
   Generate Access Token, then:
   `python3 refresh_token.py --from-short '<that token>'`

After that, plain `python3 refresh_token.py` keeps it topped up indefinitely.

## Then
- `python3 discover_reels.py` → queues new Reels into `inbox.txt`
- `.venv/bin/python fetch_reels.py` → downloads to `videos/`
- `.venv/bin/python process_reels.py` → transcribes → `swipe_file.md`

(Note: `.venv` is Linux-built — dead symlink on macOS. Discovery is stdlib-only so
it runs fine; fetch/process need the Linux runner or a locally-rebuilt venv.)
