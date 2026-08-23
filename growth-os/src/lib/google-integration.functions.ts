// Client-callable server functions for the Google Integration Framework.
// Admin-only. All heavy lifting delegated to src/lib/google-integration/*.server.ts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAuthorizeUrl } from "./google-integration/oauth.server";
import { signState } from "./google-integration/crypto.server";
import type { GoogleResourceType } from "./google-integration/scopes";

async function assertAdmin(context: { supabase: ReturnType<typeof Object>; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = context.supabase as any;
  const { data, error } = await supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error("role_check_failed");
  if (!data) throw new Error("forbidden_admin_only");
}

function normalizeOrigin(raw: string): string {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.hostname !== "localhost") throw new Error("invalid_origin");
  return `${u.protocol}//${u.host}`;
}

// ---- get status + discovered resources ----
export type GoogleIntegrationStatus = {
  connected: boolean;
  integration: {
    google_email: string;
    scopes: string[];
    connected_at: string;
    updated_at: string;
  } | null;
  resources: Array<{
    resource_type: GoogleResourceType;
    resource_id: string;
    display_name: string | null;
    metadata: Record<string, string | number | boolean | null>;
    discovered_at: string;
  }>;
  adsDeveloperTokenPresent: boolean;
  clientIdPresent: boolean;
};

export const getGoogleIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleIntegrationStatus> => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;
    const { data: integ } = await supabase
      .from("google_integrations")
      .select("google_email, scopes, connected_at, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: resources } = await supabase
      .from("google_discovered_resources")
      .select("resource_type, resource_id, display_name, metadata, discovered_at")
      .eq("user_id", context.userId)
      .order("discovered_at", { ascending: false });
    return {
      connected: Boolean(integ),
      integration: integ ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resources: (resources ?? []) as any,
      adsDeveloperTokenPresent: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
      clientIdPresent: Boolean(process.env.GOOGLE_CLIENT_ID),
    };
  });

// ---- build authorize URL for the current admin ----
export const getGoogleAuthorizeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: string }) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const origin = normalizeOrigin(data.origin);
    const state = signState({
      u: context.userId,
      o: origin,
      e: Math.floor(Date.now() / 1000) + 600, // 10 min
    });
    const url = buildAuthorizeUrl({ origin, state });
    return { url, redirectUri: `${origin}/api/public/google/oauth/callback` };
  });

// ---- refresh discovery on demand ----
export const refreshGoogleDiscovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { runDiscoveryForUser } = await import("./google-integration/discovery-runner.server");
    return runDiscoveryForUser(context.userId);
  });

// ---- disconnect ----
export const disconnectGoogleIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { disconnectForUser } = await import("./google-integration/discovery-runner.server");
    await disconnectForUser(context.userId);
    return { ok: true };
  });
