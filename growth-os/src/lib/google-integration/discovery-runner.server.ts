// Server-only orchestrator: run discovery, persist resources, auto-activate agents.
// Kept in a .server.ts so it never ships to the browser bundle.
import { getGoogleClient } from "./client.server";
import { decryptToken } from "./crypto.server";
import { revokeRefreshToken } from "./oauth.server";
import { discoverAll } from "./discovery.server";
import type { GoogleResourceType } from "./scopes";

// Map Google resource types → agent slugs used in `agents_registry`.
// Unknown slugs are ignored silently (no rows written elsewhere).
const AGENT_SLUG_BY_RESOURCE: Partial<Record<GoogleResourceType, string>> = {
  gbp_location: "gbp",
  ga4_property: "analytics",
  gsc_site: "seo",
  gmail_address: "gmail",
  ads_customer: "google-ads",
};

import type { ProductDiagnostic } from "./discovery.server";

export async function runDiscoveryForUser(userId: string): Promise<{
  ok: boolean;
  perProduct: Record<string, number>;
  activatedAgents: string[];
  diagnostics: ProductDiagnostic[];
  error?: string;
}> {
  const client = await getGoogleClient(userId);
  if (!client) return { ok: false, perProduct: {}, activatedAgents: [], diagnostics: [], error: "not_connected" };

  const { resources, perProduct, diagnostics } = await discoverAll(client.accessToken, client.email);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Wipe previous rows for this user, then re-insert. Simpler than diffing and
  // safe because RLS + admin gate the mutation.
  await supabaseAdmin.from("google_discovered_resources").delete().eq("user_id", userId);

  if (resources.length > 0) {
    const rows = resources.map((r) => ({
      user_id: userId,
      resource_type: r.resource_type,
      resource_id: r.resource_id,
      display_name: r.display_name,
      // metadata column is jsonb; cast to satisfy generated Json type.
      metadata: r.metadata as unknown as Record<string, never>,
    }));
    await supabaseAdmin.from("google_discovered_resources").insert(rows);
  }

  // Auto-activation: enable matching agents when a resource is present.
  // agents_registry uses `slug` as its PK and `enabled` as the on/off flag.
  const activatedAgents: string[] = [];
  const seenTypes = new Set(resources.map((r) => r.resource_type));
  for (const [resourceType, slug] of Object.entries(AGENT_SLUG_BY_RESOURCE)) {
    if (!seenTypes.has(resourceType as GoogleResourceType)) continue;
    if (!slug) continue;
    // Only update rows that exist — never insert unknown slugs.
    const { data: existing } = await supabaseAdmin
      .from("agents_registry")
      .select("slug, enabled")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) continue;
    if (existing.enabled) {
      activatedAgents.push(slug); // already active — still report it
      continue;
    }
    const { error: updErr } = await supabaseAdmin
      .from("agents_registry")
      .update({ enabled: true })
      .eq("slug", slug);
    if (!updErr) activatedAgents.push(slug);
  }

  return { ok: true, perProduct, activatedAgents, diagnostics };
}

export async function disconnectForUser(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
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
  await supabaseAdmin.from("google_discovered_resources").delete().eq("user_id", userId);
  await supabaseAdmin.from("google_integrations").delete().eq("user_id", userId);
}
