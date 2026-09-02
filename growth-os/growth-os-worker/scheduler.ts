// ============================================================================
// Scheduler loop (Phase 2, requirement #1).
//
// Deliberately does NOT use Postgres session-level advisory locks
// (pg_advisory_lock). Reasoning, worth keeping in a comment because it's a
// real, easy-to-get-wrong Supabase gotcha: Supabase's Postgres connection
// is fronted by a connection pooler in transaction-pooling mode, and every
// PostgREST/RPC call is its own separate underlying connection/transaction.
// A session-scoped advisory lock acquired in one RPC call is NOT held
// across a second RPC call -- there is no stable "session" to hold it on.
// This would make advisory locks silently useless here (this is also why
// the architecture explicitly avoided introducing a dedicated queue
// broker like Redis/BullMQ: the actual answer is to not need a
// held-open-lock model at all).
//
// Instead, this uses an atomic compare-and-swap UPDATE: claim a due agent
// by updating its `next_run_at` to the following scheduled fire time WHERE
// `next_run_at` still equals the value we just read. Postgres serializes
// concurrent UPDATEs to the same row; if a second worker process (or a
// second tick of this same loop) races for the same row, exactly one CAS
// succeeds (returns the updated row) and the other returns zero rows,
// which this code treats as "someone else already claimed it, skip." This
// is race-safe with zero new infrastructure and zero session-affinity
// assumptions -- it works identically whether there's one worker or ten.
// ============================================================================
import { CronExpressionParser } from "cron-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { executeAgent, type AgentHandler } from "../src/lib/agent-execution.server";
import { log } from "./log";

type RegistryRow = Database["public"]["Tables"]["agents_registry"]["Row"];

/** Parses `default_schedule` (a standard cron expression, UTC) and returns the next fire time after `from`. */
export function computeNextRunAt(cronExpr: string, from: Date): Date | null {
  try {
    const interval = CronExpressionParser.parse(cronExpr, { currentDate: from, tz: "UTC" });
    return interval.next().toDate();
  } catch (err) {
    log.warn("Invalid cron expression -- cannot compute next_run_at", {
      cronExpr,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Any agent in mode='scheduled' with a valid default_schedule but no
 * next_run_at yet (freshly switched into scheduled mode) gets one seeded,
 * computed from now. Uses the same next_run_at IS NULL guard as the CAS
 * claim below, so this is equally race-safe.
 */
export async function seedMissingNextRunAt(supa: SupabaseClient<Database>): Promise<number> {
  const { data: rows, error } = await supa
    .from("agents_registry")
    .select("slug, default_schedule")
    .eq("mode", "scheduled")
    .eq("enabled", true)
    .is("next_run_at", null);
  if (error) throw new Error(error.message);

  let seeded = 0;
  for (const row of (rows ?? []) as Pick<RegistryRow, "slug" | "default_schedule">[]) {
    if (!row.default_schedule) {
      log.warn(
        `Agent "${row.slug}" is mode='scheduled' but has no default_schedule -- will never run until configured.`,
      );
      continue;
    }
    const next = computeNextRunAt(row.default_schedule, new Date());
    if (!next) continue;
    const { data: claimed } = await supa
      .from("agents_registry")
      .update({ next_run_at: next.toISOString() })
      .eq("slug", row.slug)
      .is("next_run_at", null) // CAS: only if still unset (another tick/worker didn't just seed it)
      .select("slug");
    if (claimed && claimed.length > 0) seeded++;
  }
  return seeded;
}

/**
 * Finds agents whose scheduled fire time has arrived, claims each via CAS,
 * and runs it through the shared executeAgent() core with trigger='scheduled'.
 * Returns how many were actually claimed+executed this tick (not just due).
 */
export async function runDueScheduledAgents(
  supa: SupabaseClient<Database>,
  handlers: Record<string, AgentHandler>,
): Promise<{ claimed: number; skipped: number }> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supa
    .from("agents_registry")
    .select("slug, default_schedule, next_run_at")
    .eq("mode", "scheduled")
    .eq("enabled", true)
    .not("next_run_at", "is", null)
    .lte("next_run_at", nowIso);
  if (error) throw new Error(error.message);

  let claimed = 0;
  let skipped = 0;
  for (const row of (due ?? []) as Pick<
    RegistryRow,
    "slug" | "default_schedule" | "next_run_at"
  >[]) {
    const originalNextRunAt = row.next_run_at as string;
    const following = row.default_schedule
      ? computeNextRunAt(row.default_schedule, new Date())
      : null;
    // Advance next_run_at BEFORE running (not after) so a long-running or
    // hung handler can't cause this same fire time to be claimed twice in
    // a row -- it also means a crashed worker mid-handler doesn't stall
    // the schedule forever (contrast with recoverStaleRuns, which handles
    // the agents_runs row itself; this is about the registry's schedule
    // cursor specifically).
    const { data: claimedRow, error: casErr } = await supa
      .from("agents_registry")
      .update({ next_run_at: following ? following.toISOString() : null })
      .eq("slug", row.slug)
      .eq("next_run_at", originalNextRunAt) // CAS
      .select("slug");
    if (casErr) {
      log.error(`CAS claim failed for "${row.slug}"`, { error: casErr.message });
      continue;
    }
    if (!claimedRow || claimedRow.length === 0) {
      skipped++;
      continue;
    } // another worker/tick already claimed it

    claimed++;
    log.info(`Claimed scheduled run for "${row.slug}"`, {
      nextFireAfter: following?.toISOString() ?? null,
    });
    try {
      const result = await executeAgent(supa, row.slug, "scheduled", handlers);
      if (!result.ok)
        log.warn(`Scheduled run of "${row.slug}" failed`, {
          error: result.error,
          willRetry: result.willRetry,
        });
    } catch (err) {
      // executeAgent itself only throws for setup problems (agent not
      // found/disabled) -- a handler failure is already caught inside it.
      // Still never let one agent's setup problem kill the scheduler loop.
      log.error(`executeAgent threw for scheduled agent "${row.slug}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { claimed, skipped };
}
