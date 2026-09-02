// ============================================================================
// Real Google Ads API (v18, REST) client (Phase 7).
//
// Reuses the already-real OAuth base (google-integration/client.server.ts's
// getGoogleClient) for the access token -- does NOT duplicate token
// refresh/decryption. Additionally requires GOOGLE_ADS_DEVELOPER_TOKEN and a
// target customerId (not an env var -- passed by the caller, since a real
// deployment may manage more than one ad account; discover one via
// google_discovered_resources once a Google account is connected and has
// accessible customers).
//
// Every function here takes a real, already-authenticated `supa` client
// (context.supabase / ctx.supa) and threads it into getGoogleClient/
// getResource -- NOT a service-role client (Lovable Cloud never exposes
// one, permanently, confirmed 2026-09-02). RLS on google_integrations
// requires the 'admin' role specifically; the growth-os-worker service
// account already holds it for exactly this reason.
// ============================================================================
import { getGoogleClient, getResource } from "@/lib/google-integration/client.server";
import { classifyRisk } from "@/lib/risk-classifier";
import { requestAction, type RequestActionResult } from "@/lib/approvals.functions";
import { recallPriorDecisions, formatPrecedent, recordApprovalOutcome } from "@/lib/learning.server";
import type { Json } from "@/integrations/supabase/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

const ADS_API_VERSION = "v18";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

