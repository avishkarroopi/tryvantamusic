// ============================================================================
// Unified Agent Execution Engine (Phase 1).
//
// ONE execution core, invoked identically by:
//   - the dashboard's manual "Run now" button (via runAgentNow in agents.functions.ts)
//   - the worker's scheduler loop (trigger='scheduled')
//   - the worker's event consumer (trigger='event')
//   - the worker's task consumer (trigger='task')
//   - the worker's retry engine (trigger='retry')
//
// The 13 existing handlers (handleCEO, handleMarketing, ... in
// agents.functions.ts) are NOT duplicated or rewritten here -- this module
// only owns the lifecycle (run creation -> pending -> running -> succeeded/
// failed/retry_pending/failed_permanent) around whichever handler is called.
// agents.functions.ts still owns HANDLERS and HandlerCtx; this module takes
// them as a dependency (passed in by whichever caller needs them) so there is
// no circular import between the two.
// ============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";

export type ExecutionTrigger = "manual" | "scheduled" | "ceo" | "event" | "task" | "retry";

export type AgentHandlerCtx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any;
  slug: string;
  runId: string;
  log: (level: "info" | "warn" | "error", message: string, extra?: Json) => Promise<void>;
  emit: (event_type: string, payload: Json, to?: string | null) => Promise<void>;
  createTask: (title: string, priority?: "low" | "medium" | "high") => Promise<void>;
  knowledge: (
    category?: string,
  ) => Promise<Array<{ title: string; content: string; category: string }>>;
};

export type AgentHandler = (ctx: AgentHandlerCtx) => Promise<Json>;

export type ExecuteAgentResult =
  | { ok: true; runId: string; output: Json }
  | { ok: false; runId: string; error: string; willRetry: boolean };

// Exponential backoff schedule (Phase 4). Index = retry_count AFTER this failure.
// retry_count=1 -> wait 1 min, =2 -> 5 min, =3 -> 30 min, then failed_permanent.
const RETRY_BACKOFF_MINUTES = [1, 5, 30];

// A run is considered abandoned (crashed worker/process) if its heartbeat is
// older than this while status='running'. Used by recoverStaleRuns() below,
// called once at worker startup and periodically while it runs (Phase 4).
const STALE_RUN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Phase 3 fan-out/cycle protection: every event's fan_out_depth is its
// causation event's depth + 1 (0 for a fresh chain started by a
// manual/scheduled/task/retry run). Refusing to insert past this cap is a
// deliberately cheap way to make A-emits->B-emits->A... cascades
// self-terminating without walking the whole ancestor chain on every
// emit() call -- a genuine infinite loop hits this ceiling in at most
// MAX_FAN_OUT_DEPTH hops and stops, logged loudly instead of silently
// spinning.
const MAX_FAN_OUT_DEPTH = 10;

/**
 * The one execution core. Every caller (manual UI action, scheduler, event
 * consumer, task consumer, retry engine) goes through this function --
 * nothing else is allowed to flip agents_runs.status directly.
 *
 * @param supa       An authenticated Supabase client. For 'manual' triggers
 *                    this is the RLS-scoped client from the calling user's
 *                    session (existing behaviour, unchanged). For worker-
 *                    initiated triggers ('scheduled'/'event'/'task'/'retry')
 *                    this must be a service-role client (the worker has no
 *                    end-user session to scope RLS against) -- see
 *                    growth-os-worker/src/db.ts.
 * @param slug        Agent slug (must exist + be enabled in agents_registry).
 * @param trigger     One of the 6 real trigger types (Phase 1 rule #3).
 * @param handlers    The HANDLERS map from agents.functions.ts (passed in,
 *                    not imported, to avoid a circular dependency).
 * @param opts.causationEventId  Set when trigger='event' -- the agents_events
 *                    row that caused this run (Phase 3 causation tracking).
 * @param opts.retryOfRunId      Set when trigger='retry' -- the prior failed
 *                    run being retried (used to carry over retry_count).
 */
