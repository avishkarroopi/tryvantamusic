// ============================================================================
// Service identity for genuinely session-less server contexts (Phase 7/8/9
// follow-up, found 2026-09-02).
//
// A handful of code paths have no real user session to work with by design
// -- most importantly the Google OAuth callback (`api/public/google/oauth/
// callback.ts`), which Google redirects to directly with no cookies at all.
// These previously reached for `supabaseAdmin` (service-role), which can
// NEVER authenticate on Lovable Cloud (confirmed directly with Lovable:
// the service_role key/DB password are not exposed to the project owner,
// by design, permanently). This is the same fix pattern as
// growth-os-worker/db.ts: sign in as a real, dedicated Supabase Auth
// 'admin'-role service account instead of bypassing RLS with a key that
// doesn't exist. RLS on the tables this touches (google_integrations,
// google_discovered_resources) is `has_role(auth.uid(),'admin')` -- role-
// based, not row-ownership-based -- so this account can legitimately act
// on behalf of any user_id, exactly like supabaseAdmin used to, just via a
// real, auditable identity instead of an unrestricted key.
//
// Reuses growth-os-worker's own account/credentials (SUPABASE_WORKER_EMAIL/
// SUPABASE_WORKER_PASSWORD) rather than minting a second service identity --
// one dedicated internal account, two different processes (the worker, and
// occasional session-less request handlers) authenticating as it.
// ============================================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let cached: { client: SupabaseClient<Database>; signedInAt: number } | null = null;
const RESIGN_IN_INTERVAL_MS = 45 * 60_000; // access tokens last 1h; re-auth well before that

export async function getServiceSupabase(): Promise<SupabaseClient<Database>> {
  const now = Date.now();
  if (cached && now - cached.signedInAt < RESIGN_IN_INTERVAL_MS) return cached.client;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.SUPABASE_WORKER_EMAIL;
  const password = process.env.SUPABASE_WORKER_PASSWORD;
  const missing = [
    !url && "SUPABASE_URL", !anonKey && "SUPABASE_PUBLISHABLE_KEY",
    !email && "SUPABASE_WORKER_EMAIL", !password && "SUPABASE_WORKER_PASSWORD",
  ].filter(Boolean);
  if (missing.length > 0) throw new Error(`getServiceSupabase: missing ${missing.join(", ")}`);

  const client = createClient<Database>(url!, anonKey!, { auth: { persistSession: false, autoRefreshToken: true } });
  const { error } = await client.auth.signInWithPassword({ email: email!, password: password! });
  if (error) throw new Error(`getServiceSupabase: sign-in failed: ${error.message}`);

  cached = { client, signedInAt: now };
  return client;
}
