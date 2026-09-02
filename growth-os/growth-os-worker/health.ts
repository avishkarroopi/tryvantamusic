// ============================================================================
// Health status endpoint (Phase 2, requirement #8).
//
// A tiny in-process HTTP server (no framework dependency) exposing current
// worker health as JSON -- for systemd (`ExecStartPost`/watchdog probes via
// curl), an external uptime monitor, or manual `curl localhost:PORT/health`
// during Phase 23 deployment verification. Deliberately not a new DB table:
// this is transient process state, not something that needs to survive a
// restart or be queried from the dashboard (agents_runs/agents_logs already
// give durable, queryable history of what the worker actually did).
// ============================================================================
import { createServer, type Server } from "node:http";
import { log } from "./log";

export type WorkerHealth = {
  status: "starting" | "healthy" | "degraded";
  startedAt: string;
  lastTickAt: string | null;
  lastTickError: string | null;
  ticks: number;
  totals: {
    scheduledRuns: number;
    eventDispatches: number;
    tasksTriggered: number;
    retriesProcessed: number;
    staleRunsRecovered: number;
  };
};

export function createHealthState(): WorkerHealth {
  return {
    status: "starting",
    startedAt: new Date().toISOString(),
    lastTickAt: null,
    lastTickError: null,
    ticks: 0,
    totals: {
      scheduledRuns: 0,
      eventDispatches: 0,
      tasksTriggered: 0,
      retriesProcessed: 0,
      staleRunsRecovered: 0,
    },
  };
}

export function startHealthServer(port: number, getHealth: () => WorkerHealth): Server {
  const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      const health = getHealth();
      const httpStatus = health.status === "degraded" ? 503 : 200;
      res.writeHead(httpStatus, { "content-type": "application/json" });
      res.end(JSON.stringify(health, null, 2));
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    }
  });
  server.listen(port, () => log.info(`Health endpoint listening on :${port}/health`));
  return server;
}