async function adsFetch<T>(supa: AnySupa, userId: string, path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) return { ok: false, error: "missing_env:GOOGLE_ADS_DEVELOPER_TOKEN" };

  const client = await getGoogleClient(userId, supa);
  if (!client) return { ok: false, error: "google_not_connected: no active google_integrations row for this user" };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${client.accessToken}`,
    "developer-token": devToken,
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  try {
    const res = await fetch(`${ADS_BASE}${path}`, { ...init, headers });
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) {
      const msg = typeof body === "object" && body && "error" in body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ((body as any).error?.message ?? JSON.stringify(body))
        : String(body).slice(0, 300);
      return { ok: false, error: `HTTP ${res.status}: ${msg}` };
    }
    return { ok: true, data: body as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const cid = (customerId: string) => customerId.replace(/-/g, "");

/**
 * Resolves which Ads customer to act against: an explicit id always wins;
 * otherwise falls back to the most recently discovered `ads_customer`
 * resource for this user. Returns null if neither is available -- callers
 * must treat that as "google_ads_customer_unresolved", not silently pick
 * an arbitrary one.
 */
export async function resolveCustomerId(supa: AnySupa, userId: string, explicit?: string): Promise<string | null> {
  if (explicit) return explicit;
  const discovered = await getResource(userId, "ads_customer", supa);
  return discovered?.resource_id ?? null;
}

// ============ Reads (GAQL search -- no approval needed) ============

export type GoogleAdsRow = Record<string, unknown>;

export async function searchGoogleAds(supa: AnySupa, userId: string, customerId: string, gaqlQuery: string): Promise<ApiResult<GoogleAdsRow[]>> {
  const res = await adsFetch<{ results?: GoogleAdsRow[] }>(supa, userId, `/customers/${cid(customerId)}/googleAds:search`, {
    method: "POST",
    body: JSON.stringify({ query: gaqlQuery }),
  });
  if (!res.ok) return res;
  return { ok: true, data: res.data.results ?? [] };
}

export async function listCampaigns(supa: AnySupa, userId: string, customerId: string) {
  return searchGoogleAds(supa, userId, customerId,
    "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, " +
    "campaign_budget.amount_micros, campaign_budget.resource_name FROM campaign ORDER BY campaign.id",
  );
}

export async function campaignMetrics(supa: AnySupa, userId: string, customerId: string, dateRange: "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" = "LAST_7_DAYS") {
  return searchGoogleAds(supa, userId, customerId,
    `SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr, metrics.average_cpc ` +
    `FROM campaign WHERE segments.date DURING ${dateRange}`,
  );
}

// ============ Writes (real mutations -- always risk-classified) ============

export type GoogleAdsActionType =
  | "google_ads.pause_campaign" | "google_ads.resume_campaign" | "google_ads.update_budget"
  | "google_ads.create_campaign" | "google_ads.create_budget" | "google_ads.create_ad_group"
  | "google_ads.create_keyword" | "google_ads.create_ad" | "google_ads.duplicate_campaign"
  | "google_ads.update_bids" | "google_ads.add_negative_keyword";

async function executeGoogleAdsAction(supa: AnySupa, userId: string, actionType: GoogleAdsActionType, payload: Record<string, unknown>): Promise<ApiResult<Json>> {
  const customerId = String(payload.customer_id ?? "");
  if (!customerId) return { ok: false, error: "missing_payload:customer_id" };

  switch (actionType) {
    case "google_ads.pause_campaign":
    case "google_ads.resume_campaign": {
      const campaignId = String(payload.campaign_id ?? "");
      if (!campaignId) return { ok: false, error: "missing_payload:campaign_id" };
      const status = actionType === "google_ads.pause_campaign" ? "PAUSED" : "ENABLED";
      const resourceName = `customers/${cid(customerId)}/campaigns/${campaignId}`;
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/campaigns:mutate`, {
        method: "POST",
        body: JSON.stringify({ operations: [{ update: { resourceName, status }, updateMask: "status" }] }),
      });
    }
    case "google_ads.create_budget": {
      const { name, amount_micros, delivery_method = "STANDARD" } = payload as { name?: string; amount_micros?: number; delivery_method?: string };
      if (!name || typeof amount_micros !== "number") return { ok: false, error: "missing_payload:name/amount_micros" };
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/campaignBudgets:mutate`, {
        method: "POST",
        body: JSON.stringify({ operations: [{ create: { name, amountMicros: String(amount_micros), deliveryMethod: delivery_method } }] }),
      });
    }
    case "google_ads.update_budget": {
      const budgetResourceName = String(payload.budget_resource_name ?? "");
      const amountMicros = payload.amount_micros;
      if (!budgetResourceName || typeof amountMicros !== "number") return { ok: false, error: "missing_payload:budget_resource_name/amount_micros" };
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/campaignBudgets:mutate`, {
        method: "POST",
        body: JSON.stringify({ operations: [{ update: { resourceName: budgetResourceName, amountMicros: String(amountMicros) }, updateMask: "amount_micros" }] }),
      });
    }
    case "google_ads.create_campaign": {
      const { name, budget_resource_name, advertising_channel_type = "SEARCH", status = "PAUSED" } =
        payload as { name?: string; budget_resource_name?: string; advertising_channel_type?: string; status?: string };
      if (!name || !budget_resource_name) return { ok: false, error: "missing_payload:name/budget_resource_name (create the budget first via google_ads.create_budget)" };
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/campaigns:mutate`, {
        method: "POST",
        body: JSON.stringify({
          operations: [{ create: { name, campaignBudget: budget_resource_name, advertisingChannelType: advertising_channel_type, status } }],
        }),
      });
    }
    case "google_ads.add_negative_keyword": {
      const adGroupId = String(payload.ad_group_id ?? "");
      const keywordText = String(payload.keyword_text ?? "");
      const matchType = String(payload.match_type ?? "BROAD");
      if (!adGroupId || !keywordText) return { ok: false, error: "missing_payload:ad_group_id/keyword_text" };
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/adGroupCriteria:mutate`, {
        method: "POST",
        body: JSON.stringify({
          operations: [{ create: { adGroup: `customers/${cid(customerId)}/adGroups/${adGroupId}`, negative: true, keyword: { text: keywordText, matchType } } }],
        }),
      });
    }
    case "google_ads.update_bids": {
      const adGroupResourceName = String(payload.ad_group_resource_name ?? "");
      const cpcBidMicros = payload.cpc_bid_micros;
      if (!adGroupResourceName || typeof cpcBidMicros !== "number") return { ok: false, error: "missing_payload:ad_group_resource_name/cpc_bid_micros" };
      return adsFetch<Json>(supa, userId, `/customers/${cid(customerId)}/adGroups:mutate`, {
        method: "POST",
        body: JSON.stringify({ operations: [{ update: { resourceName: adGroupResourceName, cpcBidMicros: String(cpcBidMicros) }, updateMask: "cpc_bid_micros" }] }),
      });
    }
    case "google_ads.create_ad_group":
    case "google_ads.create_keyword":
    case "google_ads.create_ad":
    case "google_ads.duplicate_campaign":
      // Real interface present; not wired to a concrete payload shape yet
      // for the same reason as Meta's create_ad_set/create_ad -- these need
      // a real creative/keyword-list source this codebase doesn't
      // originate anywhere yet (Phase 12/15). Honest "not implemented",
      // not a fabricated call.
      return { ok: false, error: `not_yet_implemented: ${actionType} needs a real payload source (see Phase 12/15)` };
  }
}

