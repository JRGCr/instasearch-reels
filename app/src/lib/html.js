// Server-rendered HTML. One layout, inline CSS — a clean, professional surface
// (reviewers judge legitimacy partly on how real the product looks).

import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./config.js";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

export function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export function redirect(location, headers = {}) {
  return new Response(null, { status: 302, headers: { location, ...headers } });
}

const CSS = `
  :root{--ink:#0f1222;--muted:#6b7280;--line:#e5e7eb;--bg:#f7f8fa;--brand:#5b3df5;--brand2:#d6249f;--card:#fff}
  *{box-sizing:border-box}
  body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg)}
  a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
  header.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--ink)}
  .logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand2));display:inline-block}
  .wrap{max-width:960px;margin:0 auto;padding:28px 22px}
  .muted{color:var(--muted)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin:14px 0}
  .btn{display:inline-block;background:var(--brand);color:#fff;padding:10px 16px;border-radius:9px;font-weight:600;border:0;cursor:pointer;font-size:15px}
  .btn:hover{text-decoration:none;filter:brightness(1.05)}
  .btn.secondary{background:#eef0f6;color:var(--ink)}
  .btn.danger{background:#fde8e8;color:#b42318}
  .fb{background:#1877f2}
  input[type=text]{padding:10px 12px;border:1px solid var(--line);border-radius:9px;font-size:15px;min-width:240px}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
  th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .pill{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#eef0f6;color:var(--muted)}
  .avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#eee;vertical-align:middle}
  .hero{padding:56px 22px;text-align:center;background:linear-gradient(180deg,#fff,transparent)}
  .hero h1{font-size:38px;margin:.2em 0}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
  .kpi{font-size:26px;font-weight:700}
  .trend-up{color:#067647}.trend-down{color:#b42318}
  .mediacard{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
  .mediathumb{width:72px;height:96px;border-radius:8px;object-fit:cover;background:#eee;flex:0 0 auto}
  footer{color:var(--muted);font-size:13px;padding:30px 22px;text-align:center;border-top:1px solid var(--line);margin-top:40px}
  .flash{padding:10px 14px;border-radius:9px;margin:12px 0}
  .flash.err{background:#fde8e8;color:#b42318}.flash.ok{background:#e7f6ed;color:#067647}
`;

export function layout({ title, body, user }) {
  const nav = user
    ? `<div class="muted">${esc(user.name || user.username || "Signed in")} · <a href="/logout">Sign out</a></div>`
    : `<a class="btn fb" href="/auth/login">Continue with Facebook</a>`;
  return `<!doctype html><html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} · ${PRODUCT_NAME}</title>
  <meta name="description" content="${esc(PRODUCT_TAGLINE)}">
  <style>${CSS}</style></head><body>
  <header class="nav">
    <a class="brand" href="/"><span class="logo"></span>${PRODUCT_NAME}</a>
    ${nav}
  </header>
  ${body}
  <footer>
    ${PRODUCT_NAME} — ${esc(PRODUCT_TAGLINE)}.<br>
    <a href="/">Home</a> · <a href="/privacy">Privacy</a> · <a href="/data-deletion">Data deletion</a> · <a href="/terms">Terms</a>
    <br>Uses the Instagram Graph API. Not affiliated with or endorsed by Meta.
  </footer>
  </body></html>`;
}

export function num(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US");
}

// Tiny inline SVG sparkline for a series of numbers (follower trend).
export function sparkline(values, { w = 120, h = 28 } = {}) {
  const pts = values.filter((v) => v != null);
  if (pts.length < 2) return `<span class="muted">—</span>`;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const step = w / (pts.length - 1);
  const d = pts
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ");
  const up = pts[pts.length - 1] >= pts[0];
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="${
    up ? "#067647" : "#b42318"
  }" stroke-width="2" points="${d}"/></svg>`;
}
