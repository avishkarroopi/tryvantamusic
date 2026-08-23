// Server-only: reusable Google API client for other server modules to consume.
// Usage:
//   const client = await getGoogleClient(userId);
//   if (client) fetch(url, { headers: { Authorization: `Bearer ${client.accessToken}` } })
// The framework hides refresh-token decryption + rotation; callers only see a
// short-lived access token and the connected account's email.
import { decryptToken } from "./crypto.server";
import { refreshAccessToken } from "./oauth.server";

export type GoogleClient = {
  accessToken: string;
  email: string;
  scopes: string[];
};

// In-worker cache (short-lived; server functions may be reused within a request cycle)
const cache = new Map<string, { token: string; expiresAt: number; email: string; scopes: string[] }>();

export async function getGoogleClient(userId: string): Promise<GoogleClient | null> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expiresAt - 30_000 > now) {
    return { accessToken: hit.token, email: hit.email, scopes: hit.scopes };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("google_integrations")
    .select("google_email, refresh_token_ciphertext, refresh_token_iv, refresh_token_tag, scopes")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const refreshToken = decryptToken({
    ciphertext: data.refresh_token_ciphertext,
    iv: data.refresh_token_iv,
    tag: data.refresh_token_tag,
  });
  const refreshed = await refreshAccessToken(refreshToken);
  const expiresAt = now + refreshed.expires_in * 1000;
  cache.set(userId, { token: refreshed.access_token, expiresAt, email: data.google_email, scopes: data.scopes });
  return { accessToken: refreshed.access_token, email: data.google_email, scopes: data.scopes };
}

export async function getResource(
  userId: string,
  resourceType: string,
): Promise<{ resource_id: string; display_name: string | null; metadata: Record<string, unknown> } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("google_discovered_resources")
    .select("resource_id, display_name, metadata")
    .eq("user_id", userId)
    .eq("resource_type", resourceType)
    .order("discovered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    resource_id: data.resource_id,
    display_name: data.display_name,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}
