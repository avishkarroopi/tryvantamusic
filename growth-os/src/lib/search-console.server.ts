// ============================================================================
// Real Google Search Console API client (Phase 9). Read-only reporting API,
// same OAuth base as ga4.server.ts/google-ads.server.ts. Every function
// takes a real, already-authenticated `supa` client -- NOT a service-role
// client (Lovable Cloud never exposes one, permanently).
//
// Known, documented gap (found during the original audit, not fixed here
// because it's a real-world configuration fact, not a code bug): the only
// GSC site discovered so far is https://muzicllygrowthos.lovable.app/ --
// this tool's OWN preview URL -- not the production domain
// (music.tryvanta.in / muziclly.com). Whoever re-connects Google here must
// also verify the real production property in Search Console first, or
// every GSC call below will succeed but report traffic for the wrong site.
// resolveGscSite() below surfaces this loudly instead of silently trusting
// whatever was last discovered.
// ============================================================================
import { getGoogleClient, getResource } from "@/lib/google-integration/client.server";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

const GSC_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

async function gscFetch<T>(supa: AnySupa, userId: string, path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const client = await getGoogleClient(userId, supa);
  if (!client) return { ok: false, error: "google_not_connected: no active google_integrations row for this user" };
  try {
    const res = await fetch(`${GSC_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json", ...(init?.headers as Record<string, string> | undefined) },
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

export type GscSiteResolution = { siteUrl: string; looksLikeExpectedProductionDomain: boolean };

/**
 * Resolves which GSC site to query, and flags (does not silently correct)
 * the known wrong-domain gap described above. Set GSC_EXPECTED_SITE_URL to
 * the real production domain once re-verified in Search Console, to turn
 * this from a passive flag into an active mismatch warning callers can log.
 */
export async function resolveGscSite(supa: AnySupa, userId: string, explicit?: string): Promise<GscSiteResolution | null> {
  const siteUrl = explicit ?? (await getResource(userId, "gsc_site", supa))?.resource_id ?? null;
  if (!siteUrl) return null;
  const expected = process.env.GSC_EXPECTED_SITE_URL;
  const looksLikeExpectedProductionDomain = expected ? siteUrl.includes(expected) : !siteUrl.includes(".lovable.app");
  return { siteUrl, looksLikeExpectedProductionDomain };
}

export async function listSites(supa: AnySupa, userId: string): Promise<ApiResult<{ siteEntry: Array<{ siteUrl: string; permissionLevel: string }> }>> {
  return gscFetch(supa, userId, "/sites");
}

export type GscSearchAnalyticsRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

export async function searchAnalyticsQuery(
  supa: AnySupa,
  userId: string,
  siteUrl: string,
  opts: { startDate: string; endDate: string; dimensions?: Array<"query" | "page" | "country" | "device" | "date">; rowLimit?: number },
): Promise<ApiResult<{ rows?: GscSearchAnalyticsRow[] }>> {
  return gscFetch(supa, userId, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify({
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions ?? ["query"],
      rowLimit: opts.rowLimit ?? 100,
    }),
  });
}

/** Convenience: top queries by clicks over the last N days -- the shape SEO/keyword-intelligence handlers will most commonly want. */
export async function topQueries(supa: AnySupa, userId: string, siteUrl: string, days = 28, limit = 50) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return searchAnalyticsQuery(supa, userId, siteUrl, { startDate: fmt(start), endDate: fmt(end), dimensions: ["query"], rowLimit: limit });
}
