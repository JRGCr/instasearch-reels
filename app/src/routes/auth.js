// Facebook Login (OAuth) flow: /auth/login -> Meta dialog -> /auth/callback.
// business_discovery lives on the Facebook-Login product, so this is FB Login.

import { loginUrl, exchangeCode, debugToken, resolveIgUser, me } from "../lib/graph.js";
import {
  createSession,
  destroySession,
  sessionCookie,
  issueState,
  consumeState,
} from "../lib/session.js";
import { redirect, html, layout, esc } from "../lib/html.js";
import { CRITICAL_SCOPE } from "../lib/config.js";

function redirectUri(url) {
  return `${url.origin}/auth/callback`;
}

export async function login(req, env, url) {
  const state = await issueState(env);
  return redirect(loginUrl(env, redirectUri(url), state));
}

export async function callback(req, env, url) {
  const err = url.searchParams.get("error");
  if (err) return authError(`Facebook returned: ${url.searchParams.get("error_description") || err}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return authError("No authorization code returned.");
  if (!(await consumeState(env, state))) return authError("Invalid or expired login state. Please try again.");

  let token, info, igUser, name;
  try {
    ({ token } = await exchangeCode(env, code, redirectUri(url)));
    info = await debugToken(token);
    if (!info.valid) return authError("The access token was rejected by Meta.");
    name = await me(token);
    igUser = await resolveIgUser(token);
  } catch (e) {
    return authError(e.message);
  }

  const data = {
    token,
    igUserId: igUser.igUserId,
    igUsername: igUser.username,
    name: name || igUser.name || igUser.username,
    hasInsights: info.hasInsights,
    tokenExpiresAt: info.expiresAt,
  };
  const sid = await createSession(env, data);
  return redirect("/app", { "set-cookie": sessionCookie(sid) });
}

export async function logout(req, env) {
  await destroySession(env, req);
  return redirect("/", { "set-cookie": sessionCookie("", { clear: true }) });
}

function authError(message) {
  const body = `<div class="wrap"><div class="card">
    <h2>Sign-in problem</h2>
    <div class="flash err">${esc(message)}</div>
    <p class="muted">If this mentions the <code>${CRITICAL_SCOPE}</code> permission, the app is
    still in Standard Access for it — that's the Advanced Access review this app is being submitted for.</p>
    <a class="btn" href="/auth/login">Try again</a> <a class="btn secondary" href="/">Home</a>
  </div></div>`;
  return html(layout({ title: "Sign-in problem", body }), 400);
}
