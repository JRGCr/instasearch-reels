// Session handling: an opaque session id in an HttpOnly cookie, backed by KV.
// KV value holds the Graph token + resolved IG account so the token never
// touches the client.

import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "./config.js";

function randomId() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function parseCookies(req) {
  const out = {};
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function createSession(env, data) {
  const sid = randomId();
  await env.SESSIONS.put(`sess:${sid}`, JSON.stringify(data), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return sid;
}

export async function getSession(env, req) {
  const sid = parseCookies(req)[SESSION_COOKIE];
  if (!sid) return null;
  const raw = await env.SESSIONS.get(`sess:${sid}`);
  if (!raw) return null;
  try {
    return { sid, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export async function destroySession(env, req) {
  const sid = parseCookies(req)[SESSION_COOKIE];
  if (sid) await env.SESSIONS.delete(`sess:${sid}`);
}

export function sessionCookie(sid, { clear = false } = {}) {
  const attrs = [
    `${SESSION_COOKIE}=${clear ? "" : sid}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    clear ? "Max-Age=0" : `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  return attrs.join("; ");
}

// Short-lived signed state for OAuth CSRF protection (stored in KV too).
export async function issueState(env) {
  const state = randomId();
  await env.SESSIONS.put(`state:${state}`, "1", { expirationTtl: 600 });
  return state;
}

export async function consumeState(env, state) {
  if (!state) return false;
  const ok = await env.SESSIONS.get(`state:${state}`);
  if (ok) await env.SESSIONS.delete(`state:${state}`);
  return !!ok;
}
