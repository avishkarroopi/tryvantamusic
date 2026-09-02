// ============================================================================
// Real GA4 Data API client (Phase 8). Read-only by nature (a reporting API),
// so no approval-gating needed here -- unlike Meta/Google Ads. Reuses the
// same real OAuth base as google-ads.server.ts.
//
// Every function takes a real, already-authenticated `supa` client
// (context.supabase / ctx.supa), threaded into getGoogleClient/getResource --
// NOT a service-role client (Lovable Cloud never exposes one, permanently).
// ============================================================================
import { getGoogleClient, getResource } from "@/lib/google-integration/client.server";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

async function ga4Fetch<T>(supa: AnySupa, userId: string, path: string, body: unknown): Promise<ApiResult<T>> {
  const client = await getGoogleClient(userId, supa);
  if (!client) return { ok: false, error: "google_not_connected: no active google_integrations row for this user" };
  try {
    const res = await fetch(`${GA4_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    if (!res.ok) {
      const msg = typeof parsed === "object" && parsed && "error" in parsed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ((parsed as any).error?.message ?? JSON.stringify(parsed))
        : String(parsed).slice(0, 300);
      return { ok: false, error: `HTTP ${res.status}: ${msg}` };
    }
    return { ok: true, data: parsed as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Resolves the GA4 property to query: explicit id wins, else falls back to the most recently discovered ga4_property resource for this user. */
export async function resolveGa4Property(supa: AnySupa, userId: string, explicit?: string): Promise<string | null> {
  if (explicit) return explicit;
  const discovered = await getResource(userId, "ga4_property", supa);
  return discovered?.resource_id ?? null;
}

export type Ga4Report = {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
  rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
  rowCount?: number;
};

/**
 * Real runReport call. `property` must be the "properties/<id>" form (as
 * stored in google_discovered_resources.resource_id) -- pass through
 * resolveGa4Property() rather than hardcoding, so a future re-discovery
 * (different property, agency-managed multi-property setup) just works.
 */
export async function runReport(
  supa: AnySupa,
  userId: string,
  property: string,
  opts: { dateRanges: Array<{ startDate: string; endDate: string }>; dimensions: string[]; metrics: string[]; limit?: number },
): Promise<ApiResult<Ga4Report>> {
  return ga4Fetch<Ga4Report>(supa, userId, `/${property}:runReport`, {
    dateRanges: opts.dateRanges,
    dimensions: opts.dimensions.map((name) => ({ name })),
    metrics: opts.metrics.map((name) => ({ name })),
    limit: opts.limit ?? 100,
  });
}

/** Convenience: last N days of sessions/users/conversions by channel -- the shape ceo.functions/analytics handlers will most commonly want. */
export async function channelSummary(supa: AnySupa, userId: string, property: string, days = 7): Promise<ApiResult<Ga4Report>> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return runReport(supa, userId, property, {
    dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
    dimensions: ["sessionDefaultChannelGroup"],
    metrics: ["sessions", "totalUsers", "conversions", "engagementRate"],
  });
}
