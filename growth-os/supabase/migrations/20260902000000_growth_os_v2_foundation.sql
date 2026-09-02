-- Growth OS v2 — Foundation (Phase 0 of the autonomous-system implementation).
-- Additive only: extends agents_runs/ad_entities/ad_recommendations with new
-- columns (nothing existing is dropped/renamed), and adds 9 new tables.
-- Follows exactly the two RLS conventions already established in this schema:
--   - internal workforce data (agents_*, keywords, snapshots) -> is_team_member()
--   - per-user-owned data (competitor_* extends gbp_competitors) -> auth.uid() = user_id
-- Nothing here touches existing tables' data or breaks prior migrations.

-- =========================================================================
-- BUG FIX (found via live-schema inspection during this implementation, not
-- part of the original 24-phase spec but directly blocking Part 11): the
-- 20260823070000_competitive_intelligence.sql migration's
-- `ALTER TABLE gbp_reputation_snapshots ADD COLUMN sentiment_score...` was
-- never actually applied to the live database — confirmed by querying
-- information_schema.columns directly. src/lib/competitive.functions.ts's
-- captureBrandSnapshot() has therefore been inserting into these columns
-- and failing with a real Postgres "column does not exist" error on every
-- live call. A separate, unrelated table `gbp_brand_snapshots` exists in
-- the live DB with a similar shape but zero code references it anywhere in
-- the repo (confirmed via full-text search) — it is dead/orphaned, left
-- untouched here (not dropping tables without more certainty about their
-- history). This section is idempotent (IF NOT EXISTS) so it is safe to
-- run even if applied a second time.
-- =========================================================================
ALTER TABLE public.gbp_reputation_snapshots
  ADD COLUMN IF NOT EXISTS sentiment_score INT,
  ADD COLUMN IF NOT EXISTS review_velocity NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS consistency_score INT;

-- =========================================================================
-- pgvector — semantic memory substrate (Part 16). NOT Qdrant/Pinecone, per
-- the architecture decision: this is the existing Postgres instance, one
-- extension, zero new infrastructure to operate.
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================================
-- EXTEND agents_runs — unified execution engine needs retry/crash-recovery/
-- causation metadata that didn't exist before (Phase 1 + 4).
-- =========================================================================
ALTER TABLE public.agents_runs
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS causation_event_id UUID, -- set when this run was triggered by an event (FK added below, after agents_events already exists)
  ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Widen the status/trigger CHECK constraints (drop + recreate, same columns,
-- no data migration needed since existing values are a strict subset).
ALTER TABLE public.agents_runs DROP CONSTRAINT IF EXISTS agents_runs_status_check;
ALTER TABLE public.agents_runs ADD CONSTRAINT agents_runs_status_check
  CHECK (status IN ('queued','pending','running','succeeded','failed','retry_pending','failed_permanent'));

ALTER TABLE public.agents_runs DROP CONSTRAINT IF EXISTS agents_runs_trigger_check;
ALTER TABLE public.agents_runs ADD CONSTRAINT agents_runs_trigger_check
  CHECK (trigger IN ('manual','scheduled','ceo','event','task','retry'));

ALTER TABLE public.agents_runs
  ADD CONSTRAINT agents_runs_causation_event_fkey
  FOREIGN KEY (causation_event_id) REFERENCES public.agents_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_runs_heartbeat ON public.agents_runs(status, heartbeat_at)
  WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_agents_runs_next_retry ON public.agents_runs(next_retry_at)
  WHERE status = 'retry_pending';

-- =========================================================================
-- EXTEND ad_entities / ad_recommendations — real-sync provenance (Phase 6/7).
-- =========================================================================
ALTER TABLE public.ad_entities
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'never_synced'
    CHECK (sync_status IN ('never_synced', 'synced', 'sync_failed', 'credential_required'));

ALTER TABLE public.ad_recommendations
  ADD COLUMN IF NOT EXISTS approval_request_id UUID; -- FK added after approval_requests exists below

