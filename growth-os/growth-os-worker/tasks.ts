// ============================================================================
// Task consumer (Phase 2, requirement #2).
//
// agents_tasks today is a backlog list each handler writes advisory items
// into (e.g. "Review & schedule this week's content calendar") and the CEO
// handler reads across all agents for its brief -- confirmed by searching
// the codebase: nothing anywhere currently transitions a task to 'done' or
// reads back an individual task's payload to act on it. There is no
// existing "task completion" convention to hook into, and inventing one
// (e.g. auto-marking tasks 'done' after the owning agent merely runs, whether
// or not it actually addressed that specific task) would fabricate a
// signal that isn't real -- exactly what this build must not do.
//
// So this consumer's real, honest job is narrower than "execute tasks":
// make sure an agent with a pending backlog actually gets invoked (matters
// most for the Phase 4 escalation path, which creates a high-priority
// 'ceo' task on permanent failure -- without this, that task would just
// sit unseen until someone next opens the dashboard and clicks Run). It
// claims pending tasks (CAS pending -> in_progress, so the same tasks
// aren't re-claimed next tick) per distinct agent_slug, then triggers that
// agent once via executeAgent(..., "task", ...). Marking a task 'done' is
// left to a human via the dashboard (Phase 20) until/unless a handler
// convention for self-reporting task completion is introduced.
// ============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { executeAgent, type AgentHandler } from "../src/lib/agent-execution.server";
import { log } from "./log";

type TaskRow = Database["public"]["Tables"]["agents_tasks"]["Row"];

export async function processPendingTasks(
  supa: SupabaseClient<Database>,
  handlers: Record<string, AgentHandler>,
): Promise<{ agentsTriggered: number; tasksClaimed: number }> {
  const { data: pending, error } = await supa
    .from("agents_tasks")
    .select("id, agent_slug, priority")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (pending ?? []) as Pick<TaskRow, "id" | "agent_slug" | "priority">[];
  if (rows.length === 0) return { agentsTriggered: 0, tasksClaimed: 0 };

  const bySlug = new Map<string, string[]>(); // agent_slug -> task ids
  for (const t of rows) {
    if (!bySlug.has(t.agent_slug)) bySlug.set(t.agent_slug, []);
    bySlug.get(t.agent_slug)!.push(t.id);
  }

  let agentsTriggered = 0;
  let tasksClaimed = 0;
  for (const [slug, taskIds] of bySlug) {
    // Claim (CAS: only tasks still 'pending' get flipped -- if another
    // worker tick already claimed some between the SELECT above and here,
    // this simply claims fewer than taskIds.length, which is fine).
    const { data: claimed, error: claimErr } = await supa
      .from("agents_tasks")
      .update({ status: "in_progress" })
      .in("id", taskIds)
      .eq("status", "pending")
      .select("id");
    if (claimErr) {
      log.error(`Failed to claim tasks for "${slug}"`, { error: claimErr.message });
      continue;
    }
    if (!claimed || claimed.length === 0) continue; // all already claimed elsewhere this tick

    tasksClaimed += claimed.length;
    try {
      const result = await executeAgent(supa, slug, "task", handlers);
      agentsTriggered++;
      if (!result.ok)
        log.warn(`Task-triggered run of "${slug}" failed`, {
          error: result.error,
          willRetry: result.willRetry,
          taskCount: claimed.length,
        });
    } catch (err) {
      log.error(`executeAgent threw for task-owning agent "${slug}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { agentsTriggered, tasksClaimed };
}
