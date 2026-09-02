-- Growth OS v2 — fix: max_retries belongs on agents_registry (per-agent
-- CONFIG), not only agents_runs (per-run HISTORY). The prior migration
-- (20260902000000) added it only to agents_runs; agent-execution.server.ts's
-- executeAgent() reads `agent.max_retries` off the agents_registry row it
-- fetches, which was silently always undefined (defaulting to 3 for every
-- agent, with no way to configure it per-agent). Found by re-querying the
-- live schema before building Phase 2 on top of it, rather than assuming
-- the Phase 0 migration did what its comment said.
--
-- agents_runs.max_retries is left in place and is now populated at insert
-- time as a snapshot of the config value used for that run (audit trail),
-- not the config source of truth.
ALTER TABLE public.agents_registry
  ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3;
