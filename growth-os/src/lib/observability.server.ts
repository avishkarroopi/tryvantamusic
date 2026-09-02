// ============================================================================
// Phase 19 — Observability. Read-only rollups over data other phases
// already produce (agents_runs, ai_runs, worker_heartbeats,
// approval_requests) -- no new collection mechanism, just a single place
// that turns raw rows into the numbers a human/dashboard actually wants:
// latency, failure rate, retry pressure, AI cost/usage, worker liveness,
// approval backlog.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export const getObservabilitySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();

    const [runsRes, aiRes, heartbeatRes, approvalsRes, eventsRes] = await Promise.all([
      supa
        .from("agents_runs")
        .select("agent_slug,status,duration_ms,retry_count,started_at")
        .gte("started_at", since),
      supa
        .from("ai_runs")
        .select("purpose,model,latency_ms,input_tokens,output_tokens,success,created_at")
        .gte("created_at", since),
      supa.from("worker_heartbeats").select("*").eq("id", "singleton").maybeSingle(),
      supa.from("approval_requests").select("status,risk_level,requested_at"),
      supa.from("agents_events").select("processed").gte("created_at", since),
    ]);

    const runs = (runsRes.data ?? []) as Array<{
      agent_slug: string;
      status: string;
      duration_ms: number | null;
      retry_count: number;
      started_at: string;
    }>;
    const aiRuns = (aiRes.data ?? []) as Array<{
      purpose: string;
      model: string;
      latency_ms: number | null;
      input_tokens: number | null;
      output_tokens: number | null;
      success: boolean;
    }>;
    const heartbeat = heartbeatRes.data as {
      status: string;
      last_tick_at: string | null;
      ticks: number;
      totals: Record<string, number>;
    } | null;
    const approvals = (approvalsRes.data ?? []) as Array<{
      status: string;
      risk_level: string;
      requested_at: string;
    }>;
    const events = (eventsRes.data ?? []) as Array<{ processed: boolean }>;

    const durations = runs
      .map((r) => r.duration_ms)
      .filter((d): d is number => typeof d === "number")
      .sort((a, b) => a - b);
    const failedStatuses = new Set(["failed", "failed_permanent"]);
    const failures = runs.filter((r) => failedStatuses.has(r.status)).length;
    const retried = runs.filter((r) => r.retry_count > 0).length;

    const perAgent = new Map<string, { runs: number; failures: number; totalMs: number }>();
    for (const r of runs) {
      const bucket = perAgent.get(r.agent_slug) ?? { runs: 0, failures: 0, totalMs: 0 };
      bucket.runs++;
      if (failedStatuses.has(r.status)) bucket.failures++;
      if (typeof r.duration_ms === "number") bucket.totalMs += r.duration_ms;
      perAgent.set(r.agent_slug, bucket);
    }

    const aiByPurpose = new Map<
      string,
      {
        calls: number;
        failures: number;
        inputTokens: number;
        outputTokens: number;
        totalLatencyMs: number;
      }
    >();
    for (const a of aiRuns) {
      const bucket = aiByPurpose.get(a.purpose) ?? {
        calls: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalLatencyMs: 0,
      };
      bucket.calls++;
      if (!a.success) bucket.failures++;
      bucket.inputTokens += a.input_tokens ?? 0;
      bucket.outputTokens += a.output_tokens ?? 0;
      bucket.totalLatencyMs += a.latency_ms ?? 0;
      aiByPurpose.set(a.purpose, bucket);
    }

    const workerAlive =
      !!heartbeat?.last_tick_at &&
      (Date.now() - new Date(heartbeat.last_tick_at).getTime()) / 60_000 <= 5;

    return {
      windowHours: 24,
      agentRuns: {
        total: runs.length,
        failures,
        failureRatePct: runs.length > 0 ? Math.round((failures / runs.length) * 1000) / 10 : 0,
        retried,
        avgDurationMs:
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0,
        p50DurationMs: percentile(durations, 50),
        p95DurationMs: percentile(durations, 95),
        byAgent: [...perAgent.entries()].map(([slug, b]) => ({
          slug,
          runs: b.runs,
          failures: b.failures,
          avgDurationMs: b.runs > 0 ? Math.round(b.totalMs / b.runs) : 0,
        })),
      },
      aiUsage: {
        totalCalls: aiRuns.length,
        totalInputTokens: aiRuns.reduce((a, r) => a + (r.input_tokens ?? 0), 0),
        totalOutputTokens: aiRuns.reduce((a, r) => a + (r.output_tokens ?? 0), 0),
        byPurpose: [...aiByPurpose.entries()].map(([purpose, b]) => ({
          purpose,
          calls: b.calls,
          failures: b.failures,
          avgLatencyMs: b.calls > 0 ? Math.round(b.totalLatencyMs / b.calls) : 0,
          inputTokens: b.inputTokens,
          outputTokens: b.outputTokens,
        })),
      },
      worker: {
        alive: workerAlive,
        status: heartbeat?.status ?? "never_seen",
        lastTickAt: heartbeat?.last_tick_at ?? null,
        ticks: heartbeat?.ticks ?? 0,
        totals: heartbeat?.totals ?? {},
      },
      approvals: {
        pending: approvals.filter((a) => a.status === "pending").length,
        approved: approvals.filter((a) => a.status === "approved").length,
        executed: approvals.filter((a) => a.status === "executed").length,
        executionFailed: approvals.filter((a) => a.status === "execution_failed").length,
        rejected: approvals.filter((a) => a.status === "rejected").length,
        expired: approvals.filter((a) => a.status === "expired").length,
        byRisk: {
          low: approvals.filter((a) => a.risk_level === "low").length,
          medium: approvals.filter((a) => a.risk_level === "medium").length,
          high: approvals.filter((a) => a.risk_level === "high").length,
        },
      },
      events: {
        last24h: events.length,
        unprocessedBacklog: events.filter((e) => !e.processed).length,
      },
    };
  });