-- =========================================================================
-- agents_subscriptions — Part 3/4: real event->agent dispatch, replacing the
-- current "emit() writes a log nobody reads" behaviour.
-- =========================================================================
CREATE TABLE public.agents_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'triggerable'
    CHECK (category IN ('informational','triggerable','action_required','critical')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_slug, event_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_subscriptions TO authenticated;
GRANT ALL ON public.agents_subscriptions TO service_role;
ALTER TABLE public.agents_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_subscriptions" ON public.agents_subscriptions FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_agents_subscriptions_event ON public.agents_subscriptions(event_type) WHERE active = true;

-- Seed subscriptions for the emit() calls that already exist in
-- agents.functions.ts today (marketing.snapshot -> sales, ceo.priority is
-- informational/self-referential and intentionally has no subscriber —
-- CEO priorities inform the CEO brief, they don't auto-dispatch work; a
-- human or the priority's own target agent's normal schedule picks it up).
INSERT INTO public.agents_subscriptions (agent_slug, event_type, category) VALUES
  ('sales', 'marketing.snapshot', 'triggerable'),
  ('customer_success', 'sales.pipeline_snapshot', 'triggerable'),
  ('marketing', 'content.calendar_ready', 'informational'),
  ('customer_success', 'gbp.review_status', 'action_required'),
  ('ceo', 'cs.health_snapshot', 'informational'),
  ('ceo', 'ops.sla_snapshot', 'informational'),
  ('ceo', 'automation.candidates', 'informational'),
  ('ceo', 'research.weekly_brief', 'informational')
ON CONFLICT (agent_slug, event_type) DO NOTHING;

-- Add processing/fan-out metadata to the existing agents_events table
-- (additive; existing rows/readers are unaffected).
ALTER TABLE public.agents_events
  ADD COLUMN IF NOT EXISTS causation_event_id UUID REFERENCES public.agents_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fan_out_depth INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_agents_events_unprocessed ON public.agents_events(processed, created_at)
  WHERE processed = false;

-- =========================================================================
-- approval_requests — Part 5: the ONE centralized gate for high-risk actions.
-- =========================================================================
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  run_id UUID REFERENCES public.agents_runs(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- e.g. 'meta.create_campaign', 'google_ads.update_budget'
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','executed','execution_failed')),
  reasoning TEXT,
  before_state JSONB,
  after_state JSONB,
  execution_result JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all approval_requests" ON public.approval_requests FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_approval_requests_pending ON public.approval_requests(status, expires_at) WHERE status = 'pending';
CREATE INDEX idx_approval_requests_agent ON public.approval_requests(agent_slug, requested_at DESC);

ALTER TABLE public.ad_recommendations
  ADD CONSTRAINT ad_recommendations_approval_request_fkey
  FOREIGN KEY (approval_request_id) REFERENCES public.approval_requests(id) ON DELETE SET NULL;

-- =========================================================================
-- ga4_daily_snapshots / gsc_daily_snapshots — Parts 8/9: real historical
-- data, pulled once daily by the worker, never queried live on page render.
-- =========================================================================
CREATE TABLE public.ga4_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  date DATE NOT NULL,
  sessions INT NOT NULL DEFAULT 0,
  users INT NOT NULL DEFAULT 0,
  new_users INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,4),
  top_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_landing_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_campaigns JSONB NOT NULL DEFAULT '[]'::jsonb,
  countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  devices JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ga4_daily_snapshots TO authenticated;
GRANT ALL ON public.ga4_daily_snapshots TO service_role;
ALTER TABLE public.ga4_daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all ga4_daily_snapshots" ON public.ga4_daily_snapshots FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_ga4_snapshots_date ON public.ga4_daily_snapshots(property_id, date DESC);

CREATE TABLE public.gsc_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url TEXT NOT NULL,
  date DATE NOT NULL,
  query TEXT,
  page TEXT,
  country TEXT,
  device TEXT,
  clicks INT NOT NULL DEFAULT 0,
  impressions INT NOT NULL DEFAULT 0,
  ctr NUMERIC(6,4) NOT NULL DEFAULT 0,
  position NUMERIC(6,2),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_daily_snapshots TO authenticated;
GRANT ALL ON public.gsc_daily_snapshots TO service_role;
ALTER TABLE public.gsc_daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all gsc_daily_snapshots" ON public.gsc_daily_snapshots FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_gsc_snapshots_date ON public.gsc_daily_snapshots(site_url, date DESC);
CREATE INDEX idx_gsc_snapshots_query ON public.gsc_daily_snapshots(query) WHERE query IS NOT NULL;
-- Ranking-change detection reads: "this query's position over time"
CREATE INDEX idx_gsc_snapshots_query_date ON public.gsc_daily_snapshots(query, date) WHERE query IS NOT NULL;

-- =========================================================================
-- keywords — Part 12. OWN rankings come from gsc_daily_snapshots; this
-- table is explicitly for keyword-universe data (volume/difficulty/intent)
-- and COMPETITOR positions — never confuse the two sources (see
-- current_position_source column, kept mandatory so a query can never
-- silently blend them).
-- =========================================================================
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  language TEXT NOT NULL DEFAULT 'en',
  search_volume INT,
  difficulty NUMERIC(5,2),
  cpc NUMERIC(8,2),
  intent TEXT CHECK (intent IN ('informational','navigational','commercial','transactional', NULL)),
  serp_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  our_position NUMERIC(6,2), -- last known, denormalized from gsc_daily_snapshots for fast sort; source of truth is still GSC
  our_position_updated_at TIMESTAMPTZ,
  competitor_positions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{competitor_id, position, url, checked_at}], source = SERP provider only
  opportunity_score NUMERIC(6,2),
  source TEXT NOT NULL, -- provider name, e.g. 'serpapi' — never 'estimated'/'ai_guessed'
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (keyword, country, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keywords TO authenticated;
GRANT ALL ON public.keywords TO service_role;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all keywords" ON public.keywords FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE TRIGGER trg_keywords_updated BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_keywords_opportunity ON public.keywords(opportunity_score DESC NULLS LAST);

-- =========================================================================
-- seo_content_gaps — Part 13.
-- =========================================================================
CREATE TABLE public.seo_content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.gbp_competitors(id) ON DELETE SET NULL,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('missing_keyword','missing_topic','missing_page','weak_page','ranking_below_competitor')),
  priority TEXT NOT NULL CHECK (priority IN ('critical','high','medium','low')),
  opportunity_score NUMERIC(6,2) NOT NULL, -- deterministic, copied from keywords.opportunity_score at detection time (see Part 13 scoring notes)
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','briefed','in_progress','published','dismissed')),
  content_brief_id UUID, -- set once handleSeoContent produces a brief; no FK yet, briefs live in agents_knowledge (category='seo-brief')
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_content_gaps TO authenticated;
GRANT ALL ON public.seo_content_gaps TO service_role;
ALTER TABLE public.seo_content_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all seo_content_gaps" ON public.seo_content_gaps FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE TRIGGER trg_seo_content_gaps_updated BEFORE UPDATE ON public.seo_content_gaps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_seo_content_gaps_status ON public.seo_content_gaps(status, priority);

