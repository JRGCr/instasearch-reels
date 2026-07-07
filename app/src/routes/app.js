// Authenticated dashboard: track competitor accounts, refresh metrics (saving
// snapshots), view per-account trends and top media. This is the real product
// AND the surface App Review reviewers exercise.

import { businessDiscovery, isReel } from "../lib/graph.js";
import * as db from "../lib/db.js";
import { html, layout, esc, num, sparkline, redirect } from "../lib/html.js";
import { PRODUCT_NAME } from "../lib/config.js";

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function requireInsights(user) {
  if (user.hasInsights) return null;
  return `<div class="flash err">This account's token does not yet have the
    <code>instagram_manage_insights</code> permission at Advanced Access, so live
    <code>business_discovery</code> calls will return a permission error until Meta approves it.
    You can still explore the interface.</div>`;
}

// GET /app — dashboard: tracked accounts + add form.
export async function dashboard(req, env, url, user) {
  const accounts = await db.listAccounts(env, user.igUserId);
  const flash = url.searchParams.get("msg");
  const flashErr = url.searchParams.get("err");
  const rows =
    accounts.length === 0
      ? `<tr><td colspan="5" class="muted">No accounts tracked yet. Add a public business or creator username above to start benchmarking.</td></tr>`
      : accounts
          .map(
            (a) => `<tr>
        <td><a href="/app/account/${a.id}">
          ${a.profile_picture_url ? `<img class="avatar" src="${esc(a.profile_picture_url)}" alt="">` : `<span class="avatar"></span>`}
          <strong>@${esc(a.username)}</strong></a>
          ${a.name ? `<div class="muted">${esc(a.name)}</div>` : ""}</td>
        <td class="num">${num(a.followers_count)}</td>
        <td class="num">${num(a.media_count)}</td>
        <td class="muted">${a.last_captured ? new Date(a.last_captured * 1000).toISOString().slice(0, 10) : "never"}</td>
        <td class="num">
          <form method="POST" action="/app/remove" style="display:inline"
            onsubmit="return confirm('Stop tracking @${esc(a.username)}?')">
            <input type="hidden" name="id" value="${a.id}">
            <button class="btn danger" type="submit">Remove</button>
          </form></td>
      </tr>`
          )
          .join("");

  const body = `<div class="wrap">
    ${flash ? `<div class="flash ok">${esc(flash)}</div>` : ""}
    ${flashErr ? `<div class="flash err">${esc(flashErr)}</div>` : ""}
    ${requireInsights(user) || ""}
    <div class="card">
      <h2>Your watchlist</h2>
      <p class="muted">Signed in as the Instagram account you manage:
        <strong>@${esc(user.igUsername || "—")}</strong>.
        Add public business/creator accounts to benchmark them.</p>
      <form method="POST" action="/app/add" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <input type="text" name="username" placeholder="competitor username (no @)" required
          pattern="[A-Za-z0-9_.]+" autocapitalize="none" autocomplete="off">
        <button class="btn" type="submit">Track account</button>
        ${accounts.length ? `<a class="btn secondary" href="/app/refresh">Refresh all metrics</a>` : ""}
      </form>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Account</th><th class="num">Followers</th><th class="num">Posts</th>
          <th>Last checked</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
  return html(layout({ title: "Dashboard", body, user }));
}

// Shared: pull one account via business_discovery and persist profile + snapshot + media.
async function captureAccount(env, user, username) {
  const res = await businessDiscovery(user.token, user.igUserId, username, { limit: 24 });
  const now = nowSec();
  const accountId = await db.upsertAccount(env, user.igUserId, res.profile, now);
  await db.addSnapshot(env, accountId, res.profile, now);
  await db.upsertMedia(env, accountId, res.media, now);
  return { accountId, profile: res.profile, count: res.media.length };
}

// POST /app/add
export async function addAccount(req, env, url, user) {
  const form = await req.formData();
  const username = String(form.get("username") || "").trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_.]+$/.test(username)) return redirect("/app?err=" + encodeURIComponent("Invalid username."));
  try {
    const { profile, count } = await captureAccount(env, user, username);
    return redirect(
      "/app?msg=" + encodeURIComponent(`Tracking @${profile.username} — ${num(profile.followers_count)} followers, ${count} posts captured.`)
    );
  } catch (e) {
    return redirect("/app?err=" + encodeURIComponent(`Couldn't add @${username}: ${e.message}`));
  }
}

