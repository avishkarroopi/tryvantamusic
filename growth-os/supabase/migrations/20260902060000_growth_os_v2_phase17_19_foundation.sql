-- Growth OS v2 — Phase 17-19 foundation.
--
-- BUG FIX (found during Phase 17 review, before rememberMemory() had ever
-- been called anywhere): agents_memory_embeddings.source_table's CHECK
-- constraint (from 20260902000000) listed values that don't match
-- embeddings.server.ts's real MemorySourceTable type at all -- the only
-- overlapping value was 'agents_knowledge'. Every other value the real code
-- uses ('agents_logs','ad_recommendations','competitor_pages','agents_briefs')
-- would have failed this CHECK on first real insert. Aligning the
-- constraint to what the code actually uses, plus the two new values
-- Phase 17 needs.
ALTER TABLE public.agents_memory_embeddings DROP CONSTRAINT IF EXISTS agents_memory_embeddings_source_table_check;
ALTER TABLE public.agents_memory_embeddings ADD CONSTRAINT agents_memory_embeddings_source_table_check
  CHECK (source_table IN (
    'agents_knowledge', 'agents_logs', 'agents_briefs', 'competitor_pages',
    'ad_recommendations', 'approval_requests', 'agents_runs'
  ));

-- =========================================================================
-- worker_heartbeats — Part 19. Makes the worker process's health a real,
-- queryable DB fact (previously only visible via its own localhost /health
-- HTTP endpoint, which nothing else in the system -- CEO, the dashboard --
-- could see). Single-row table (upserted every tick), not a growing log;
-- history of past ticks isn't needed, only "is it alive right now."
-- =========================================================================
CREATE TABLE public.worker_heartbeats (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  status TEXT NOT NULL DEFAULT 'starting' CHECK (status IN ('starting','healthy','degraded')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_tick_at TIMESTAMPTZ,
  last_tick_error TEXT,
  ticks INT NOT NULL DEFAULT 0,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT worker_heartbeats_singleton CHECK (id = 'singleton')
);
GRANT SELECT, INSERT, UPDATE ON public.worker_heartbeats TO authenticated;
GRANT ALL ON public.worker_heartbeats TO service_role;
ALTER TABLE public.worker_heartbeats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read worker_heartbeats" ON public.worker_heartbeats FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));
CREATE TRIGGER trg_worker_heartbeats_updated BEFORE UPDATE ON public.worker_heartbeats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
