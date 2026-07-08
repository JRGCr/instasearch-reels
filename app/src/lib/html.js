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
  :root{
    --ink:#0d1020;--muted:#697089;--line:#e7e9f0;--bg:#f6f7fb;--card:#fff;
    --brand:#5b3df5;--brand2:#d6249f;--brand-ink:#4b2fe0;
    --ok:#067647;--ok-bg:#e7f6ed;--err:#b42318;--err-bg:#fdecec;
    --grad:linear-gradient(135deg,#5b3df5,#d6249f);
    --r:14px;--r-sm:10px;
    --sh:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.06);
    --sh-lg:0 10px 30px -12px rgba(59,30,120,.28);
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    font-size:15px;line-height:1.55;color:var(--ink);background:var(--bg);
    background-image:radial-gradient(60rem 40rem at 80% -10%,rgba(214,36,159,.06),transparent),
      radial-gradient(50rem 40rem at -10% 0,rgba(91,61,245,.07),transparent);
    background-attachment:fixed;-webkit-font-smoothing:antialiased}
  h1,h2,h3{letter-spacing:-.01em;line-height:1.2}
  a{color:var(--brand-ink);text-decoration:none}a:hover{text-decoration:underline}
  header.nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 22px;
    background:rgba(255,255,255,.8);backdrop-filter:saturate(180%) blur(12px);
    border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--ink);font-size:17px;letter-spacing:-.02em}
  .brand:hover{text-decoration:none}
  .logo{width:30px;height:30px;border-radius:9px;background:var(--grad);display:inline-block;
    box-shadow:var(--sh-lg);position:relative}
  .logo::before{content:"";position:absolute;width:11px;height:11px;border:2.5px solid #fff;border-radius:50%;top:6px;left:6px}
  .logo::after{content:"";position:absolute;width:6px;height:2.5px;background:#fff;border-radius:2px;transform:rotate(45deg);top:19px;left:16px}
  .wrap{max-width:980px;margin:0 auto;padding:30px 22px 10px}
  .muted{color:var(--muted)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px 22px;margin:16px 0;box-shadow:var(--sh)}
  .card h2{margin-top:0}
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff;padding:10px 17px;
    border-radius:var(--r-sm);font-weight:600;border:0;cursor:pointer;font-size:14.5px;line-height:1;
    box-shadow:var(--sh);transition:transform .08s ease,filter .15s ease,box-shadow .15s ease;text-decoration:none}
  .btn:hover{text-decoration:none;filter:brightness(1.05);box-shadow:var(--sh-lg)}
  .btn:active{transform:translateY(1px)}
  .btn.secondary{background:#eef0f6;color:var(--ink);box-shadow:none}
  .btn.secondary:hover{background:#e6e9f2;filter:none}
  .btn.danger{background:var(--err-bg);color:var(--err);box-shadow:none}
  .btn.danger:hover{background:#fbdcdc;filter:none}
  .fb{background:#1877f2}
  input[type=text]{padding:10px 13px;border:1px solid var(--line);border-radius:var(--r-sm);font-size:15px;
    min-width:240px;background:#fff;color:var(--ink);transition:border-color .15s,box-shadow .15s;font-family:inherit}
  input[type=text]:focus{outline:0;border-color:var(--brand);box-shadow:0 0 0 3px rgba(91,61,245,.15)}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
  tbody tr{transition:background .12s}
  tbody tr:hover{background:#faf9ff}
  tbody tr:last-child td{border-bottom:0}
  th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .pill{display:inline-block;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:999px;
    background:#f0ecff;color:var(--brand-ink);letter-spacing:.02em}
  .avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#eef0f6;vertical-align:middle;border:1px solid var(--line)}
  .hero{padding:70px 22px 40px;text-align:center;max-width:720px;margin:0 auto}
  .hero .eyebrow{display:inline-block;font-size:12.5px;font-weight:600;color:var(--brand-ink);
    background:#f0ecff;padding:5px 12px;border-radius:999px;margin-bottom:18px}
  .hero h1{font-size:46px;margin:.1em 0;letter-spacing:-.03em;
    background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
  .kpi{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:2px}
  .trend-up{color:var(--ok);font-weight:600}.trend-down{color:var(--err);font-weight:600}
  .mediacard{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
  .mediacard:last-child{border-bottom:0}
  .mediathumb{width:74px;height:98px;border-radius:var(--r-sm);object-fit:cover;background:#eef0f6;flex:0 0 auto;border:1px solid var(--line)}
  footer{color:var(--muted);font-size:13px;padding:34px 22px;text-align:center;border-top:1px solid var(--line);margin-top:48px}
  footer a{color:var(--muted)}
  .flash{padding:11px 15px;border-radius:var(--r-sm);margin:12px 0;font-size:14.5px;border:1px solid transparent}
  .flash.err{background:var(--err-bg);color:var(--err);border-color:#f6c9c9}
  .flash.ok{background:var(--ok-bg);color:var(--ok);border-color:#bfe6cf}
  @media(max-width:560px){.hero h1{font-size:34px}.wrap{padding:22px 16px}.card{padding:16px}}
`;

export function layout({ title, body, user }) {
  const nav = user
    ? `<div class="muted">${esc(user.name || user.username || "Signed in")} · <a href="/logout">Sign out</a></div>`
    : `<a class="btn fb" href="/auth/login">Continue with Facebook</a>`;
  const favicon =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b3df5"/><stop offset="1" stop-color="#d6249f"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><circle cx="14" cy="14" r="6" fill="none" stroke="#fff" stroke-width="2.5"/><line x1="18.5" y1="18.5" x2="24" y2="24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`
    );
  return `<!doctype html><html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} · ${PRODUCT_NAME}</title>
  <meta name="description" content="${esc(PRODUCT_TAGLINE)}">
  <link rel="icon" href="${favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
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

// Inline SVG sparkline for a series of numbers (follower trend): line + soft
// area fill + endpoint dot. Colour reflects direction over the window.
export function sparkline(values, { w = 168, h = 46 } = {}) {
  const pts = values.filter((v) => v != null);
  if (pts.length < 2) return `<span class="muted">—</span>`;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const pad = 3; // keep stroke off the edges
  const step = (w - pad * 2) / (pts.length - 1);
  const xy = pts.map((v, i) => [
    +(pad + i * step).toFixed(1),
    +(pad + (h - pad * 2) * (1 - (v - min) / span)).toFixed(1),
  ]);
  const line = xy.map((p) => p.join(",")).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  const up = pts[pts.length - 1] >= pts[0];
  const c = up ? "#067647" : "#b42318";
  const last = xy[xy.length - 1];
  const gid = up ? "spkU" : "spkD";
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="trend">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${area}" fill="url(#${gid})"/>
    <polyline fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${line}"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${c}"/>
  </svg>`;
}
