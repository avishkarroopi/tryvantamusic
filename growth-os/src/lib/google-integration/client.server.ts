// Server-only: reusable Google API client for other server modules to consume.
// Usage:
//   const client = await getGoogleClient(userId, supa);
//   if (client) fetch(url, { headers: { Authorization: `Bearer ${client.accessToken}` } })
// The framework hides refresh-token decryption + rotation; callers only see a
// short-lived access token and the connected account's email.
//
// Correction (found 2026-09-02, same root cause as ai.server.ts's fix):
// this used to call `supabaseAdmin` unconditionally, which can NEVER
// authenticate on Lovable Cloud (no service-role key exposed, by design,
// permanently). That meant EVERY Google Ads/GA4/GSC call would have
// silently 500'd the moment a real Google connection + developer token
// both existed -- caught before that ever shipped, by testing the real
// developer token end-to-end. Fix: accept a real, already-authenticated
// client (context.supabase / ctx.supa) from the caller. RLS on
// google_integrations/google_discovered_resources requires the 'admin' role
// (has_role(auth.uid(),'admin'), not just team membership) -- the
// growth-os-worker service account already holds 'admin' for exactly this
// reason, so this works for worker-triggered runs too, not just manual ones.
import { decryptToken } from "./crypto.server";
import { refreshAccessToken } from "./oauth.server";

export type GoogleClient = {
  accessToken: string;
  email: string;
  scopes: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

// In-worker cache (short-lived; server functions may be reused within a request cycle)
const cache = new Map<string, { token: string; expiresAt: number; email: string; scopes: string[] }>();

export async function getGoogleClient(userId: string, supa: AnySupa): Promise<GoogleClient | null> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expiresAt - 30_000 > now) {
    return { accessToken: hit.token, email: hit.email, scopes: hit.scopes };
  }

  const { data, error } = await supa
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
  supa: AnySupa,
): Promise<{ resource_id: string; display_name: string | null; metadata: Record<string, unknown> } | null> {
  const { data } = await supa
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
