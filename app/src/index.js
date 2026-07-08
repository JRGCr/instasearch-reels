// InstaSearch Worker entry + router.
// Public: /  /privacy  /data-deletion  /terms  and the OAuth endpoints.
// Authenticated: everything under /app.

import { getSession } from "./lib/session.js";
import { html, layout, redirect } from "./lib/html.js";
import * as auth from "./routes/auth.js";
import * as pages from "./routes/pages.js";
import * as app from "./routes/app.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    try {
      // --- OAuth ---
      if (pathname === "/auth/login") return auth.login(req, env, url);
      if (pathname === "/auth/callback") return auth.callback(req, env, url);
      if (pathname === "/logout") return auth.logout(req, env);

      // Session (may be null) — needed for public pages' nav + gating.
      const user = await getSession(env, req);

      // --- Public pages ---
      if (pathname === "/") return pages.landing(req, env, url, user);
      if (pathname === "/privacy") return pages.privacy(req, env, url, user);
      if (pathname === "/data-deletion") return pages.dataDeletion(req, env, url, user);
      if (pathname === "/terms") return pages.terms(req, env, url, user);
      if (pathname === "/health") return new Response("ok", { status: 200 });

      // --- Authenticated app ---
      if (pathname === "/app" || pathname.startsWith("/app/")) {
        if (!user) return redirect("/auth/login");

        if (pathname === "/app" && method === "GET") return app.dashboard(req, env, url, user);
        if (pathname === "/app/add" && method === "POST") return app.addAccount(req, env, url, user);
        if (pathname === "/app/refresh" && method === "GET") return app.refreshAll(req, env, url, user);
        if (pathname === "/app/remove" && method === "POST") return app.removeAccount(req, env, url, user);
        if (pathname === "/app/delete-all" && method === "POST") return app.deleteAll(req, env, url, user);

        const m = pathname.match(/^\/app\/account\/(\d+)$/);
        if (m && method === "GET") return app.accountDetail(req, env, url, user, Number(m[1]));

        return notFound(user);
      }

      return notFound(user);
    } catch (e) {
      return html(
        layout({
          title: "Error",
          body: `<div class="wrap"><div class="card"><h2>Something went wrong</h2>
            <p class="muted">${e.message}</p><a class="btn" href="/">Home</a></div></div>`,
        }),
        500
      );
    }
  },
};

function notFound(user) {
  return html(
    layout({
      title: "Not found",
      body: `<div class="wrap"><div class="card"><h2>404</h2><p class="muted">Page not found.</p>
        <a class="btn" href="/">Home</a></div></div>`,
      user,
    }),
    404
  );
}
