#!/usr/bin/env python3
"""
discover_reels.py — enumerate the watchlist creators' Reels via the Instagram
Graph API (business_discovery). The SANCTIONED path: no scraping, no ban risk.

It reads the ~53 usernames from the "Creator Watchlist" in
instagram-reels-playbook.md, calls business_discovery for each, paginates back
through their media up to --limit Reels/account, records metrics
(likes/comments/timestamp/caption) into reels_index.json, and appends new Reel
permalinks to inbox.txt for the existing fetch_reels.py → process_reels.py pipeline.

Requirements (you said you have these):
  - An Instagram *Business/Creator* account
  - A Meta app with the Instagram Graph API and a long-lived access token

Credentials — NEVER hard-code them. Provide either:
  - env vars   IG_GRAPH_TOKEN   (and optionally IG_USER_ID)
  - or files   ./.graph_token   (one line; and optionally ./.graph_user_id)
If IG_USER_ID is absent it's auto-resolved from /me/accounts.

Usage:
  .venv/bin/python discover_reels.py                     # all watchlist accts, --limit default
  .venv/bin/python discover_reels.py --limit 15
  .venv/bin/python discover_reels.py --accounts alex.kreate askvinh
  .venv/bin/python discover_reels.py --dry-run           # enumerate + report, write nothing

Notes:
  - Only PUBLIC business/creator targets return data; personal/private accounts
    are skipped and listed at the end (feed those to inbox.txt manually).
  - view_count/plays are owner-only and NOT available for other accounts.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).parent
PLAYBOOK = BASE / "instagram-reels-playbook.md"
INBOX = BASE / "inbox.txt"
INDEX = BASE / "reels_index.json"
FETCHED = BASE / ".fetched_urls"
DISCOVERED = BASE / ".discovered"          # shortcodes we've already added to inbox

GRAPH = "https://graph.facebook.com/v21.0"
API_PAUSE = 1.5                            # polite gap between API calls (s)
DEFAULT_LIMIT = 12                         # Reels per account
PAGE_SIZE = 25                             # media per page (API max is generous)

# Permissions business_discovery needs (per Meta docs). Missing
# instagram_manage_insights is the classic cause of "(#10) Application does not
# have permission for this action" — so we fail fast on it below.
REQUIRED_SCOPES = ("instagram_basic", "pages_read_engagement", "instagram_manage_insights")
CRITICAL_SCOPE = "instagram_manage_insights"

# Usernames that appear in the watchlist section but aren't creators to scrape.
DENYLIST = {"codesamur.ai"}


def die(msg):
    sys.exit(f"error: {msg}")


def load_creds():
    token = os.environ.get("IG_GRAPH_TOKEN")
    if not token and (BASE / ".graph_token").exists():
        token = (BASE / ".graph_token").read_text().strip()
    if not token:
        die("no access token — set IG_GRAPH_TOKEN or create ./.graph_token")
    uid = os.environ.get("IG_USER_ID")
    if not uid and (BASE / ".graph_user_id").exists():
        uid = (BASE / ".graph_user_id").read_text().strip()
    return token, uid


def api_get(path, params):
    url = f"{GRAPH}/{path}?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            return json.loads(body)          # Graph errors come back as JSON
        except json.JSONDecodeError:
            return {"error": {"message": f"HTTP {e.code}: {body[:200]}"}}
    except Exception as e:  # noqa: BLE001
        return {"error": {"message": str(e)}}


def preflight(token):
    """Validate the token via /debug_token and fail fast on missing scopes,
    so a permission gap surfaces here instead of as a cryptic (#10) mid-run."""
    data = api_get("debug_token", {"input_token": token, "access_token": token})
    info = data.get("data", {}) if isinstance(data, dict) else {}
    if "error" in data or not info:
        msg = data.get("error", {}).get("message", "no debug_token data") if isinstance(data, dict) else "no data"
        print(f"  ⚠ token preflight skipped ({msg}) — continuing")
        return
    if not info.get("is_valid"):
        die("access token is not valid per /debug_token — regenerate ./.graph_token")
    exp = info.get("expires_at")
    when = time.strftime("%Y-%m-%d", time.localtime(exp)) if exp else "never"
    print(f"Token OK: app '{info.get('application', '?')}', expires {when}")
    missing = [s for s in REQUIRED_SCOPES if s not in set(info.get("scopes", []))]
    if missing:
        print(f"  ⚠ token is missing scope(s): {', '.join(missing)}")
    if CRITICAL_SCOPE in missing:
        die(f"business_discovery requires the '{CRITICAL_SCOPE}' permission — regenerate "
            f"the token with that scope added (see README/CLAUDE.md). Aborting before wasting API calls.")


def resolve_user_id(token):
    """Find the caller's IG business account id via their Pages."""
    data = api_get("me/accounts", {"fields": "instagram_business_account", "access_token": token})
    if "error" in data:
        die(f"couldn't resolve IG user id: {data['error'].get('message')}")
    for page in data.get("data", []):
        iba = page.get("instagram_business_account")
        if iba and iba.get("id"):
            return iba["id"]
    die("no instagram_business_account found on your Pages — pass IG_USER_ID explicitly")


def parse_watchlist():
    """Pull instagram usernames from the Creator Watchlist section of the playbook."""
    if not PLAYBOOK.exists():
        die(f"{PLAYBOOK.name} not found")
    text = PLAYBOOK.read_text()
    m = re.search(r"##\s*Creator\s*Watchlist(.*?)(?:\n###\s*Sources|\Z)", text, re.S | re.I)
    section = m.group(1) if m else text
    seen, users = set(), []
    for u in re.findall(r"instagram\.com/([A-Za-z0-9_.]+)", section):
        u = u.strip("/").lower()
        if u and u not in seen and u not in DENYLIST:
            seen.add(u)
            users.append(u)
    return users


def shortcode(permalink):
    m = re.search(r"instagram\.com/(?:reel|reels|p|tv)/([\w\-]+)", permalink or "")
    return m.group(1) if m else None


MEDIA_FIELDS = ("id,caption,media_type,media_product_type,permalink,timestamp,"
                "like_count,comments_count,media_url,thumbnail_url")


def fetch_media_page(token, ig_id, username, after=None):
    edge = f"media.limit({PAGE_SIZE})"
    if after:
        edge = f"media.after({after}).limit({PAGE_SIZE})"
    fields = f"business_discovery.username({username}){{followers_count,media_count,{edge}{{{MEDIA_FIELDS}}}}}"
    data = api_get(ig_id, {"fields": fields, "access_token": token})
    if "error" in data:
        return None, None, data["error"].get("message", "unknown error")
    bd = data.get("business_discovery")
    if not bd:
        return None, None, "no business_discovery data (personal/private account?)"
    media = bd.get("media", {})
    items = media.get("data", [])
    after_cursor = media.get("paging", {}).get("cursors", {}).get("after")
    return items, after_cursor, None


def is_reel(item):
    return (item.get("media_product_type") in ("REELS", "CLIPS")
            or item.get("media_type") == "VIDEO")


def discover(token, ig_id, username, limit):
    """Return (reels, error). reels = list of dicts with metrics."""
    reels, after, pages = [], None, 0
    while len(reels) < limit and pages < 20:
        items, after, err = fetch_media_page(token, ig_id, username, after)
        if err:
            return reels, err
        pages += 1
        for it in items:
            if is_reel(it):
                reels.append({
                    "username": username,
                    "shortcode": shortcode(it.get("permalink")),
                    "permalink": it.get("permalink"),
                    "caption": (it.get("caption") or "")[:500],
                    "like_count": it.get("like_count"),
                    "comments_count": it.get("comments_count"),
                    "timestamp": it.get("timestamp"),
                    "media_type": it.get("media_type"),
                    "media_product_type": it.get("media_product_type"),
                    "media_url": it.get("media_url"),   # direct file if the API gives it
                })
                if len(reels) >= limit:
                    break
        if not after or not items:
            break
        time.sleep(API_PAUSE)
    return reels[:limit], None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT,
                    help=f"Reels per account (default {DEFAULT_LIMIT})")
    ap.add_argument("--accounts", nargs="*", help="specific usernames (default: whole watchlist)")
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    args = ap.parse_args()

    token, uid = load_creds()
    preflight(token)
    if not uid:
        uid = resolve_user_id(token)
    print(f"IG user id: {uid}")

    accounts = [a.lower() for a in args.accounts] if args.accounts else parse_watchlist()
    print(f"Discovering up to {args.limit} Reel(s) each across {len(accounts)} account(s)…\n")

    already = set(FETCHED.read_text().split()) if FETCHED.exists() else set()
    already |= set(DISCOVERED.read_text().split()) if DISCOVERED.exists() else set()

    index = json.loads(INDEX.read_text()) if INDEX.exists() else {}
    new_urls, skipped, totals = [], [], 0
    for username in accounts:
        reels, err = discover(token, uid, username, args.limit)
        if err:
            print(f"  ⚠ {username}: {err}")
            skipped.append(username)
            time.sleep(API_PAUSE)
            continue
        fresh = [r for r in reels if r["shortcode"] and r["shortcode"] not in already]
        totals += len(reels)
        print(f"  ✓ {username}: {len(reels)} Reel(s) ({len(fresh)} new)")
        for r in reels:
            if r["shortcode"]:
                index[r["shortcode"]] = r          # metrics index (refresh each run)
        for r in fresh:
            new_urls.append((username, r["permalink"], r["shortcode"]))
            already.add(r["shortcode"])
        time.sleep(API_PAUSE)

    print(f"\nEnumerated {totals} Reel(s); {len(new_urls)} new to queue.")
    if skipped:
        print(f"Skipped (not a public business/creator acct — handle manually): {', '.join(skipped)}")

    if args.dry_run:
        print("\n[dry-run] nothing written.")
        return

    if new_urls:
        with INBOX.open("a") as f:
            f.write(f"\n# --- discovered {time.strftime('%Y-%m-%d')} "
                    f"({len(new_urls)} Reels via Graph API) ---\n")
            last = None
            for username, url, sc in new_urls:
                if username != last:
                    f.write(f"# {username}\n")
                    last = username
                f.write(url + "\n")
                with DISCOVERED.open("a") as d:
                    d.write(sc + "\n")
        print(f"Appended {len(new_urls)} URL(s) to {INBOX.name}.")

    INDEX.write_text(json.dumps(index, indent=2))
    print(f"Metrics written to {INDEX.name} ({len(index)} Reels total).")
    print("\nNext: .venv/bin/python fetch_reels.py  →  .venv/bin/python process_reels.py")


if __name__ == "__main__":
    main()
