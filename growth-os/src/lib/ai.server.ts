// Shared server-only helpers for Lovable AI Gateway.
// Do NOT import from client-reachable code paths.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatCompletion(opts: {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-3-flash-preview",
    messages: opts.messages,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify(body),
  });
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up at Settings → Plans & credits.");
  if (res.status === 429) throw new Error("AI rate limit hit. Please try again shortly.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export async function chatCompletionJson<T>(opts: {
  model?: string;
  messages: ChatMessage[];
  fallback: T;
}): Promise<T> {
  try {
    const raw = await chatCompletion({ ...opts, jsonMode: true });
    if (!raw) return opts.fallback;
    return JSON.parse(raw) as T;
  } catch {
    return opts.fallback;
  }
}
