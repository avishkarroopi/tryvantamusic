// ============================================================================
// Deterministic risk classifier (Phase 5, non-negotiable rule #4).
//
// This is PLAIN CODE, not an LLM call, and it is the ONLY place in the
// codebase allowed to assign a risk_level to an action. An agent handler (or
// the AI inside it) may PROPOSE an action and a suggested reasoning string,
// but it can NEVER set its own risk_level -- requestApproval() below always
// re-derives it from this function, ignoring anything the caller passed.
//
// Kept as a plain .ts (not .server.ts) so it can be unit-tested directly
// (Phase 21) without pulling in Supabase/server-only dependencies.
// ============================================================================

export type RiskLevel = "low" | "medium" | "high";

export type ProposedAction = {
  action_type: string; // e.g. 'meta.pause_campaign', 'google_ads.create_campaign'
  payload: Record<string, unknown>;
};

// Action-type -> base risk. Anything not listed here defaults to "high" --
// fail closed, not open: an unrecognised action type is never auto-approved.
const BASE_RISK: Record<string, RiskLevel> = {
  // Read-only / informational actions are not routed through this
  // classifier at all (they don't need approval), but listed here for
  // completeness/tests.
  "meta.read": "low",
  "google_ads.read": "low",
  "ga4.read": "low",
  "gsc.read": "low",

  // Pausing a campaign is reversible and stops spend -- low risk regardless
  // of which platform, UNLESS it's spending nothing (see override below,
  // which can only ever make things safer, never override this table to
  // something MORE permissive).
  "meta.pause_campaign": "low",
  "google_ads.pause_campaign": "low",
  "meta.pause_ad_set": "low",
  "google_ads.pause_ad_group": "low",

  // Resuming, duplicating, or shifting budget between existing entities:
  // reversible but does affect live spend -- medium.
  "meta.resume_campaign": "medium",
  "google_ads.resume_campaign": "medium",
  "meta.duplicate_campaign": "medium",
  "google_ads.duplicate_campaign": "medium",
  "meta.update_targeting": "medium",
  "google_ads.update_bids": "medium",
  "google_ads.add_negative_keyword": "medium",

  // Anything that creates new spend commitments, changes how much money
  // moves, or is a mass communication / destructive action: always high,
  // never auto-approved, never time-boxed to auto-execute on expiry.
  "meta.create_campaign": "high",
  "meta.create_ad_set": "high",
  "meta.create_ad": "high",
  "meta.update_budget": "high",
  "google_ads.create_campaign": "high",
  "google_ads.create_budget": "high",
  "google_ads.create_ad_group": "high",
  "google_ads.create_keyword": "high",
  "google_ads.create_ad": "high",
  "google_ads.update_budget": "high",
  "whatsapp.mass_send": "high",
  "content.publish_live": "high",
  "resource.delete": "high",
};

// A budget-increase percentage threshold: even an action type that's
// normally "medium" (e.g. update_targeting) escalates to "high" if the
// payload implies a spend increase above this, and a normally-"high" budget
// change is always high regardless -- this only ever escalates, never
// downgrades what BASE_RISK already says.
const BUDGET_INCREASE_HIGH_RISK_THRESHOLD_PCT = 20;

/**
 * The one function allowed to decide risk_level. Deterministic: same input
 * always produces the same output, no AI call, no randomness.
 */
export function classifyRisk(action: ProposedAction): RiskLevel {
  const base = BASE_RISK[action.action_type] ?? "high"; // unknown action type -> fail closed

  // Escalation-only override (never de-escalates below BASE_RISK): any
  // action whose payload declares a large budget swing is high risk
  // regardless of what its action_type would normally imply.
  const budgetChangePct =
    typeof action.payload.budget_change_pct === "number"
      ? (action.payload.budget_change_pct as number)
      : undefined;
  if (
    budgetChangePct !== undefined &&
    Math.abs(budgetChangePct) >= BUDGET_INCREASE_HIGH_RISK_THRESHOLD_PCT
  ) {
    return escalate(base, "high");
  }

  return base;
}

function escalate(current: RiskLevel, to: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["low", "medium", "high"];
  return order.indexOf(to) > order.indexOf(current) ? to : current;
}

/** Actions the system may execute automatically without a human decision. */
export function isAutoApprovable(risk: RiskLevel): boolean {
  return risk === "low";
}

/** Medium-risk approvals expire (auto-cancel) if ignored; high-risk never does. */
export function approvalExpiryHours(risk: RiskLevel): number | null {
  if (risk === "medium") return 24;
  return null; // low: doesn't need an approval_requests row at all; high: no auto-expiry-to-anything, stays pending until a human decides
}
