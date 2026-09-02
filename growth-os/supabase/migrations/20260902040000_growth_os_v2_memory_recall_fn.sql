-- Growth OS v2 — semantic memory recall function (Phase 16).
-- PostgREST/supabase-js has no way to express pgvector's `<=>` cosine
-- distance operator through its query builder, so recall is exposed as a
-- SQL function callable via supabase.rpc(). No index exists on `embedding`
-- (see 20260902000000's comment: 3072 dims exceeds ivfflat/hnsw's 2000-dim
-- ceiling in this pgvector version) -- this does a sequential scan, which
-- is the documented, deliberate, adequate choice at this table's realistic
-- scale, not an oversight.
CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector(3072),
  match_agent_slug TEXT,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_table TEXT,
  source_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id, e.source_table, e.source_id, e.content, e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.agents_memory_embeddings e
  WHERE e.agent_slug = match_agent_slug
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_agent_memory(vector, TEXT, INT) TO authenticated, service_role;
