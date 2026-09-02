// Phase 21: real unit test for embeddings.server.ts's runtime dimension
// assertion -- the safety net documented in the Phase 0 migration comment
// ("if the gateway's default embedding model or its output size ever
// changes upstream, this fails loudly... rather than silently inserting a
// wrongly-shaped vector"). Mocks global fetch so no real network call is
// made; verifies both the failure path and the success path.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getEmbedding } from "../embeddings.server";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_KEY = process.env.LOVABLE_API_KEY;

function mockFetch(embeddingLength: number): void {
  global.fetch = (async () =>
    new Response(JSON.stringify({ data: [{ embedding: new Array(embeddingLength).fill(0.1) }] }), {
      status: 200,
    })) as typeof fetch;
}

test("wrong embedding dimension throws loudly instead of silently corrupting the vector", async () => {
  process.env.LOVABLE_API_KEY = "test-key";
  mockFetch(1536); // wrong -- schema expects 3072
  await assert.rejects(() => getEmbedding("some text"), /dimension mismatch/i);
});

test("correct embedding dimension (3072) succeeds and returns the vector", async () => {
  process.env.LOVABLE_API_KEY = "test-key";
  mockFetch(3072);
  const vec = await getEmbedding("some text");
  assert.equal(vec.length, 3072);
});

test("missing LOVABLE_API_KEY throws a clear, specific error", async () => {
  delete process.env.LOVABLE_API_KEY;
  await assert.rejects(() => getEmbedding("some text"), /Missing LOVABLE_API_KEY/);
  process.env.LOVABLE_API_KEY = ORIGINAL_KEY;
  global.fetch = ORIGINAL_FETCH;
});
