// ============================================================================
// Authenticated Supabase client for the worker process (Phase 2).
//
// NOT a service-role client. Confirmed directly with Lovable (their own
// assistant, 2026-09-02): Lovable Cloud deliberately never exposes the
// service_role key or DB password to the project owner -- there is no
// "get it from the dashboard" path here, by design, permanently. Building
// on that constraint rather than fighting it: the worker authenticates as
// a real, dedicated Supabase Auth user (growth-os-worker@<project>.internal,
// created via the normal public signup endpoint, email-confirmed and
// granted 'admin' via a direct SQL write since there's no Admin API access
// either) and gets normal RLS-scoped access -- the exact same access a
// human admin already has when running an agent manually. Verified live
// end-to-end before wiring this in: real access_token issued, real SELECT
// against agents_registry returned real rows.
//
// This is arguably BETTER than a service-role bypass, not just a
// workaround for one: every worker action is now attributable to a real,
// auditable identity instead of an unrestricted key, and it required zero
// new infrastructure -- just the RLS policies that already existed.
// ============================================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

export async function createWorkerDb(): Promise<SupabaseClient<Database>> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.SUPABASE_WORKER_EMAIL;
  const password = process.env.SUPABASE_WORKER_PASSWORD;
  const missing = [
    !url && "SUPABASE_URL", !anonKey && "SUPABASE_PUBLISHABLE_KEY",
    !email && "SUPABASE_WORKER_EMAIL", !password && "SUPABASE_WORKER_PASSWORD",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")} in the worker's environment. See growth-os-worker/README.md.`);
  }

  // autoRefreshToken:true keeps this session alive indefinitely -- supabase-js
  // runs its own internal timer to refresh the access token before it expires
  // (1h lifetime), which works in a long-lived Node process exactly like it
  // does in a browser tab. persistSession:false because there's no storage
  // to persist to (and none needed -- re-signing in on restart is instant).
  const client = createClient<Database>(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: true },
  });

  const { error } = await client.auth.signInWithPassword({ email: email!, password: password! });
  if (error) {
    throw new Error(`Worker sign-in failed: ${error.message}. Check SUPABASE_WORKER_EMAIL/SUPABASE_WORKER_PASSWORD.`);
  }
  return client;
}

/** True once both worker-auth env vars are actually filled in (not the empty placeholders they ship as). */
export function hasWorkerCredentials(): boolean {
  return !!process.env.SUPABASE_WORKER_EMAIL && !!process.env.SUPABASE_WORKER_PASSWORD;
}