export async function proposeGoogleAdsAction(
  supa: AnySupa,
  agentSlug: string,
  runId: string | null,
  userId: string,
  actionType: GoogleAdsActionType,
  payload: Record<string, unknown>,
  reasoning: string,
): Promise<
  | RequestActionResult
  | { decision: "executed"; result: ApiResult<Json> }
  | { decision: "execution_failed"; error: string }
> {
  // Phase 17 — fold in precedent from similar past decisions (advisory
  // only; never changes what requestAction/classifyRisk decides).
  const prior = await recallPriorDecisions(supa, agentSlug, actionType, payload);
  const decision = await requestAction(
    supa,
    agentSlug,
    runId,
    { action_type: actionType, payload },
    reasoning + formatPrecedent(prior),
  );
  if (decision.decision === "pending_approval") return decision;

  const result = await executeGoogleAdsAction(supa, userId, actionType, payload);
  if (!result.ok) return { decision: "execution_failed", error: result.error };
  return { decision: "executed", result };
}

export async function runApprovedGoogleAdsAction(supa: AnySupa, approvalId: string, userId: string): Promise<ApiResult<Json>> {
  // Atomic claim (CAS) -- see meta-ads.server.ts's runApprovedMetaAction /
  // 20260902050000's migration comment for why this can't be a plain
  // read-then-check.
  const { data: claimed, error: claimErr } = await supa
    .from("approval_requests").update({ status: "executing" }).eq("id", approvalId).eq("status", "approved").select("*");
  if (claimErr) return { ok: false, error: claimErr.message };
  if (!claimed || claimed.length === 0) return { ok: false, error: "Approval is not in 'approved' state (already executing/executed/decided elsewhere) -- refusing to execute." };
  const approval = claimed[0];

  const risk = classifyRisk({ action_type: approval.action_type, payload: approval.action_payload as Record<string, unknown> });
  if (risk !== approval.risk_level) {
    await supa.from("approval_requests").update({ status: "execution_failed", execution_result: { error: "risk_level_mismatch_at_execution_time" } }).eq("id", approvalId);
    return { ok: false, error: "Risk level re-check mismatch -- execution blocked, needs re-review." };
  }

  const result = await executeGoogleAdsAction(supa, userId, approval.action_type as GoogleAdsActionType, approval.action_payload as Record<string, unknown>);
  await supa.from("approval_requests").update({
    status: result.ok ? "executed" : "execution_failed",
    executed_at: new Date().toISOString(),
    execution_result: result.ok ? result.data : { error: result.error },
  }).eq("id", approvalId);
  await recordApprovalOutcome(supa, approvalId); // Phase 17 — best-effort, never blocks the real result above
  return result;
}
