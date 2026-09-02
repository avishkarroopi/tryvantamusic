// Shared server-only helpers for Lovable AI Gateway.
// Do NOT import from client-reachable code paths.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupa = any;

/**
 * Phase 19 — Observability: every chatCompletion call records itself into
 * `ai_runs`, a table that already existed in this schema with exactly the
 * right columns (model/latency_ms/input_tokens/output_tokens/success/error)
 * but had never actually been written to anywhere in the codebase before
 * this. `purpose` is optional and defaults to "unspecified" so every
 * existing call site keeps compiling/working unchanged; passing it (e.g.
 * "ceo-brief", "seo-content-brief") is what makes the recorded rows useful
 * for a real per-purpose cost/latency breakdown later.
 *
 * Correction (found 2026-09-02, confirmed directly with Lovable): Lovable
 * Cloud never exposes a service_role key, by design, permanently -- so
 * `supabaseAdmin` (client.server.ts) can NEVER authenticate here. This used
 * to call it unconditionally, which meant every single ai_runs write was
 * silently failing (caught by the try/catch below, so the real AI call
 * always succeeded, but observability data was never actually recorded).
 *
 * Fix: accept whatever REAL, already-authenticated client the caller has in
 * scope (a server function's `context.supabase`, or an agent handler's
 * `ctx.supa` -- which, since the Phase 2 worker fix, is now a real
 * RLS-scoped session for scheduled/event/task/retry runs too, not just
 * manual ones). Deliberately does NOT fall back to `supabaseAdmin` anymore
 * -- an earlier version of this fix tried that as a "just in case a real
 * service-role key ever exists" fallback, but that meant every untagged
 * call site (most of them) hit `createSupabaseAdminClient()`'s own
 * `console.error` on every single call (confirmed live: flooded the
 * worker's logs during its first real run). Since service_role is now
 * proven permanently impossible on Lovable Cloud, attempting it is pure
 * log noise with zero chance of succeeding -- skip recording silently
 * instead when no real client was passed in.
 */
async function recordAiRun(
  supa: AnySupa | undefined,
  entry: {
    purpose: string;
    model: string;
    latencyMs: number;
    success: boolean;
    error?: string;
    inputTokens?: number;
    outputTokens?: number;
  },
): Promise<void> {
  if (!supa) return; // no real client available for this call site -- skip, don't attempt the doomed admin fallback
  try {
    await supa.from("ai_runs").insert({
      purpose: entry.purpose,
      model: entry.model,
      latency_ms: entry.latencyMs,
      success: entry.success,
      error: entry.error ?? null,
      input_tokens: entry.inputTokens ?? null,
      output_tokens: entry.outputTokens ?? null,
    });
  } catch {
    // Best-effort observability write -- must never break the real AI call it's recording.
  }
}

export async function chatCompletion(opts: {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  purpose?: string;
  /** A real, already-authenticated Supabase client (context.supabase / ctx.supa) for recording this call into ai_runs. Omit to fall back to supabaseAdmin (only works if a real service-role key is ever configured). */
  supa?: AnySupa;
}): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const model = opts.model ?? "google/gemini-3-flash-preview";
  const purpose = opts.purpose ?? "unspecified";
  const startedAt = Date.now();
  if (!apiKey) {
    await recordAiRun(opts.supa, {
      purpose,
      model,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: "Missing LOVABLE_API_KEY",
    });
    throw new Error("Missing LOVABLE_API_KEY");
  }

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;

  let res: Response;
  try {
    res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify(body),
    });
  } catch (err) {
    await recordAiRun(opts.supa, {
      purpose,
      model,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  if (res.status === 402) {
    await recordAiRun(opts.supa, {
      purpose,
      model,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: "credits_exhausted",
    });
    throw new Error("AI credits exhausted. Please top up at Settings → Plans & credits.");
  }
  if (res.status === 429) {
    await recordAiRun(opts.supa, {
      purpose,
      model,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: "rate_limited",
    });
    throw new Error("AI rate limit hit. Please try again shortly.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await recordAiRun(opts.supa, {
      purpose,
      model,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
    });
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  await recordAiRun(opts.supa, {
    purpose,
    model,
    latencyMs: Date.now() - startedAt,
    success: true,
    inputTokens: json.usage?.prompt_tokens,
    outputTokens: json.usage?.completion_tokens,
  });
  return json.choices?.[0]?.message?.content ?? "";
}

export async function chatCompletionJson<T>(opts: {
  model?: string;
  messages: ChatMessage[];
  fallback: T;
  purpose?: string;
  supa?: AnySupa;
}): Promise<T> {
  try {
    const raw = await chatCompletion({ ...opts, jsonMode: true });
    if (!raw) return opts.fallback;
    return JSON.parse(raw) as T;
  } catch {
    return opts.fallback;
  }
}
