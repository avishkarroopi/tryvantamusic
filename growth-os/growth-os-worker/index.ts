// ============================================================================
// growth-os-worker — the 24/7 worker process (Phase 2).
//
// A separate Node process from the TanStack Start app, run in the SAME
// repository (`npm run worker` / `npm run worker:build && npm run
// worker:start` — see package.json and growth-os-worker/README.md), sharing
// -- not duplicating -- all business logic:
//   - the 13 real agent handlers (HANDLERS, from src/lib/agents.functions.ts)
//   - the one execution core (executeAgent/recoverStaleRuns/processDueRetries,
//     from src/lib/agent-execution.server.ts)
//
// Requirement mapping (Phase 2's numbered list -> what implements it):
//   1. Scheduler loop     -> scheduler.ts (seedMissingNextRunAt + runDueScheduledAgents)
//   2. Task consumer      -> tasks.ts (processPendingTasks)
//   3. Event consumer     -> events.ts (processPendingEvents)
//   4. Retry engine       -> agent-execution.server.ts's processDueRetries (Phase 4, reused)
//   5. Crash recovery     -> agent-execution.server.ts's recoverStaleRuns, run once at startup
//   6. Heartbeats         -> per-run: agents_runs.heartbeat_at (agent-execution.server.ts).
//                            Per-process: this file's own tick logging + /health endpoint
//                            (a worker process log/HTTP surface, not a DB row -- there is
//                            no "worker process" entity in the schema to attach one to,
//                            and inventing one wasn't asked for; /health is the liveness signal).
//   7. Graceful shutdown  -> SIGINT/SIGTERM handler below: finish the in-flight tick,
//                            close the health server, exit 0.
//   8. Health status      -> health.ts's /health endpoint.
//   9. Structured logging -> log.ts (JSON lines to stdout/stderr).
//
// Approval expiry sweep (Phase 5) is also run here on the same cadence --
// it's cheap, idempotent, and has nowhere else continuous to live.
// ============================================================================
import { HANDLERS } from "../src/lib/agents.functions";
import { recoverStaleRuns, processDueRetries } from "../src/lib/agent-execution.server";
import { expirePendingApprovals } from "../src/lib/approvals.functions";
import { createWorkerDb, hasWorkerCredentials } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { seedMissingNextRunAt, runDueScheduledAgents } from "./scheduler";
import { processPendingEvents } from "./events";
import { processPendingTasks } from "./tasks";
import { createHealthState, startHealthServer } from "./health";
import { log } from "./log";

const TICK_INTERVAL_MS = Number(process.env.WORKER_TICK_INTERVAL_MS ?? 30_000); // 30s default
const HEALTH_PORT = Number(process.env.WORKER_HEALTH_PORT ?? 8787);
const STALE_RECOVERY_INTERVAL_TICKS = 20; // ~every 10 min at the 30s default, in addition to the mandatory startup pass

