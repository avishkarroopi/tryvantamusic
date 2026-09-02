-- Growth OS v2 — fix: agents_tasks was missing `priority` and a 'pending'
-- status value that the ENTIRE codebase already assumed existed.
--
-- Found via live-schema verification while building Phase 2 (worker): the
-- original agents_tasks table (20260711174644) only ever had
-- status IN ('planned','in_progress','done','failed') and no priority
-- column. But:
--   - agent-execution.server.ts's createTask() closure (used by all 13
--     agent handlers, 11 real call sites in agents.functions.ts) inserts
--     {agent_slug, title, priority, status:'pending'}
--   - the permanent-failure escalation path inserts the same shape
--   - THREE existing read call sites (agents.functions.ts lines ~158, 423,
--     563) already SELECT/filter on `priority` and `status='pending'`
-- This is not new code assuming a new shape -- it predates this session's
-- changes (confirmed via git history) and has been live and broken since
-- agents_tasks was introduced: every createTask() call would throw a
-- real Postgres error ("column priority does not exist" / a CHECK
-- violation), which -- since handlers run inside executeAgent()'s try/catch
-- with no inner try/catch around createTask() -- fails the ENTIRE agent run,
-- not just the task-creation step. Fixing now because Phase 2's worker and
-- Phase 4's escalation path both depend on this actually working.
--
-- Additive + widening only: existing status values are a strict subset of
-- the new CHECK, priority gets a safe default so old rows written before
-- this bug existed (extremely unlikely to be any, since inserts always
-- errored, but idempotent-safe either way) don't fail a NOT NULL backfill.
ALTER TABLE public.agents_tasks
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE public.agents_tasks DROP CONSTRAINT IF EXISTS agents_tasks_priority_check;
ALTER TABLE public.agents_tasks ADD CONSTRAINT agents_tasks_priority_check
  CHECK (priority IN ('low','medium','high'));

ALTER TABLE public.agents_tasks DROP CONSTRAINT IF EXISTS agents_tasks_status_check;
ALTER TABLE public.agents_tasks ADD CONSTRAINT agents_tasks_status_check
  CHECK (status IN ('planned','pending','in_progress','done','failed'));

CREATE INDEX IF NOT EXISTS idx_agents_tasks_status_priority ON public.agents_tasks(status, priority, created_at DESC);
