#!/usr/bin/env python3
"""
refresh_token.py — keep the Instagram Graph API token alive.

The pain this solves: a short-lived User token dies in a few hours, and even a
long-lived one expires after ~60 days. When it dies, discover_reels.py fails at
preflight with a cryptic error. This helper keeps the token fresh so you rarely
have to touch the browser.

How it works: Meta lets you exchange ANY *still-valid* token for a fresh
long-lived one (60-day window) via grant_type=fb_exchange_token. So as long as
you refresh before the current token expires, you never re-do the browser step.
If the token is ALREADY expired, exchange is impossible — you must seed a new
one from the browser once (see --from-short and the README).

Stdlib-only (like discover_reels.py) — run under the Mac's system python3:
  python3 refresh_token.py --check          # report expiry + scopes, write nothing
  python3 refresh_token.py                   # refresh if expiring soon (< RENEW_WINDOW days)
  python3 refresh_token.py --force           # refresh now regardless of remaining time
  python3 refresh_token.py --from-short TOK  # seed from a fresh browser token, exchange + save

Credentials it reads (never hard-coded, never committed):
  token       IG_GRAPH_TOKEN   or  ./.graph_token
  app id      IG_APP_ID        or  ./.graph_app_id   (default: CodeSamur.ai Publisher)
  app secret  IG_APP_SECRET    or  ./.graph_app_secret   (required to exchange)

Get the app secret from  developers.facebook.com → app → Settings → Basic →
App Secret, then:  echo -n '<secret>' > .graph_app_secret
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).parent
TOKEN_FILE = BASE / ".graph_token"
APP_ID_FILE = BASE / ".graph_app_id"
APP_SECRET_FILE = BASE / ".graph_app_secret"

GRAPH = "https://graph.facebook.com/v21.0"
DEFAULT_APP_ID = "1665931797961650"   # CodeSamur.ai Publisher (per CLAUDE.md)
RENEW_WINDOW_DAYS = 10                 # refresh when this close to expiry
DAY = 86400


def die(msg):
    sys.exit(f"error: {msg}")


def _read(env, path):
    v = os.environ.get(env)
    if not v and path.exists():
        v = path.read_text().strip()
    return v or None


def api_get(path, params):
    url = f"{GRAPH}/{path}?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"error": {"message": f"HTTP {e.code}: {body[:200]}"}}
    except Exception as e:  # noqa: BLE001
        return {"error": {"message": str(e)}}


def debug_token(token):
    """Return (info_dict, error_str). info has is_valid/expires_at/scopes."""
    data = api_get("debug_token", {"input_token": token, "access_token": token})
    if not isinstance(data, dict) or "error" in data:
        return None, (data.get("error", {}).get("message") if isinstance(data, dict) else "no data")
    info = data.get("data") or {}
    if not info:
        return None, "no debug_token data"
    return info, None


def report(info):
    exp = info.get("expires_at") or 0
    if exp:
        remaining = exp - time.time()
        when = time.strftime("%Y-%m-%d %H:%M", time.localtime(exp))
        days = remaining / DAY
        life = f"expires {when} ({days:.1f} days left)" if remaining > 0 else f"EXPIRED {when}"
    else:
        life, remaining = "never expires", float("inf")
    print(f"App:    {info.get('application', '?')}")
    print(f"Valid:  {info.get('is_valid')}")
    print(f"Token:  {life}")
    print(f"Scopes: {', '.join(info.get('scopes', [])) or '(none)'}")
    return remaining


def exchange(token, app_id, app_secret):
    """Exchange a valid token for a fresh long-lived one."""
    data = api_get("oauth/access_token", {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": token,
    })
    if "error" in data:
        die(f"exchange failed: {data['error'].get('message')}")
    new = data.get("access_token")
    if not new:
        die(f"exchange returned no access_token: {data}")
    return new


def save_token(token):
    TOKEN_FILE.write_text(token)
    TOKEN_FILE.chmod(0o600)
    print(f"✓ wrote new token to {TOKEN_FILE.name} ({len(token)} chars)")


def main():
    ap = argparse.ArgumentParser(description="Keep the IG Graph API token fresh.")
    ap.add_argument("--check", action="store_true", help="report status only; write nothing")
    ap.add_argument("--force", action="store_true", help="refresh even if not expiring soon")
    ap.add_argument("--from-short", metavar="TOKEN",
                    help="seed from a fresh browser token: exchange it and save")
    args = ap.parse_args()

    app_id = _read("IG_APP_ID", APP_ID_FILE) or DEFAULT_APP_ID
    app_secret = _read("IG_APP_SECRET", APP_SECRET_FILE)

    # Seeding from a fresh browser token — the recovery path when the old one is dead.
    if args.from_short:
        if not app_secret:
            die("need the app secret to exchange — set IG_APP_SECRET or ./.graph_app_secret")
        print("Exchanging the provided token for a long-lived one…")
        new = exchange(args.from_short.strip(), app_id, app_secret)
        info, err = debug_token(new)
        if info:
            report(info)
        save_token(new)
        return

    token = _read("IG_GRAPH_TOKEN", TOKEN_FILE)
    if not token:
        die("no token — set IG_GRAPH_TOKEN or create ./.graph_token (or use --from-short)")

    info, err = debug_token(token)
    if err:
        print(f"⚠ current token is unusable ({err}).")
        die("it's likely expired — you must seed a new one from the browser:\n"
            "  1. Graph API Explorer → app 'CodeSamur.ai Publisher', add scopes:\n"
            "     instagram_basic, pages_read_engagement, instagram_manage_insights\n"
            "  2. Generate a User token, then:\n"
            "       python3 refresh_token.py --from-short '<that token>'\n"
            "  (needs ./.graph_app_secret set)")

    remaining = report(info)

    if args.check:
        return
    if not info.get("is_valid"):
        die("token is invalid — reseed with --from-short (see README).")

    if not args.force and remaining > RENEW_WINDOW_DAYS * DAY:
        print(f"\nToken has > {RENEW_WINDOW_DAYS} days left — no refresh needed "
              f"(use --force to refresh anyway).")
        return

    if not app_secret:
        die("need the app secret to refresh — set IG_APP_SECRET or ./.graph_app_secret")

    print("\nRefreshing for a fresh 60-day window…")
    new = exchange(token, app_id, app_secret)
    info2, _ = debug_token(new)
    if info2:
        report(info2)
    save_token(new)


if __name__ == "__main__":
    main()