async function main() {
  log.info("growth-os-worker starting", {
    tickIntervalMs: TICK_INTERVAL_MS,
    healthPort: HEALTH_PORT,
  });

  if (!hasWorkerCredentials()) {
    // Explicit, loud, non-fatal-but-honest degraded state -- per the
    // project's non-negotiable rule against pretending a credential-gated
    // capability is live. Exits rather than limping along, since without
    // these there is no way to authenticate at all (unlike other
    // integrations, this isn't a "some features degrade" situation).
    log.error(
      "SUPABASE_WORKER_EMAIL/SUPABASE_WORKER_PASSWORD are not set. Lovable Cloud does not expose a service-role " +
        "key, so this dedicated Auth user is the only way the worker can authenticate -- see growth-os-worker/README.md.",
    );
    process.exit(1);
  }

  let supa: SupabaseClient<Database>;
  try {
    supa = await createWorkerDb();
  } catch (err) {
    log.error("Worker sign-in failed at startup", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
  const health = createHealthState();
  const healthServer = startHealthServer(HEALTH_PORT, () => health);

  // Crash recovery (#5): mandatory once at startup, before anything else
  // touches agents_runs, so a run abandoned by a previous crashed process
  // is never left 'running' forever nor double-executed by this new process.
  try {
    const recovery = await recoverStaleRuns(supa);
    health.totals.staleRunsRecovered += recovery.recovered;
    if (recovery.recovered > 0)
      log.warn(`Startup crash recovery: marked ${recovery.recovered} stale run(s) failed`, {
        runIds: recovery.runIds,
      });
    else log.info("Startup crash recovery: no stale runs found.");
  } catch (err) {
    log.error("Startup crash recovery failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  let stopping = false;
  let tickCount = 0;

  async function tick() {
    if (stopping) return;
    tickCount++;
    try {
      const seeded = await seedMissingNextRunAt(supa);
      if (seeded > 0) log.info(`Seeded next_run_at for ${seeded} newly-scheduled agent(s)`);

      const scheduled = await runDueScheduledAgents(supa, HANDLERS);
      health.totals.scheduledRuns += scheduled.claimed;

      const events = await processPendingEvents(supa, HANDLERS);
      health.totals.eventDispatches += events.dispatches;

      const tasks = await processPendingTasks(supa, HANDLERS);
      health.totals.tasksTriggered += tasks.agentsTriggered;

      const retries = await processDueRetries(supa, HANDLERS);
      health.totals.retriesProcessed += retries.processed;

      const expired = await expirePendingApprovals(supa);

      if (tickCount % STALE_RECOVERY_INTERVAL_TICKS === 0) {
        const recovery = await recoverStaleRuns(supa);
        health.totals.staleRunsRecovered += recovery.recovered;
        if (recovery.recovered > 0)
          log.warn(`Periodic crash recovery: marked ${recovery.recovered} stale run(s) failed`, {
            runIds: recovery.runIds,
          });
      }

      health.status = "healthy";
      health.lastTickAt = new Date().toISOString();
      health.lastTickError = null;
      health.ticks = tickCount;
      log.debug("tick complete", {
        scheduledClaimed: scheduled.claimed,
        scheduledSkipped: scheduled.skipped,
        eventsProcessed: events.eventsProcessed,
        eventDispatches: events.dispatches,
        tasksAgentsTriggered: tasks.agentsTriggered,
        tasksClaimed: tasks.tasksClaimed,
        retriesProcessed: retries.processed,
        approvalsExpired: expired.expired,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      health.status = "degraded";
      health.lastTickAt = new Date().toISOString();
      health.lastTickError = msg;
      health.ticks = tickCount;
      log.error("tick failed", { error: msg });
    }
    await syncHeartbeatToDb(); // Phase 19 — makes the health object above a real DB fact CEO/the dashboard can see, not just this process's own /health endpoint
  }

  // Phase 19 — Observability: mirrors the in-memory `health` object into
  // worker_heartbeats (a single upserted row) every tick, so anything that
  // can query Postgres -- the CEO agent, a dashboard -- can see whether the
  // worker is actually alive, without needing network access to this
  // process's own localhost-only /health endpoint. Best-effort: a failure
  // here is logged, never thrown (must not take down the real tick work
  // above just because this observability write failed).
  async function syncHeartbeatToDb(): Promise<void> {
    try {
      await supa.from("worker_heartbeats").upsert({
        id: "singleton",
        status: health.status,
        started_at: health.startedAt,
        last_tick_at: health.lastTickAt,
        last_tick_error: health.lastTickError,
        ticks: health.ticks,
        totals: health.totals,
      });
    } catch (err) {
      log.warn("Failed to sync heartbeat to DB", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await tick(); // run one tick immediately rather than waiting a full interval on cold start
  const interval = setInterval(tick, TICK_INTERVAL_MS);

  // Graceful shutdown (#7): stop scheduling new ticks, let the current one
  // finish (Node won't run a new setInterval callback while a prior async
  // tick is still pending only if we guard with `stopping`/re-entrancy --
  // tick() already checks `stopping` at the top for this reason), close the
  // health server, then exit.
  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info(`Received ${signal}, shutting down gracefully...`);
    clearInterval(interval);
    healthServer.close(() => {
      log.info("Health server closed. Goodbye.");
      process.exit(0);
    });
    // Safety net: don't hang forever if something holds the server open.
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  log.info("growth-os-worker started.");
}

main().catch((err) => {
  log.error("Fatal error during worker startup", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
