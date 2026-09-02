// ============================================================================
// Real Meta Marketing API client (Phase 6). Same ApiResult/jfetch/envOk
// conventions as integrations.server.ts (which only covers the organic
// Graph API -- Page/Instagram -- not ads). Credential state: MARKETING_API_TOKEN
// is present in .env but EMPTY, and META_AD_ACCOUNT_ID doesn't exist at all
// yet -- so every call below returns { ok:false, error:"missing_env:..." }
// today. That is the correct, honest behavior, not a bug: this file is the
// complete, real interface, ready the moment real credentials are added.
// ============================================================================
import { classifyRisk } from "@/lib/risk-classifier";
import { requestAction, type RequestActionResult } from "@/lib/approvals.functions";
import {
  recallPriorDecisions,
  formatPrecedent,
  recordApprovalOutcome,
} from "@/lib/learning.server";
import type { Json } from "@/integrations/supabase/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GRAPH_VERSION = "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function envOk(...keys: string[]): string | null {
  for (const k of keys) if (!process.env[k]) return k;
  return null;
}

async function jfetch<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const msg =
        typeof body === "object" && body && "error" in body
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((body as any).error?.message ?? JSON.stringify(body))
          : String(body).slice(0, 300);
      return { ok: false, error: `HTTP ${res.status}: ${msg}` };
    }
    return { ok: true, data: body as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function creds(): ApiResult<{ token: string; accountId: string }> {
  const missing = envOk("MARKETING_API_TOKEN", "META_AD_ACCOUNT_ID");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  // Normalize away an "act_" prefix if present -- Meta's own UI/Ads Manager
  // displays and copies the id WITH this prefix (confirmed: that's exactly
  // what got pasted into .env here), but every call site below already
  // prepends "act_" itself. Handling both forms here means this can never
  // silently become "act_act_123..." regardless of which way a future
  // credential gets pasted in.
  const raw = process.env.META_AD_ACCOUNT_ID!;
  const accountId = raw.startsWith("act_") ? raw.slice(4) : raw;
  return { ok: true, data: { token: process.env.MARKETING_API_TOKEN!, accountId } };
}

// ============ Reads (no approval needed -- read-only) ============

export type MetaCampaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
};

export async function listCampaigns(): Promise<ApiResult<MetaCampaign[]>> {
  const c = creds();
  if (!c.ok) return c;
  const res = await jfetch<{ data: MetaCampaign[] }>(
    `${GRAPH}/act_${c.data.accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time`,
    { headers: { Authorization: `Bearer ${c.data.token}` } },
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.data ?? [] };
}

export type MetaAdSet = {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
};

export async function listAdSets(campaignId: string): Promise<ApiResult<MetaAdSet[]>> {
  const c = creds();
  if (!c.ok) return c;
  const res = await jfetch<{ data: MetaAdSet[] }>(
    `${GRAPH}/${campaignId}/adsets?fields=id,name,status,campaign_id,daily_budget`,
    { headers: { Authorization: `Bearer ${c.data.token}` } },
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.data ?? [] };
}

export type MetaInsight = {
  impressions: string;
  clicks: string;
  spend: string;
  cpc: string;
  ctr: string;
  date_start: string;
  date_stop: string;
};

export async function campaignInsights(
  campaignId: string,
  datePreset: "today" | "yesterday" | "last_7d" | "last_30d" = "last_7d",
): Promise<ApiResult<MetaInsight[]>> {
  const c = creds();
  if (!c.ok) return c;
  const res = await jfetch<{ data: MetaInsight[] }>(
    `${GRAPH}/${campaignId}/insights?date_preset=${datePreset}&fields=impressions,clicks,spend,cpc,ctr,date_start,date_stop`,
    { headers: { Authorization: `Bearer ${c.data.token}` } },
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.data ?? [] };
}

// ============ Writes (real mutations -- always risk-classified) ============
// action_type strings match risk-classifier.ts's BASE_RISK table exactly.

export type MetaActionType =
  | "meta.pause_campaign"
  | "meta.resume_campaign"
  | "meta.update_budget"
  | "meta.create_campaign"
  | "meta.create_ad_set"
  | "meta.create_ad"
  | "meta.duplicate_campaign"
  | "meta.update_targeting";

