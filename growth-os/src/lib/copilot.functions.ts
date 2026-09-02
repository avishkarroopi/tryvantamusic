import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai.server";

// ---------- History ----------
export const getCopilotHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("copilot_messages")
      .select("id,role,content,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const clearCopilotHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("copilot_messages").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Business-context snapshot ----------
async function fetchBusinessContext(supabase: import("@supabase/supabase-js").SupabaseClient) {
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const [leadsRes, hotRes, enrollRes, dormantRes, tasksRes, reviewsRes] = await Promise.all([
    supabase.from("leads").select("id,status,source,country,city,instrument,score,created_at,name,phone").gte("created_at", since30),
    supabase.from("leads").select("id,name,instrument,country,score,status,created_at").gte("score", 85).order("created_at", { ascending: false }).limit(10),
    supabase.from("enrollments").select("*").gte("enrolled_at", since30),
    supabase.from("leads").select("id,name,last_activity_at,source").lt("last_activity_at", new Date(Date.now() - 30 * 86400000).toISOString()).not("status", "in", "(enrolled,lost)").limit(20),
    supabase.from("tasks").select("id,title,due_at,priority,status,lead_id").in("status", ["pending", "in_progress"]).order("due_at", { ascending: true }).limit(30),
    supabase.from("reviews").select("id,rating,platform,created_at").gte("created_at", since30),
  ]);

  const leads = leadsRes.data ?? [];
  const enrolls = enrollRes.data ?? [];
  const hot = hotRes.data ?? [];
  const dormant = dormantRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const weekLeads = leads.filter((l) => l.created_at >= since7);

  const bySource: Record<string, number> = {};
  for (const l of leads) bySource[l.source ?? "unknown"] = (bySource[l.source ?? "unknown"] ?? 0) + 1;
  const revenue30d = enrolls.reduce((a, e) => a + Number(e.amount ?? 0), 0);
  const enrolled30d = enrolls.length;
  const conversionRate = leads.length > 0 ? (leads.filter((l) => l.status === "enrolled").length / leads.length) * 100 : 0;

  return {
    windows: { last_30_days: since30, last_7_days: since7 },
    totals: {
      leads_30d: leads.length,
      leads_7d: weekLeads.length,
      hot_leads_open: hot.filter((h) => h.status !== "enrolled" && h.status !== "lost").length,
      enrolled_30d: enrolled30d,
      revenue_30d: revenue30d,
      conversion_rate_pct_30d: Number(conversionRate.toFixed(2)),
      dormant_leads: dormant.length,
      reviews_30d: reviews.length,
      avg_rating_30d: reviews.length > 0 ? Number((reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / reviews.length).toFixed(2)) : null,
    },
    leads_by_source_30d: bySource,
    hot_leads: hot.slice(0, 8),
    dormant_sample: dormant.slice(0, 8),
    open_tasks: tasks.slice(0, 10),
    recent_enrollments: enrolls.slice(-8).reverse(),
  };
}

// ---------- Chat ----------
export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ message: z.string().trim().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [historyRes, ctx] = await Promise.all([
      supabase.from("copilot_messages").select("role,content").eq("user_id", userId).order("created_at", { ascending: true }).limit(40),
      fetchBusinessContext(supabase),
    ]);
    const history = (historyRes.data ?? []) as { role: "user" | "assistant" | "system"; content: string }[];

    // Persist user message immediately
    await supabase.from("copilot_messages").insert({ user_id: userId, role: "user", content: data.message });

    const systemPrompt = `You are the Founder Copilot for Music Growth OS — a premium music education platform. Answer the founder in a concise, decisive, founder-first tone. Use the LIVE BUSINESS CONTEXT JSON below as the source of truth; do NOT invent numbers. Cite specific numbers when relevant, and end with a suggested next action when useful.

If a question can't be answered from the provided context, say so and suggest what data to log.

LIVE BUSINESS CONTEXT (JSON):
${JSON.stringify(ctx)}
`;

    let assistantContent = "";
    try {
      assistantContent = await chatCompletion({
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((h) => ({ role: h.role === "system" ? "user" : h.role, content: h.content })),
          { role: "user", content: data.message },
        ],
        purpose: "founder-copilot-chat",
        supa: supabase,
      });
    } catch (err) {
      assistantContent = `⚠️ ${err instanceof Error ? err.message : "Copilot temporarily unavailable"}`;
    }
    if (!assistantContent) assistantContent = "I don't have enough information to answer that yet.";

    await supabase.from("copilot_messages").insert({
      user_id: userId, role: "assistant", content: assistantContent,
      metadata: { context_snapshot: ctx.totals },
    });

    return { reply: assistantContent };
  });

// ---------- Founder briefs ----------
export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ period: z.enum(["daily", "weekly", "monthly"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const now = new Date();
    const days = data.period === "daily" ? 1 : data.period === "weekly" ? 7 : 30;
    const start = new Date(now.getTime() - days * 86400000);
    const ctx = await fetchBusinessContext(context.supabase);

    const system = `You are the Founder Copilot writing a concise ${data.period} brief for the founder of Music. Return strict JSON: {"summary":"2-3 sentence executive summary","highlights":["max 6 punchy bullet lines with specific numbers"],"next_actions":["max 3 imperative actions"]}. Base every number on the LIVE BUSINESS CONTEXT JSON. Do not invent metrics.

LIVE BUSINESS CONTEXT (JSON):
${JSON.stringify(ctx)}`;

    let parsed: { summary?: string; highlights?: string[]; next_actions?: string[] } = {};
    try {
      const raw = await chatCompletion({
        messages: [{ role: "system", content: system }, { role: "user", content: `Write the ${data.period} founder brief.` }],
        jsonMode: true,
        purpose: "founder-brief",
        supa: context.supabase,
      });
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Brief generation failed");
    }

    const { data: row, error } = await context.supabase.from("founder_briefs").insert({
      period: data.period,
      period_start: start.toISOString().slice(0, 10),
      period_end: now.toISOString().slice(0, 10),
      summary: parsed.summary ?? "No summary generated.",
      highlights: (parsed.highlights ?? []) as never,
      metrics: ctx.totals as never,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return { brief: row, next_actions: parsed.next_actions ?? [] };
  });

export const listBriefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ period: z.enum(["daily", "weekly", "monthly"]).optional(), limit: z.number().int().min(1).max(50).default(20) }).partial().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("founder_briefs").select("*").order("generated_at", { ascending: false }).limit(data.limit ?? 20);
    if (data.period) q = q.eq("period", data.period);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
