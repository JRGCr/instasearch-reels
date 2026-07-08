// Thin Instagram Graph API client for the Worker.
// Mirrors the sanctioned business_discovery path used by discover_reels.py.

import { GRAPH, OAUTH_DIALOG, SCOPES, MEDIA_FIELDS, CRITICAL_SCOPE } from "./config.js";

export function loginUrl(env, redirectUri, state) {
  const p = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES.join(","),
    response_type: "code",
  });
  return `${OAUTH_DIALOG}?${p}`;
}

async function apiGet(path, params) {
  const url = `${GRAPH}/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const data = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
  return data;
}

// Exchange an OAuth code for a short-lived token, then upgrade to long-lived (~60d).
export async function exchangeCode(env, code, redirectUri) {
  const short = await apiGet("oauth/access_token", {
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });
  if (short.error) throw new Error(short.error.message || "code exchange failed");

  const long = await apiGet("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: short.access_token,
  });
  if (long.error) throw new Error(long.error.message || "long-lived exchange failed");
  return { token: long.access_token, expiresIn: long.expires_in || 60 * 24 * 3600 };
}

// Validate a token and confirm the critical scope is present.
export async function debugToken(token) {
  const data = await apiGet("debug_token", { input_token: token, access_token: token });
  const info = data.data || {};
  const scopes = info.scopes || [];
  return {
    valid: !!info.is_valid,
    scopes,
    hasInsights: scopes.includes(CRITICAL_SCOPE),
    expiresAt: info.expires_at || null,
    app: info.application || null,
  };
}

// Resolve the caller's own IG business account id via their Pages (the querying account).
export async function resolveIgUser(token) {
  const data = await apiGet("me/accounts", {
    fields: "name,instagram_business_account{id,username,name}",
    access_token: token,
  });
  if (data.error) throw new Error(data.error.message || "could not list Pages");
  for (const page of data.data || []) {
    const iba = page.instagram_business_account;
    if (iba && iba.id) return { igUserId: iba.id, username: iba.username, name: iba.name || page.name };
  }
  throw new Error(
    "No Instagram professional account is connected to your Facebook Pages. " +
      "Connect an IG Business/Creator account to a Page, then try again."
  );
}

// Fetch the caller's own profile (name/username) for display.
export async function me(token) {
  const data = await apiGet("me", { fields: "name", access_token: token });
  return data.error ? null : data.name;
}

// Run business_discovery for one public target, pulling profile + a page of media.
// Returns { profile, media } or throws with the Graph message.
export async function businessDiscovery(token, igUserId, username, { limit = 12, after = null } = {}) {
  let edge = `media.limit(${limit})`;
  if (after) edge = `media.after(${after}).limit(${limit})`;
  const fields =
    `business_discovery.username(${username})` +
    `{followers_count,media_count,username,name,biography,website,profile_picture_url,` +
    `${edge}{${MEDIA_FIELDS}}}`;
  const data = await apiGet(igUserId, { fields, access_token: token });
  if (data.error) throw new Error(data.error.message || "business_discovery failed");
  const bd = data.business_discovery;
  if (!bd) throw new Error("No data returned — the account may be personal, private, or age-gated.");
  const media = bd.media || {};
  return {
    profile: {
      username: bd.username || username,
      name: bd.name || null,
      biography: bd.biography || null,
      website: bd.website || null,
      profile_picture_url: bd.profile_picture_url || null,
      followers_count: bd.followers_count ?? null,
      media_count: bd.media_count ?? null,
    },
    media: media.data || [],
    after: media.paging?.cursors?.after || null,
  };
}

export function isReel(item) {
  return (
    item.media_product_type === "REELS" ||
    item.media_product_type === "CLIPS" ||
    item.media_type === "VIDEO"
  );
}