/** Performs the actual Graph API mutation. Never called directly by a handler -- always via proposeMetaAction/runApprovedMetaAction below, so risk classification can never be bypassed. */
async function executeMetaAction(
  actionType: MetaActionType,
  payload: Record<string, unknown>,
): Promise<ApiResult<Json>> {
  const c = creds();
  if (!c.ok) return c;
  const tok = c.data.token;

  switch (actionType) {
    case "meta.pause_campaign":
    case "meta.resume_campaign": {
      const campaignId = String(payload.campaign_id ?? "");
      if (!campaignId) return { ok: false, error: "missing_payload:campaign_id" };
      const status = actionType === "meta.pause_campaign" ? "PAUSED" : "ACTIVE";
      const res = await jfetch<Json>(`${GRAPH}/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `status=${status}&access_token=${encodeURIComponent(tok)}`,
      });
      return res;
    }
    case "meta.update_budget": {
      const campaignId = String(payload.campaign_id ?? "");
      const dailyBudget = payload.daily_budget_cents;
      if (!campaignId || typeof dailyBudget !== "number")
        return { ok: false, error: "missing_payload:campaign_id/daily_budget_cents" };
      const res = await jfetch<Json>(`${GRAPH}/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `daily_budget=${dailyBudget}&access_token=${encodeURIComponent(tok)}`,
      });
      return res;
    }
    case "meta.create_campaign": {
      const {
        name,
        objective,
        status = "PAUSED",
      } = payload as { name?: string; objective?: string; status?: string };
      if (!name || !objective) return { ok: false, error: "missing_payload:name/objective" };
      const res = await jfetch<Json>(`${GRAPH}/act_${c.data.accountId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `name=${encodeURIComponent(name)}&objective=${objective}&status=${status}&special_ad_categories=[]&access_token=${encodeURIComponent(tok)}`,
      });
      return res;
    }
    case "meta.duplicate_campaign": {
      const campaignId = String(payload.campaign_id ?? "");
      if (!campaignId) return { ok: false, error: "missing_payload:campaign_id" };
      const res = await jfetch<Json>(`${GRAPH}/${campaignId}/copies`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `access_token=${encodeURIComponent(tok)}`,
      });
      return res;
    }
    case "meta.update_targeting": {
      const adSetId = String(payload.ad_set_id ?? "");
      const targeting = payload.targeting;
      if (!adSetId || !targeting)
        return { ok: false, error: "missing_payload:ad_set_id/targeting" };
      const res = await jfetch<Json>(`${GRAPH}/${adSetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `targeting=${encodeURIComponent(JSON.stringify(targeting))}&access_token=${encodeURIComponent(tok)}`,
      });
      return res;
    }
    case "meta.create_ad_set":
    case "meta.create_ad":
      // Real interface present (matches the Graph API POST shape), left as
      // an explicit not-yet-wired case rather than a guessed payload shape --
      // ad-set/ad creation needs a creative/targeting spec this codebase
      // doesn't originate anywhere yet (Phase 15's content engine is the
      // natural future source of ad creative). Returning a clear error
      // rather than fabricating a call with a guessed shape.
      return {
        ok: false,
        error: "not_yet_implemented: needs a real creative/targeting payload source (see Phase 15)",
      };
  }
}

/**
 * The ONLY entry point handlers should use to perform a Meta Ads mutation.
 * Classifies risk (deterministic, see risk-classifier.ts), and only
 * executes immediately if auto-approvable. A medium/high-risk action is
 * recorded as a pending approval_requests row and NOT executed -- the
 * caller gets `decision:"pending_approval"` back and should log/report
 * that, not treat it as a failure.
 */
export async function proposeMetaAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  agentSlug: string,
  runId: string | null,
  actionType: MetaActionType,
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

  const result = await executeMetaAction(actionType, payload);
  if (!result.ok) return { decision: "execution_failed", error: result.error };
  return { decision: "executed", result };
}

/**
 * Executes an action that a human already approved (approval_requests.status
 * = 'approved'), then records the real result. Called from the Phase 20
 * approvals UI's "Execute" action (approve and execute are deliberately two
 * separate steps -- see approvals.functions.ts's decideApproval comment).
 */
export async function runApprovedMetaAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  approvalId: string,
): Promise<ApiResult<Json>> {
  // Atomic claim (CAS): only the caller whose UPDATE actually matches a row
  // still in 'approved' gets to proceed. A second concurrent call (double
  // click, UI racing a worker) sees zero rows and stops here -- this is
  // what actually prevents double-execution, not the earlier read-then-check
  // this replaced (see 20260902050000's migration comment).
  const { data: claimed, error: claimErr } = await supa
    .from("approval_requests")
    .update({ status: "executing" })
    .eq("id", approvalId)
    .eq("status", "approved")
    .select("*");
  if (claimErr) return { ok: false, error: claimErr.message };
  if (!claimed || claimed.length === 0)
    return {
      ok: false,
      error:
        "Approval is not in 'approved' state (already executing/executed/decided elsewhere) -- refusing to execute.",
    };
  const approval = claimed[0];

  // Re-classify at execution time too -- never trust a risk_level stored
  // days ago if the action_type/payload were somehow mutated in between
  // (defense in depth; classifyRisk is pure and cheap to call again).
  const risk = classifyRisk({
    action_type: approval.action_type,
    payload: approval.action_payload as Record<string, unknown>,
  });
  if (risk !== approval.risk_level) {
    await supa
      .from("approval_requests")
      .update({
        status: "execution_failed",
        execution_result: { error: "risk_level_mismatch_at_execution_time" },
      })
      .eq("id", approvalId);
    return {
      ok: false,
      error: "Risk level re-check mismatch -- execution blocked, needs re-review.",
    };
  }

  const result = await executeMetaAction(
    approval.action_type as MetaActionType,
    approval.action_payload as Record<string, unknown>,
  );
  await supa
    .from("approval_requests")
    .update({
      status: result.ok ? "executed" : "execution_failed",
      executed_at: new Date().toISOString(),
      execution_result: result.ok ? result.data : { error: result.error },
    })
    .eq("id", approvalId);
  await recordApprovalOutcome(supa, approvalId); // Phase 17 — best-effort, never blocks the real result above
  return result;
}