-- =========================================================================
-- competitor_pages / competitor_page_history — Part 10/14. Per-user-owned,
-- same convention as gbp_competitors (a competitor belongs to the team
-- member who approved it).
-- =========================================================================
CREATE TABLE public.competitor_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.gbp_competitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  headings JSONB NOT NULL DEFAULT '[]'::jsonb,
  word_count INT,
  schema_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  canonical_url TEXT,
  internal_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  offers JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '[]'::jsonb,
  ctas JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT,
  last_crawled_at TIMESTAMPTZ,
  http_status INT,
  -- Technical SEO signals captured at crawl time (Part 14).
  robots_indexable BOOLEAN,
  has_noindex BOOLEAN,
  raw_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competitor_id, url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_pages TO authenticated;
GRANT ALL ON public.competitor_pages TO service_role;
ALTER TABLE public.competitor_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitor_pages owner" ON public.competitor_pages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_competitor_pages_updated BEFORE UPDATE ON public.competitor_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_competitor_pages_competitor ON public.competitor_pages(competitor_id);

CREATE TABLE public.competitor_page_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.competitor_pages(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_hash TEXT NOT NULL,
  diff_summary TEXT, -- AI-generated, only when content_hash actually changed (never generated on a no-op crawl)
  raw_markdown TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_page_history TO authenticated;
GRANT ALL ON public.competitor_page_history TO service_role;
ALTER TABLE public.competitor_page_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitor_page_history via page owner" ON public.competitor_page_history FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitor_pages p WHERE p.id = page_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitor_pages p WHERE p.id = page_id AND p.user_id = auth.uid()));
CREATE INDEX idx_competitor_page_history_page ON public.competitor_page_history(page_id, snapshot_at DESC);

-- =========================================================================
-- agents_memory_embeddings — Part 16. Semantic index OVER the existing
-- agents_memory/agents_knowledge tables (derived, not a replacement).
--
-- DIMENSION NOTE (do not change without re-reading this comment):
-- The embedding model actually served by ai.gateway.lovable.dev cannot be
-- verified from this environment — LOVABLE_API_KEY is platform-injected,
-- not present in any local .env this migration was authored against. 3072
-- is used here because it is the CONFIRMED, live-tested dimensionality of
-- Google's gemini-embedding-001 (same account/session, verified via a real
-- API call against generativelanguage.googleapis.com directly) and the
-- gateway's default chat model for this app is also Google Gemini
-- (google/gemini-3-flash-preview, see src/lib/ai.server.ts) — so this is an
-- evidence-based assumption, not a guess, but it is NOT the same as calling
-- the gateway's actual embeddings endpoint and reading the response.
-- src/lib/embeddings.server.ts's getEmbedding() asserts the real returned
-- vector length against EMBEDDING_DIM on every call and throws loudly on
-- any mismatch rather than silently inserting truncated/wrong-shaped
-- vectors. If that assertion ever fires: run
--   ALTER TABLE public.agents_memory_embeddings ALTER COLUMN embedding TYPE vector(<real_dim>);
-- (safe only while the table is empty or being rebuilt) and update
-- EMBEDDING_DIM in src/lib/embeddings.server.ts to match.
-- =========================================================================
CREATE TABLE public.agents_memory_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  source_table TEXT NOT NULL CHECK (source_table IN ('agents_memory','agents_knowledge','agents_runs','competitive_brief','seo_content_gaps')),
  source_id TEXT NOT NULL, -- text, not uuid: agents_memory's PK is a composite (agent_slug,key), not a single uuid
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(3072) NOT NULL, -- unqualified: resolves via search_path same as gen_random_uuid() does elsewhere in this schema, regardless of which schema CREATE EXTENSION installed into
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_memory_embeddings TO authenticated;
GRANT ALL ON public.agents_memory_embeddings TO service_role;
ALTER TABLE public.agents_memory_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_memory_embeddings" ON public.agents_memory_embeddings FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
-- REAL CONSTRAINT discovered by actually applying this migration (not
-- caught by static review): pgvector's ivfflat index type refuses any
-- column over 2000 dimensions ("column cannot have more than 2000
-- dimensions for ivfflat index") -- 3072 exceeds it, and pgvector's hnsw
-- index type has the same 2000-dim ceiling in the version this project's
-- Supabase instance runs. No vector index is created here as a result;
-- recallMemory() falls back to a sequential cosine-distance scan
-- (`ORDER BY embedding <=> query LIMIT k`), which is genuinely fine at this
-- table's real scale (an internal team's agent memory -- hundreds to low
-- thousands of rows, not millions). Revisit only if row count ever grows
-- enough to matter (at which point a halfvec-typed column or dimensionality
-- reduction would be the real fix, not just adding an index back).
-- (a single UNIQUE index on (source_table, source_id) below already serves
-- both the dedup constraint and the lookup-by-source query pattern -- a
-- separate plain index on the same two columns would be pure redundancy.)
CREATE UNIQUE INDEX idx_agents_memory_embeddings_dedup ON public.agents_memory_embeddings(source_table, source_id);
