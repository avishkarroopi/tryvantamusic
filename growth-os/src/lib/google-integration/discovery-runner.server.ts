// Server-only orchestrator: run discovery, persist resources, auto-activate agents.
// Kept in a .server.ts so it never ships to the browser bundle.
//
// Correction (2026-09-02, same root cause as elsewhere): this used
// `supabaseAdmin` throughout, which can never authenticate on Lovable
// Cloud. Now accepts an optional real `supa` client (pass context.supabase
// when called from an authenticated server function); when omitted (the
// OAuth callback has no session to give it), falls back to
// getServiceSupabase() -- a real, dedicated 'admin'-role service account,
// not a service-role bypass.
import { getGoogleClient } from "./client.server";
import { decryptToken } from "./crypto.server";
import { revokeRefreshToken } from "./oauth.server";
import { discoverAll } from "./discovery.server";
import { getServiceSupabase } from "@/lib/service-auth.server";
import type { GoogleResourceType } from "./scopes";
import type { ProductDiagnostic } from "./discovery.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

// Map Google resource types → agent slugs used in `agents_registry`.
// Unknown slugs are ignored silently (no rows written elsewhere).
const AGENT_SLUG_BY_RESOURCE: Partial<Record<GoogleResourceType, string>> = {
  gbp_location: "gbp",
  ga4_property: "analytics",
  gsc_site: "seo",
  gmail_address: "gmail",
  ads_customer: "google-ads",
};

export async function runDiscoveryForUser(userId: string, supaIn?: AnySupa): Promise<{
  ok: boolean;
  perProduct: Record<string, number>;
  activatedAgents: string[];
  diagnostics: ProductDiagnostic[];
  error?: string;
}> {
  const supa = supaIn ?? (await getServiceSupabase());
  const client = await getGoogleClient(userId, supa);
  if (!client) return { ok: false, perProduct: {}, activatedAgents: [], diagnostics: [], error: "not_connected" };

  const { resources, perProduct, diagnostics } = await discoverAll(client.accessToken, client.email);

  // Wipe previous rows for this user, then re-insert. Simpler than diffing and
  // safe because RLS + the 'admin' role gate the mutation.
  await supa.from("google_discovered_resources").delete().eq("user_id", userId);

  if (resources.length > 0) {
    const rows = resources.map((r) => ({
      user_id: userId,
      resource_type: r.resource_type,
      resource_id: r.resource_id,
      display_name: r.display_name,
      // metadata column is jsonb; cast to satisfy generated Json type.
      metadata: r.metadata as unknown as Record<string, never>,
    }));
    await supa.from("google_discovered_resources").insert(rows);
  }

  // Auto-activation: enable matching agents when a resource is present.
  // agents_registry uses `slug` as its PK and `enabled` as the on/off flag.
  const activatedAgents: string[] = [];
  const seenTypes = new Set(resources.map((r) => r.resource_type));
  for (const [resourceType, slug] of Object.entries(AGENT_SLUG_BY_RESOURCE)) {
    if (!seenTypes.has(resourceType as GoogleResourceType)) continue;
    if (!slug) continue;
    // Only update rows that exist — never insert unknown slugs.
    const { data: existing } = await supa
      .from("agents_registry")
      .select("slug, enabled")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) continue;
    if (existing.enabled) {
      activatedAgents.push(slug); // already active — still report it
      continue;
    }
    const { error: updErr } = await supa
      .from("agents_registry")
      .update({ enabled: true })
      .eq("slug", slug);
    if (!updErr) activatedAgents.push(slug);
  }

  return { ok: true, perProduct, activatedAgents, diagnostics };
}

export async function disconnectForUser(userId: string, supaIn?: AnySupa): Promise<void> {
  const supa = supaIn ?? (await getServiceSupabase());
  const { data } = await supa
    .from("google_integrations")
    .select("refresh_token_ciphertext, refresh_token_iv, refresh_token_tag")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) {
    try {
      const rt = decryptToken({
        ciphertext: data.refresh_token_ciphertext,
        iv: data.refresh_token_iv,
        tag: data.refresh_token_tag,
      });
      await revokeRefreshToken(rt);
    } catch {
      /* best-effort */
    }
  }
  await supa.from("google_discovered_resources").delete().eq("user_id", userId);
  await supa.from("google_integrations").delete().eq("user_id", userId);
}
