// ============================================================================
// Semantic memory (Phase 16). Uses the same Lovable AI Gateway as ai.server.ts
// (LOVABLE_API_KEY, platform-injected -- not a separate credential to
// configure), OpenAI-compatible /v1/embeddings endpoint.
//
// Model choice matches the migration's own justification (see
// 20260902000000's "DIMENSION NOTE" comment): google/gemini-embedding-001,
// confirmed live-tested at 3072 dimensions in this same account/session,
// and the gateway's default chat model is also Google Gemini -- NOT
// OpenAI's text-embedding-3-large, which would also happen to default to
// 3072 dims but is not actually what this gateway serves. Getting this
// model string wrong wouldn't necessarily error (a wrong-but-same-sized
// vector could silently pass the dimension check below) -- it's called out
// here so nobody "fixes" this to a differently-named model without reading
// the migration comment first.
// ============================================================================
import type { Json } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBEDDING_MODEL = "google/gemini-embedding-001";
const EXPECTED_DIMENSIONS = 3072;

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });
  if (res.status === 402)
    throw new Error("AI credits exhausted. Please top up at Settings → Plans & credits.");
  if (res.status === 429) throw new Error("AI rate limit hit. Please try again shortly.");
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Embedding gateway error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = json.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding))
    throw new Error("Embedding gateway returned no vector.");
  if (embedding.length !== EXPECTED_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch: got ${embedding.length}, schema expects ${EXPECTED_DIMENSIONS}. ` +
        `The gateway's default embedding model likely changed -- update EXPECTED_DIMENSIONS here AND ` +
        `agents_memory_embeddings.embedding's column type (a new migration; existing rows would need re-embedding, ` +
        `pgvector cannot silently resize a populated vector column) before writing any more rows.`,
    );
  }
  return embedding;
}

export type MemorySourceTable =
  | "agents_logs"
  | "agents_briefs"
  | "agents_knowledge"
  | "competitor_pages"
  | "ad_recommendations"
  | "approval_requests"
  | "agents_runs"; // approval_requests/agents_runs added for Phase 17's learning loop

/** Embeds `content` and stores/updates it in agents_memory_embeddings, keyed by (agent_slug, source_table, source_id). */
export async function rememberMemory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  agentSlug: string,
  sourceTable: MemorySourceTable,
  sourceId: string,
  content: string,
  metadata: Json = {},
): Promise<void> {
  const embedding = await getEmbedding(content);
  const { error } = await supa.from("agents_memory_embeddings").upsert(
    {
      agent_slug: agentSlug,
      source_table: sourceTable,
      source_id: sourceId,
      content,
      metadata,
      embedding,
      refreshed_at: new Date().toISOString(),
    },
    { onConflict: "agent_slug,source_table,source_id" },
  );
  if (error) throw new Error(error.message);
}

export type RecalledMemory = {
  id: string;
  source_table: string;
  source_id: string;
  content: string;
  metadata: Json;
  similarity: number;
};

/** Semantic recall: embeds `query`, returns the k most similar memories this agent has stored (via the match_agent_memory SQL function -- see its migration for why this needs to be an RPC, not a query-builder call). */
export async function recallMemory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  agentSlug: string,
  query: string,
  k = 5,
): Promise<RecalledMemory[]> {
  const queryEmbedding = await getEmbedding(query);
  const { data, error } = await supa.rpc("match_agent_memory", {
    query_embedding: queryEmbedding,
    match_agent_slug: agentSlug,
    match_count: k,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as RecalledMemory[];
}