export async function executeAgent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  slug: string,
  trigger: ExecutionTrigger,
  handlers: Record<string, AgentHandler>,
  opts?: { causationEventId?: string; retryOfRunId?: string },
): Promise<ExecuteAgentResult> {
  const { data: agent, error: aErr } = await supa
    .from("agents_registry")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (aErr) throw new Error(aErr.message);
  if (!agent) throw new Error("Agent not found");
  if (!agent.enabled) throw new Error("Agent is disabled");

  let retryCount = 0;
  if (opts?.retryOfRunId) {
    const { data: priorRun } = await supa
      .from("agents_runs")
      .select("retry_count")
      .eq("id", opts.retryOfRunId)
      .maybeSingle();
    retryCount = (priorRun?.retry_count ?? 0) + 1;
  }

  // agents_registry.max_retries is the config source of truth (fixed via
  // 20260902020000: it was mistakenly only added to agents_runs at first).
  // Snapshot it onto the run row too, so a later config change doesn't
  // retroactively change what an in-flight retry chain is judged against.
  const maxRetries = agent.max_retries ?? 3;

  const startedAt = new Date();
  const { data: runIns, error: rErr } = await supa
    .from("agents_runs")
    .insert({
      agent_slug: slug,
      status: "running",
      trigger,
      started_at: startedAt.toISOString(),
      heartbeat_at: startedAt.toISOString(),
      retry_count: retryCount,
      max_retries: maxRetries,
      causation_event_id: opts?.causationEventId ?? null,
    })
    .select("id")
    .single();
  if (rErr) throw new Error(rErr.message);
  const runId = runIns.id as string;

  // Heartbeat: updated once at start and once at the end. A handler that
  // hangs indefinitely will show a stale heartbeat (Phase 4/19 detect this),
  // rather than looking identical to a fast, healthy run.
  const heartbeat = async () => {
    await supa
      .from("agents_runs")
      .update({ heartbeat_at: new Date().toISOString() })
      .eq("id", runId);
  };

  const log: AgentHandlerCtx["log"] = async (level, message, extra) => {
    await supa
      .from("agents_logs")
      .insert({ run_id: runId, agent_slug: slug, level, message, data: extra ?? null });
  };

  // This run's own causation depth: 0 for a fresh chain (manual/scheduled/
  // task/retry trigger), or one more than the event that caused it, for
  // trigger='event'. Fetched once per run, not once per emit() call.
  let causationDepth = 0;
  if (opts?.causationEventId) {
    const { data: causeEvent } = await supa
      .from("agents_events")
      .select("fan_out_depth")
      .eq("id", opts.causationEventId)
      .maybeSingle();
    causationDepth = (causeEvent?.fan_out_depth ?? 0) as number;
  }

  const emit: AgentHandlerCtx["emit"] = async (event_type, payload, to = null) => {
    const nextDepth = causationDepth + 1;
    if (nextDepth > MAX_FAN_OUT_DEPTH) {
      await log(
        "error",
        `Event "${event_type}" blocked: fan-out depth would exceed ${MAX_FAN_OUT_DEPTH} (likely cascade/cycle from causation event ${opts?.causationEventId ?? "none"}).`,
      );
      return;
    }
    await supa.from("agents_events").insert({
      from_agent: slug,
      to_agent: to,
      event_type,
      payload,
      run_id: runId,
      causation_event_id: opts?.causationEventId ?? null,
      fan_out_depth: nextDepth,
    });
  };
  const createTask: AgentHandlerCtx["createTask"] = async (title, priority = "medium") => {
    await supa
      .from("agents_tasks")
      .insert({ agent_slug: slug, title, priority, status: "pending" });
  };
  const knowledge: AgentHandlerCtx["knowledge"] = async (category) => {
    let q = supa.from("agents_knowledge").select("title,content,category");
    if (category) q = q.eq("category", category);
    const { data } = await q.limit(20);
    return (data ?? []) as Array<{ title: string; content: string; category: string }>;
  };

  try {
    await log(
      "info",
      `Agent ${agent.name} invoked (${trigger} trigger, attempt ${retryCount + 1}).`,
    );
    await heartbeat();
    const handler = handlers[slug];
    let output: Json = { note: "No handler registered; noop run." };
    if (handler) {
      output = await handler({ supa, slug, runId, log, emit, createTask, knowledge });
    } else {
      await log("warn", `No handler registered for ${slug}.`);
    }
    await heartbeat();

    const finishedAt = new Date();
    await supa
      .from("agents_runs")
      .update({
        status: "succeeded",
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        output,
      })
      .eq("id", runId);
    await supa
      .from("agents_registry")
      .update({ last_run_at: finishedAt.toISOString() })
      .eq("slug", slug);

    return { ok: true, runId, output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const willRetry = retryCount < maxRetries;
    const finishedAt = new Date();

    if (willRetry) {
      const backoffMin =
        RETRY_BACKOFF_MINUTES[Math.min(retryCount, RETRY_BACKOFF_MINUTES.length - 1)];
      const nextRetryAt = new Date(finishedAt.getTime() + backoffMin * 60_000);
      await supa
        .from("agents_runs")
        .update({
          status: "retry_pending",
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
          error: msg,
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq("id", runId);
      await log(
        "error",
        `${msg} -- will retry in ${backoffMin}min (attempt ${retryCount + 1}/${maxRetries})`,
      );
    } else {
      await supa
        .from("agents_runs")
        .update({
          status: "failed_permanent",
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
          error: msg,
        })
        .eq("id", runId);
      await log(
        "error",
        `${msg} -- PERMANENT FAILURE after ${retryCount + 1} attempts, escalating to CEO`,
      );
      // Escalation (Phase 4 requirement: "create a high-priority task,
      // notify/escalate appropriately"). A task assigned to the ceo agent
      // itself, so it shows up the next time CEO runs (manually or
      // scheduled) without CEO needing any special-cased code for this.
      await supa.from("agents_tasks").insert({
        agent_slug: "ceo",
        title: `${agent.name} failed permanently after ${retryCount + 1} attempts: ${msg.slice(0, 200)}`,
        priority: "high",
        status: "pending",
      });
    }
    return { ok: false, runId, error: msg, willRetry };
  }
}

/**
 * Crash recovery (Phase 4): called once at worker startup. Any run still
 * 'running' with a heartbeat older than STALE_RUN_TIMEOUT_MS is either the
 * process that died mid-execution, or (rarer) a genuinely hung handler.
 * Either way it must never stay 'running' forever -- mark it failed and let
 * the normal retry logic (via a fresh executeAgent call, not this function)
 * decide whether to try again.
 */
export async function recoverStaleRuns(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
): Promise<{ recovered: number; runIds: string[] }> {
  const staleBefore = new Date(Date.now() - STALE_RUN_TIMEOUT_MS).toISOString();
  const { data: stale, error } = await supa
    .from("agents_runs")
    .select("id, agent_slug, retry_count")
    .eq("status", "running")
    .lt("heartbeat_at", staleBefore);
  if (error) throw new Error(error.message);
  const runs = (stale ?? []) as Array<{ id: string; agent_slug: string; retry_count: number }>;
  if (runs.length === 0) return { recovered: 0, runIds: [] };

  for (const run of runs) {
    await supa
      .from("agents_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error:
          "Recovered at worker startup: heartbeat stale (process likely crashed mid-execution).",
      })
      .eq("id", run.id);
    await supa.from("agents_logs").insert({
      run_id: run.id,
      agent_slug: run.agent_slug,
      level: "error",
      message: "Marked failed by crash-recovery: stale heartbeat detected at worker startup.",
    });
  }
  return { recovered: runs.length, runIds: runs.map((r) => r.id) };
}

/**
 * Retry engine (Phase 4): called periodically by the worker. Picks up any
 * run in 'retry_pending' whose next_retry_at has arrived and re-executes
 * the SAME agent through the SAME executeAgent() core, with trigger='retry'
 * and retryOfRunId set so the retry_count chain is preserved.
 */
export async function processDueRetries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  handlers: Record<string, AgentHandler>,
): Promise<{ processed: number }> {
  const { data: due, error } = await supa
    .from("agents_runs")
    .select("id, agent_slug")
    .eq("status", "retry_pending")
    .lte("next_retry_at", new Date().toISOString());
  if (error) throw new Error(error.message);
  const runs = (due ?? []) as Array<{ id: string; agent_slug: string }>;
  for (const run of runs) {
    await executeAgent(supa, run.agent_slug, "retry", handlers, { retryOfRunId: run.id });
  }
  return { processed: runs.length };
}
