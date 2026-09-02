// ============================================================================
// Centralized approval system (Phase 5).
//
// Approval is for the ACTION, not the entire agent run (non-negotiable rule
// #4 + Phase 5 note): an agent's handler calls requestAction() for each
// individual high/medium-risk operation it wants to perform, gets back
// either an immediate execution go-ahead (risk=low) or a pending
// approval_requests row (medium/high) -- and keeps going with the rest of
// its analysis regardless. The run finishes and reports "N actions taken, M
// pending approval," never blocks on a human decision mid-run.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  classifyRisk,
  isAutoApprovable,
  approvalExpiryHours,
  type ProposedAction,
} from "@/lib/risk-classifier";
import { recordApprovalOutcome } from "@/lib/learning.server";
import type { Json } from "@/integrations/supabase/types";

export type RequestActionResult =
  | { decision: "auto_approved"; approvalId: null }
  | { decision: "pending_approval"; approvalId: string; risk: "medium" | "high" };

/**
 * Called from inside an agent handler (via HandlerCtx, wired in Phase 6/7's
 * write operations) whenever it wants to perform something real-world.
 * Returns immediately either way -- the caller decides what to do with a
 * "pending_approval" result (typically: log it, move on to the next
 * candidate action, don't block).
 *
 * eslint-disable-next-line @typescript-eslint/no-explicit-any -- supa is the
 * same untyped Supabase client pattern already used throughout this codebase
 * for tables not yet in the generated types (see competitive.functions.ts's
 * own `untyped()` helper for the same reason).
 */
export async function requestAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  agentSlug: string,
  runId: string | null,
  action: ProposedAction,
  reasoning: string,
): Promise<RequestActionResult> {
  const risk = classifyRisk(action); // ALWAYS re-derived here -- never trust a risk level passed in from the caller/AI

  if (isAutoApprovable(risk)) {
    return { decision: "auto_approved", approvalId: null };
  }

  const expiryHours = approvalExpiryHours(risk);
  const insert: Record<string, unknown> = {
    agent_slug: agentSlug,
    run_id: runId,
    action_type: action.action_type,
    action_payload: action.payload as Json,
    risk_level: risk,
    reasoning,
  };
  if (expiryHours !== null) {
    insert.expires_at = new Date(Date.now() + expiryHours * 3_600_000).toISOString();
  } else {
    // High risk: never silently expire-to-anything. Push expires_at far out
    // (10 years) rather than making the column nullable -- the schema's
    // NOT NULL default already covers "pending forever until decided" for
    // the common case; this just guards a high-risk request from the
    // default 24h expiry that's meant for medium-risk only.
    insert.expires_at = new Date(Date.now() + 10 * 365 * 86_400_000).toISOString();
  }

  const { data, error } = await supa.from("approval_requests").insert(insert).select("id").single();
  if (error) throw new Error(error.message);
  return {
    decision: "pending_approval",
    approvalId: data.id as string,
    risk: risk as "medium" | "high",
  };
}

// ============ UI-facing server functions ============

export const listApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z
          .enum(["pending", "approved", "rejected", "expired", "executed", "execution_failed"])
          .optional(),
      })
      .partial()
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (context.supabase as any)
      .from("approval_requests")
      .select("*")
      .order("requested_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/**
 * Decide (approve/reject) a pending approval. Approving does NOT execute
 * the action here -- it flips status to 'approved' and the worker's task
 * consumer (or, for now, an explicit "Execute" action in the UI -- see
 * Phase 6/7's client wiring) picks up approved rows and actually calls the
 * real API, then updates status to 'executed'/'execution_failed' with the
 * real result. Keeping "approve" and "execute" as two separate steps means
 * an approval can never silently double-execute on a retry.
 */
export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    const { data: existing, error: fetchErr } = await supa
      .from("approval_requests")
      .select("status, expires_at")
      .eq("id", data.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (existing.status !== "pending") {
      throw new Error(
        `This approval is already "${existing.status}" -- decisions can only be made on pending requests (prevents a replayed/duplicate decision).`,
      );
    }
    if (new Date(existing.expires_at) < new Date()) {
      // Never let a decision land on an expired request, even if the UI's
      // own expiry sweep hasn't run yet -- belt and suspenders against the
      // exact bug class Phase 5 calls out ("never allow an approval request
      // to silently execute after expiration").
      await supa.from("approval_requests").update({ status: "expired" }).eq("id", data.id);
      throw new Error("This approval has expired and can no longer be decided.");
    }

    const patch =
      data.decision === "approve"
        ? {
            status: "approved" as const,
            decided_by: context.userId,
            decided_at: new Date().toISOString(),
          }
        : {
            status: "rejected" as const,
            decided_by: context.userId,
            decided_at: new Date().toISOString(),
          };
    // Atomic claim (CAS): the check above is a friendly early error message
    // for the common case, but this WHERE status='pending' is what actually
    // prevents two concurrent decisions (e.g. two reviewers clicking
    // approve/reject at the same moment) from silently racing -- only the
    // one whose UPDATE matches wins; the other gets a clear "already
    // decided" error instead of a nondeterministic overwrite.
    const { data: updated, error } = await supa
      .from("approval_requests")
      .update(patch)
      .eq("id", data.id)
      .eq("status", "pending")
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0)
      throw new Error("This approval was just decided by someone else -- refusing to overwrite.");
    await recordApprovalOutcome(supa, data.id); // Phase 17 — best-effort, never blocks the real decision above
    return { ok: true };
  });

/**
 * Sweep expired pending approvals. Called by the worker on a schedule
 * (Phase 2/5), and safe to also call from the UI on page load for
 * immediate feedback -- idempotent, only touches rows that are actually
 * past expires_at.
 */
export async function expirePendingApprovals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
): Promise<{ expired: number }> {
  const { data, error } = await supa
    .from("approval_requests")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .select("id");
  if (error) throw new Error(error.message);
  return { expired: (data ?? []).length };
}
