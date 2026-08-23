// Public OAuth callback for the Google Integration Framework.
// Under /api/public/* so it bypasses the app's auth gate (users arrive
// mid-flow from Google without a session cookie). Security is enforced by
// the HMAC-signed `state` token which binds the code exchange to the admin
// user who initiated the flow.
import { createFileRoute } from "@tanstack/react-router";
import { verifyState } from "@/lib/google-integration/crypto.server";
import { encryptToken } from "@/lib/google-integration/crypto.server";
import { exchangeCodeForTokens, fetchUserinfo } from "@/lib/google-integration/oauth.server";

function htmlResponse(status: number, title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:14px/1.5 system-ui,sans-serif;margin:0;padding:48px;background:#0b0b12;color:#e6e6f0}
.card{max-width:520px;margin:0 auto;background:#15151f;border:1px solid #24243a;border-radius:12px;padding:28px}
h1{margin:0 0 8px;font-size:18px} p{color:#a0a0b8} a{color:#7aa2ff}</style></head>
<body><div class="card"><h1>${title}</h1>${body}</div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const Route = createFileRoute("/api/public/google/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const providerError = url.searchParams.get("error");

        if (providerError) {
          return htmlResponse(400, "Google connection cancelled", `<p>${providerError}</p><p><a href="/settings/integrations/google">Return to Settings</a></p>`);
        }
        if (!code || !state) {
          return htmlResponse(400, "Missing OAuth parameters", `<p>The callback was called without a code or state token.</p>`);
        }

        const payload = verifyState(state);
        if (!payload) {
          return htmlResponse(400, "Invalid or expired state token", `<p>Please restart the connection from Settings.</p>`);
        }

        try {
          const tokens = await exchangeCodeForTokens({ code, origin: payload.o });
          if (!tokens.refresh_token) {
            // Google only returns a refresh_token on first consent with prompt=consent.
            // If the account was previously connected, revoke it in Google's account
            // settings, then reconnect. Surface that clearly.
            return htmlResponse(
              400,
              "No refresh token returned",
              `<p>Google did not return a refresh token. Revoke this app in your Google Account → Security → Third-party access, then reconnect.</p><p><a href="/settings/integrations/google">Return to Settings</a></p>`,
            );
          }

          const info = await fetchUserinfo(tokens.access_token);
          const enc = encryptToken(tokens.refresh_token);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: upsertErr } = await supabaseAdmin.from("google_integrations").upsert(
            {
              user_id: payload.u,
              google_email: info.email,
              refresh_token_ciphertext: enc.ciphertext,
              refresh_token_iv: enc.iv,
              refresh_token_tag: enc.tag,
              scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
              connected_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          if (upsertErr) throw upsertErr;

          // Kick off discovery immediately so the user sees resources on return.
          const { runDiscoveryForUser } = await import("@/lib/google-integration/discovery-runner.server");
          const disc = await runDiscoveryForUser(payload.u).catch((e) => ({
            ok: false,
            perProduct: {} as Record<string, number>,
            activatedAgents: [] as string[],
            error: e instanceof Error ? e.message : String(e),
          }));

          const summary = Object.entries(disc.perProduct ?? {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ");
          const activated = (disc.activatedAgents ?? []).join(", ") || "none";
          return htmlResponse(
            200,
            "Google connected",
            `<p>Signed in as <strong>${info.email}</strong>.</p>
             <p>Discovered — ${summary || "no resources yet"}.</p>
             <p>Agents activated: ${activated}.</p>
             <p><a href="/settings/integrations/google">Return to Settings</a></p>
             <script>setTimeout(function(){location.replace("/settings/integrations/google")},1500)</script>`,
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return htmlResponse(
            500,
            "Google connection failed",
            `<p>${msg.replace(/</g, "&lt;")}</p><p><a href="/settings/integrations/google">Return to Settings</a></p>`,
          );
        }
      },
    },
  },
});