// GET /app/refresh — re-capture every tracked account (new snapshots => trends).
export async function refreshAll(req, env, url, user) {
  const accounts = await db.listAccounts(env, user.igUserId);
  let ok = 0;
  const errs = [];
  for (const a of accounts) {
    try {
      await captureAccount(env, user, a.username);
      ok++;
    } catch (e) {
      errs.push(`@${a.username}: ${e.message}`);
    }
  }
  const msg = `Refreshed ${ok}/${accounts.length} account(s).`;
  return redirect(
    errs.length ? "/app?err=" + encodeURIComponent(`${msg} Errors — ${errs.join("; ")}`) : "/app?msg=" + encodeURIComponent(msg)
  );
}

// POST /app/remove
export async function removeAccount(req, env, url, user) {
  const form = await req.formData();
  await db.deleteAccount(env, user.igUserId, Number(form.get("id")));
  return redirect("/app?msg=" + encodeURIComponent("Removed."));
}

// POST /app/delete-all — used by the data-deletion page.
export async function deleteAll(req, env, url, user) {
  const n = await db.deleteAllForOwner(env, user.igUserId);
  return redirect("/app?msg=" + encodeURIComponent(`Deleted all data (${n} account(s)).`));
}

// GET /app/account/:id — detail: follower trend + top media.
export async function accountDetail(req, env, url, user, id) {
  const acct = await db.getAccount(env, user.igUserId, id);
  if (!acct) return html(layout({ title: "Not found", body: `<div class="wrap"><div class="card">Account not found. <a href="/app">Back</a></div></div>`, user }), 404);

  const snaps = await db.getSnapshots(env, id);
  const media = await db.getMedia(env, id);
  const followerSeries = snaps.map((s) => s.followers_count);
  const first = followerSeries[0], last = followerSeries[followerSeries.length - 1];
  const delta = first != null && last != null ? last - first : null;
  const deltaHtml =
    delta == null ? "" : `<span class="${delta >= 0 ? "trend-up" : "trend-down"}">${delta >= 0 ? "▲" : "▼"} ${num(Math.abs(delta))}</span>`;

  const reels = media.filter(isReel);
  const topByLikes = [...media].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 12);
  const mediaHtml =
    topByLikes.length === 0
      ? `<p class="muted">No media captured yet.</p>`
      : topByLikes
          .map(
            (m) => `<div class="mediacard">
        ${m.thumbnail_url ? `<img class="mediathumb" src="${esc(m.thumbnail_url)}" alt="">` : `<div class="mediathumb"></div>`}
        <div>
          <div><span class="pill">${esc(m.media_product_type || m.media_type || "post")}</span>
            <span class="muted">${m.timestamp ? new Date(m.timestamp).toISOString().slice(0, 10) : ""}</span></div>
          <div>❤ ${num(m.like_count)} &nbsp; 💬 ${num(m.comments_count)}</div>
          <div class="muted">${esc((m.caption || "").slice(0, 160))}${(m.caption || "").length > 160 ? "…" : ""}</div>
          ${m.permalink ? `<a href="${esc(m.permalink)}" target="_blank" rel="noopener">View on Instagram ↗</a>` : ""}
        </div>
      </div>`
          )
          .join("");

  const body = `<div class="wrap">
    <p><a href="/app">← Back to dashboard</a></p>
    <div class="card">
      <div style="display:flex;gap:14px;align-items:center">
        ${acct.profile_picture_url ? `<img class="avatar" style="width:56px;height:56px" src="${esc(acct.profile_picture_url)}" alt="">` : ""}
        <div><h1 style="margin:0">@${esc(acct.username)}</h1>
          <div class="muted">${esc(acct.name || "")}</div></div>
      </div>
      ${acct.biography ? `<p class="muted">${esc(acct.biography)}</p>` : ""}
      ${acct.website ? `<p><a href="${esc(acct.website)}" target="_blank" rel="noopener">${esc(acct.website)}</a></p>` : ""}
      <div class="grid" style="margin-top:12px">
        <div><div class="muted">Followers</div><div class="kpi">${num(last)}</div>${deltaHtml} since first check</div>
        <div><div class="muted">Follower trend</div>${sparkline(followerSeries)}
          <div class="muted">${snaps.length} snapshot(s)</div></div>
        <div><div class="muted">Posts captured</div><div class="kpi">${num(media.length)}</div>
          <span class="muted">${reels.length} reels</span></div>
      </div>
    </div>
    <div class="card">
      <h2>Top content by engagement</h2>
      ${mediaHtml}
    </div>
  </div>`;
  return html(layout({ title: `@${acct.username}`, body, user }));
}
