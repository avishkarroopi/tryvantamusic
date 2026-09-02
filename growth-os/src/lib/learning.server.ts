// ============================================================================
// Phase 17 — Autonomous Learning Loop.
//
// Reuses the Phase 16 semantic memory substrate (embeddings.server.ts,
// agents_memory_embeddings) as-is -- this is NOT a new storage mechanism,
// just a specific way of using the existing one: every decided/executed
// approval becomes a memory keyed by its own id, and before proposing a
// similar action again, an agent recalls similar past outcomes and folds
// them into the human-facing reasoning as precedent.
//
// This is deliberately advisory-only: recalled precedent is text the human
// reviewer sees, never something that changes classifyRisk()'s output.
// "The system learns" here means "future proposals cite real history,"
// not "risk gates loosen over time" -- the latter would contradict the
// non-negotiable rule that risk classification is deterministic code, not
// something outcomes can drift.
//
// Honest limitation: as of this build, zero real Meta/Google Ads actions
// have ever executed (credentials blocked) and zero approvals have been
// decided, so this loop currently has nothing to learn from yet -- it is
// real, wired, and ready, not pre-seeded with fabricated history.
// ============================================================================
import { rememberMemory, recallMemory } from "@/lib/embeddings.server";
import type { Json } from "@/integrations/supabase/types";

/**
 * Records the current state of one approval_requests row as a memory. Safe
 * to call more than once for the same approval (e.g. once at decision time,
 * again at execution time) -- rememberMemory upserts on
 * (source_table, source_id), so the memory evolves in place rather than
 * accumulating duplicate/stale entries for the same approval.
 */
export async function recordApprovalOutcome(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  approvalId: string,
): Promise<void> {
  const { data: approval, error } = await supa
    .from("approval_requests")
    .select(
      "agent_slug, action_type, action_payload, risk_level, status, reasoning, execution_result, requested_at, decided_at, executed_at",
    )
    .eq("id", approvalId)
    .maybeSingle();
  if (error || !approval) return; // best-effort -- learning must never break the calling flow

  const outcomeLine =
    approval.status === "executed"
      ? "Executed successfully."
      : approval.status === "execution_failed"
        ? `Execution failed: ${JSON.stringify(approval.execution_result).slice(0, 300)}`
        : approval.status === "rejected"
          ? "Rejected by a human reviewer."
          : approval.status === "expired"
            ? "Expired without a decision (treated as a soft no)."
            : `Status: ${approval.status}.`;

  const summary = [
    `Action "${approval.action_type}" (risk: ${approval.risk_level}) proposed by agent "${approval.agent_slug}".`,
    `Reasoning at proposal time: ${approval.reasoning ?? "(none given)"}`,
    `Payload: ${JSON.stringify(approval.action_payload).slice(0, 500)}`,
    outcomeLine,
  ].join("\n");

  try {
    await rememberMemory(supa, approval.agent_slug, "approval_requests", approvalId, summary, {
      action_type: approval.action_type,
      risk_level: approval.risk_level,
      status: approval.status,
    } as Json);
  } catch {
    // Best-effort: a missing/misconfigured embedding gateway must never
    // block the real approval/execution flow that called this.
  }
}

export type PriorDecision = { content: string; similarity: number };

/**
 * Recalls past decisions similar to a proposed action, for a given agent.
 * Returns [] (not an error) whenever memory is unavailable/empty/fails --
 * callers fold this into `reasoning` as an optional "precedent" note, never
 * as something the caller must have to proceed.
 */
export async function recallPriorDecisions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  agentSlug: string,
  actionType: string,
  payload: Record<string, unknown>,
  k = 3,
): Promise<PriorDecision[]> {
  try {
    const query = `${actionType} ${JSON.stringify(payload).slice(0, 300)}`;
    const results = await recallMemory(supa, agentSlug, query, k);
    return results
      .filter((r) => r.source_table === "approval_requests")
      .map((r) => ({ content: r.content, similarity: r.similarity }));
  } catch {
    return [];
  }
}

/** Formats recalled precedent as a short, human-readable addendum to an action's `reasoning` string. Returns '' when there's nothing to add. */
export function formatPrecedent(prior: PriorDecision[]): string {
  if (prior.length === 0) return "";
  const lines = prior.map(
    (p, i) =>
      `${i + 1}. (similarity ${(p.similarity * 100).toFixed(0)}%) ${p.content.split("\n")[0]}`,
  );
  return `\n\nPrecedent from ${prior.length} similar past decision(s):\n${lines.join("\n")}`;
}
