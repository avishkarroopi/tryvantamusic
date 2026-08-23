import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai.server";
import {
  fbPageOverview,
  igAccountOverview,
  waListTemplates,
  waSendText,
  researchSearch,
  INTEGRATION_DEFS,
} from "@/lib/integrations.server";
import type { Json } from "@/integrations/supabase/types";

// ============ Types ============
export type AgentRow = {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  default_schedule: string | null;
  enabled: boolean;
  mode: "manual" | "scheduled" | "disabled";
  config: Json;
  version: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
  mission: string | null;
  goal: string | null;
  prompt: string | null;
  skills: string[];
  tools: string[];
  kpis: string[];
  integrations: string[];
  health_score: number;
};

export type IntegrationStatus = {
  key: string;
  label: string;
  envVars: string[];
  status: "ready" | "missing_credentials";
};

const INTEGRATION_CATALOG: Array<Omit<IntegrationStatus, "status">> = [
  { key: "meta", label: "Meta (Facebook / Instagram)", envVars: ["META_ACCESS_TOKEN"] },
  { key: "google_ads", label: "Google Ads", envVars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_REFRESH_TOKEN"] },
  { key: "google_analytics", label: "Google Analytics", envVars: ["GA4_PROPERTY_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"] },
  { key: "google_search_console", label: "Google Search Console", envVars: ["GSC_SITE_URL", "GOOGLE_SERVICE_ACCOUNT_JSON"] },
  { key: "google_business_profile", label: "Google Business Profile", envVars: ["GBP_ACCOUNT_ID", "GBP_LOCATION_ID"] },
  { key: "gmail", label: "Gmail", envVars: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"] },
  { key: "whatsapp", label: "WhatsApp Business", envVars: ["WHATSAPP_PHONE_ID", "WHATSAPP_ACCESS_TOKEN"] },
  { key: "github", label: "GitHub", envVars: ["GITHUB_TOKEN"] },
  { key: "cloudflare", label: "Cloudflare", envVars: ["CLOUDFLARE_API_TOKEN"] },
  { key: "stripe", label: "Stripe", envVars: ["STRIPE_SECRET_KEY"] },
];

// ============ Registry ============
export const listAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agents_registry")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AgentRow[];
  });

export const getAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const supa = context.supabase;
    const { data: agent, error } = await supa
      .from("agents_registry")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!agent) throw new Error("Agent not found");

    const [runsRes, tasksRes, logsRes, metricsRes, eventsRes] = await Promise.all([
      supa.from("agents_runs").select("*").eq("agent_slug", data.slug).order("started_at", { ascending: false }).limit(20),
      supa.from("agents_tasks").select("*").eq("agent_slug", data.slug).order("created_at", { ascending: false }).limit(20),
      supa.from("agents_logs").select("*").eq("agent_slug", data.slug).order("created_at", { ascending: false }).limit(50),
      supa.from("agents_metrics").select("*").eq("agent_slug", data.slug).order("date", { ascending: false }).limit(14),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supa as any).from("agents_events").select("*")
        .or(`from_agent.eq.${data.slug},to_agent.eq.${data.slug}`)
        .order("created_at", { ascending: false }).limit(30),
    ]);
    return {
      agent: agent as unknown as AgentRow,
      runs: runsRes.data ?? [],
      tasks: tasksRes.data ?? [],
      logs: logsRes.data ?? [],
      metrics: metricsRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  });

export const setAgentEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agents_registry")
      .update({ enabled: data.enabled, mode: data.enabled ? "manual" : "disabled" })
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAgentMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string(), mode: z.enum(["manual", "scheduled", "disabled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agents_registry")
      .update({ mode: data.mode, enabled: data.mode !== "disabled" })
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Runner ============
// Central handler dispatch. Each handler receives helpers and returns a JSON output
// describing reasoning + next actions. Handlers must remain modular:
// adding a new agent = one registry row + one entry in the handler map.
type HandlerCtx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any;
  slug: string;
  runId: string;
  log: (level: "info" | "warn" | "error", message: string, extra?: Json) => Promise<void>;
  emit: (event_type: string, payload: Json, to?: string | null) => Promise<void>;
  createTask: (title: string, priority?: "low" | "medium" | "high") => Promise<void>;
  knowledge: (category?: string) => Promise<Array<{ title: string; content: string; category: string }>>;
};

// ---------- CEO ----------
// Continuously monitors every other agent, assigns priorities, detects
// bottlenecks and generates an executive dashboard with recommendations.
async function handleCEO(ctx: HandlerCtx): Promise<Json> {
  const [regRes, runsRes, eventsRes, tasksRes] = await Promise.all([
    ctx.supa.from("agents_registry").select("slug,name,enabled,mode,last_run_at,health_score,category"),
    ctx.supa.from("agents_runs").select("agent_slug,status,started_at,duration_ms,error").order("started_at", { ascending: false }).limit(200),
    ctx.supa.from("agents_events").select("*").eq("processed", false).order("created_at", { ascending: false }).limit(50),
    ctx.supa.from("agents_tasks").select("agent_slug,priority,status").eq("status", "pending"),
  ]);
  const registry = regRes.data ?? [];
  const runs = runsRes.data ?? [];
  const openEvents = eventsRes.data ?? [];
  const pendingTasks = tasksRes.data ?? [];

  const activeCount = registry.filter((a: { enabled: boolean }) => a.enabled).length;
  const disabledCount = registry.length - activeCount;
  const failures = runs.filter((r: { status: string }) => r.status === "failed").length;
  const health = runs.length === 0 ? 100 : Math.max(0, Math.round(100 - (failures / runs.length) * 100));

  // Per-agent scorecard
  const scorecards = registry.map((a: { slug: string; name: string; enabled: boolean; last_run_at: string | null }) => {
    const agentRuns = runs.filter((r: { agent_slug: string }) => r.agent_slug === a.slug);
    const agentFails = agentRuns.filter((r: { status: string }) => r.status === "failed").length;
    const highPri = pendingTasks.filter((t: { agent_slug: string; priority: string }) => t.agent_slug === a.slug && t.priority === "high").length;
    const staleHours = a.last_run_at ? (Date.now() - new Date(a.last_run_at).getTime()) / 3_600_000 : Infinity;
    return {
      slug: a.slug, name: a.name, enabled: a.enabled,
      runs_total: agentRuns.length, failures: agentFails,
      pending_high: highPri, hours_since_run: Number.isFinite(staleHours) ? Math.round(staleHours) : null,
    };
  });

  // AI-generated executive brief (falls back to deterministic summary)
  let summary = `Workforce: ${activeCount} active / ${disabledCount} disabled. ${runs.length} recent runs, ${failures} failures. ${openEvents.length} unprocessed events, ${pendingTasks.length} pending tasks.`;
  let recommendations: Array<{ action: string; agent?: string }> = [];
  let reasoning = "Deterministic summary (AI unavailable).";
  try {
    const ai = await chatCompletion({
      messages: [
        { role: "system", content: "You are the CEO of an AI workforce. Return strict JSON: {\"summary\":\"2-3 sentences\",\"recommendations\":[{\"action\":\"...\",\"agent\":\"slug\"}]}. Focus on the single highest-impact action per agent." },
        { role: "user", content: JSON.stringify({ scorecards, open_events: openEvents.slice(0, 10), pending_tasks: pendingTasks.length }) },
      ],
      jsonMode: true, temperature: 0.3,
    });
    const parsed = JSON.parse(ai) as { summary?: string; recommendations?: Array<{ action: string; agent?: string }> };
    if (parsed.summary) summary = parsed.summary;
    if (Array.isArray(parsed.recommendations)) recommendations = parsed.recommendations.slice(0, 6);
    reasoning = "Generated via Lovable AI Gateway.";
  } catch { /* fall back */ }

  // Priorities: agents that are enabled, have high-priority tasks or are stale
  const priorities = scorecards
    .filter((s: { enabled: boolean; slug: string; pending_high: number; hours_since_run: number | null }) =>
      s.enabled && s.slug !== "ceo" && (s.pending_high > 0 || s.hours_since_run === null || (s.hours_since_run ?? 0) > 24))
    .sort((a: { pending_high: number }, b: { pending_high: number }) => b.pending_high - a.pending_high)
    .slice(0, 5)
    .map((s: { slug: string; name: string; pending_high: number; hours_since_run: number | null }) => ({
      slug: s.slug, name: s.name,
      reason: s.pending_high > 0
        ? `${s.pending_high} high-priority task(s)`
        : s.hours_since_run === null ? "Never run — needs kickoff" : `Stale for ${s.hours_since_run}h`,
    }));

  const bottlenecks: Json = [];
  if (disabledCount > 0) bottlenecks.push({ note: `${disabledCount} agent(s) disabled` });
  if (failures > 0) bottlenecks.push({ note: `${failures} failed run(s) in recent history` });
  const missingIntegrations = INTEGRATION_DEFS.filter((d) => d.requiredEnv.some((v) => !process.env[v]));
  if (missingIntegrations.length > 0) {
    bottlenecks.push({ note: `${missingIntegrations.length} integration(s) missing credentials`, keys: missingIntegrations.map((m) => m.key) });
  }

  await ctx.supa.from("agents_briefs").insert({
    summary, priorities, bottlenecks,
    recommended_actions: recommendations.length > 0 ? recommendations : [
      { action: "Run Marketing → Sales → Customer Success daily loop" },
      { action: "Unblock disabled agents or provide missing credentials" },
    ],
    workforce_health: health,
  });

  // Emit priority signals so other agents can pick them up on their next run
  for (const p of priorities) {
    await ctx.emit("ceo.priority", { slug: p.slug, reason: p.reason } as Json, p.slug);
  }

  return { reasoning, summary, health, priorities, bottlenecks, recommendations, scorecards: scorecards.slice(0, 20) };
}

// ---------- Marketing (Meta + Instagram) ----------
async function handleMarketing(ctx: HandlerCtx): Promise<Json> {
  await ctx.log("info", "Pulling Facebook page + Instagram insights.");
  const [fb, ig] = await Promise.all([fbPageOverview(), igAccountOverview()]);

  const out: Record<string, Json> = {};
  if (fb.ok) {
    const posts = fb.data.recentPosts;
    const engaged = posts.reduce((a, p) =>
      a + (p.reactions?.summary?.total_count ?? 0) + (p.comments?.summary?.total_count ?? 0) + (p.shares?.count ?? 0), 0);
    out.facebook = { page: fb.data.page, posts_scanned: posts.length, total_engagement: engaged };
    await ctx.supa.from("agents_metrics").insert({
      agent_slug: "marketing", date: new Date().toISOString().slice(0, 10),
      metric_key: "fb_engagement_7d", value: engaged, meta: { posts: posts.length },
    });
  } else {
    out.facebook = { error: fb.error };
    await ctx.log("warn", `Facebook overview failed: ${fb.error}`);
  }

  if (ig.ok) {
    const media = ig.data.recentMedia;
    const likes = media.reduce((a, m) => a + (m.like_count ?? 0), 0);
    const comments = media.reduce((a, m) => a + (m.comments_count ?? 0), 0);
    out.instagram = { account: ig.data.account, posts_scanned: media.length, likes, comments };
    await ctx.supa.from("agents_metrics").insert({
      agent_slug: "marketing", date: new Date().toISOString().slice(0, 10),
      metric_key: "ig_engagement_7d", value: likes + comments, meta: { posts: media.length },
    });
  } else {
    out.instagram = { error: ig.error };
    await ctx.log("warn", `Instagram overview failed: ${ig.error}`);
  }

  // AI content-strategy suggestion based on real post data
  let strategy = "";
  try {
    strategy = await chatCompletion({
      messages: [
        { role: "system", content: "You are a growth marketer for a music education business. Given recent Facebook + Instagram post metrics, output 3 concise, prioritised recommendations (bullet list, max 40 words each)." },
        { role: "user", content: JSON.stringify(out).slice(0, 4000) },
      ],
      temperature: 0.5,
    });
  } catch { /* optional */ }
  if (strategy) {
    await ctx.createTask(`Apply this week's growth playbook (see brief)`, "medium");
  }

  await ctx.emit("marketing.snapshot", out as Json, "sales");
  return { reasoning: "Pulled live Meta + Instagram engagement and generated strategy brief.", ...out, strategy };
}

// ---------- Sales (WhatsApp) ----------
async function handleSales(ctx: HandlerCtx): Promise<Json> {
  const { data: leads } = await ctx.supa
    .from("leads").select("id,name,phone,status,score,created_at")
    .order("score", { ascending: false }).limit(25);
  const openLeads = (leads ?? []).filter((l: { status: string }) => l.status !== "won" && l.status !== "lost");
  const hot = openLeads.filter((l: { score: number }) => (l.score ?? 0) >= 70).slice(0, 5);
  const warm = openLeads.filter((l: { score: number }) => (l.score ?? 0) >= 40 && (l.score ?? 0) < 70).slice(0, 5);

  // Confirm WhatsApp is configured & fetch approved templates (does not send).
  const templates = await waListTemplates();
  const readyTemplates = templates.ok
    ? templates.data.data.filter((t) => t.status === "APPROVED").map((t) => t.name)
    : [];

  // Queue human-review tasks. We do NOT auto-send WhatsApp messages without
  // opt-in and template approval — surface them as tasks for the operator to run.
  for (const l of hot) {
    await ctx.createTask(`WhatsApp hot lead: ${l.name} (score ${l.score})`, "high");
  }
  for (const l of warm) {
    await ctx.createTask(`Nurture warm lead: ${l.name} (score ${l.score})`, "medium");
  }

  await ctx.emit("sales.pipeline_snapshot", { hot: hot.length, warm: warm.length, templates_ready: readyTemplates.length } as Json, "customer_success");

  return {
    reasoning: `Prioritised ${hot.length} hot / ${warm.length} warm lead(s). WhatsApp ${templates.ok ? "connected" : "unavailable"}${templates.ok ? `, ${readyTemplates.length} approved template(s)` : ""}.`,
    hot_leads: hot,
    warm_leads: warm,
    whatsapp_ready: templates.ok,
    whatsapp_templates: readyTemplates,
    whatsapp_error: templates.ok ? undefined : templates.error,
  };
}

// One-off action: send a WhatsApp message to a lead (invoked from UI/tasks).
export const salesSendWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ to: z.string().min(6), message: z.string().min(1).max(4096) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const res = await waSendText(data.to, data.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (context.supabase as any).from("agents_logs").insert({
      agent_slug: "sales", level: res.ok ? "info" : "error",
      message: res.ok ? `Sent WhatsApp to ${data.to}` : `WhatsApp send failed: ${res.error}`,
      data: { to: data.to, ok: res.ok } as Json,
    });
    if (!res.ok) throw new Error(res.error);
    return { ok: true, message_id: res.data.message_id };
  });

// ---------- Content ----------
async function handleContent(ctx: HandlerCtx): Promise<Json> {
  // Generate a 5-post calendar draft grounded in current engagement data.
  const [fb, ig] = await Promise.all([fbPageOverview(), igAccountOverview()]);
  const context = {
    fb_recent: fb.ok ? fb.data.recentPosts.slice(0, 5).map((p) => ({ msg: (p.message ?? "").slice(0, 200), engagement: (p.reactions?.summary?.total_count ?? 0) + (p.comments?.summary?.total_count ?? 0) })) : [],
    ig_recent: ig.ok ? ig.data.recentMedia.slice(0, 5).map((m) => ({ caption: (m.caption ?? "").slice(0, 200), likes: m.like_count ?? 0 })) : [],
  };

  let calendar: Array<{ day: string; channel: string; hook: string; body: string }> = [];
  try {
    const raw = await chatCompletion({
      messages: [
        { role: "system", content: "You are a social media content director for a music education brand. Return strict JSON: {\"posts\":[{\"day\":\"Mon\",\"channel\":\"instagram|facebook\",\"hook\":\"...\",\"body\":\"...\"}]} with exactly 5 posts. Vary channels and formats. Draw on the engagement context." },
        { role: "user", content: JSON.stringify(context).slice(0, 4000) },
      ],
      jsonMode: true, temperature: 0.7,
    });
    const parsed = JSON.parse(raw) as { posts?: typeof calendar };
    calendar = parsed.posts ?? [];
  } catch { /* fall back to task */ }

  if (calendar.length > 0) {
    await ctx.supa.from("agents_knowledge").insert({
      category: "content-calendar",
      title: `Content calendar — ${new Date().toISOString().slice(0, 10)}`,
      content: JSON.stringify(calendar, null, 2),
      tags: ["auto-generated", "content"],
    });
    await ctx.createTask(`Review & schedule ${calendar.length}-post content calendar`, "medium");
  } else {
    await ctx.createTask("Draft next week's content calendar (5 posts)", "medium");
  }

  await ctx.emit("content.calendar_ready", { count: calendar.length } as Json, "marketing");
  return { reasoning: `Drafted ${calendar.length}-post content calendar grounded in live engagement data.`, calendar };
}

async function handleGoogleBusiness(ctx: HandlerCtx): Promise<Json> {
  const { data: reviews } = await ctx.supa.from("gbp_reviews")
    .select("id,rating,reply_status").order("created_at", { ascending: false }).limit(20);
  const unreplied = (reviews ?? []).filter((r: { reply_status: string }) => r.reply_status !== "sent").length;
  if (unreplied > 0) await ctx.createTask(`Draft replies to ${unreplied} unanswered review(s)`, "high");
  await ctx.emit("gbp.review_status", { unreplied }, "customer_success");
  return { reasoning: `${unreplied} unanswered review(s) detected.`, unreplied };
}

// ---------- Customer Success ----------
async function handleCustomerSuccess(ctx: HandlerCtx): Promise<Json> {
  const { data: enrollments } = await ctx.supa
    .from("enrollments").select("id,student_name,status,last_activity_at,risk_score").limit(100);
  const list = (enrollments ?? []) as Array<{ id: string; student_name: string; status: string; last_activity_at: string | null; risk_score: number | null }>;
  const now = Date.now();
  const atRisk = list.filter((e) => {
    const stale = e.last_activity_at ? (now - new Date(e.last_activity_at).getTime()) / 86_400_000 : 999;
    return e.status === "active" && (stale > 14 || (e.risk_score ?? 0) >= 70);
  });

  for (const e of atRisk.slice(0, 10)) {
    await ctx.createTask(`Re-engage at-risk student: ${e.student_name}`, "high");
  }

  await ctx.emit("cs.health_snapshot", { active: list.filter((e) => e.status === "active").length, at_risk: atRisk.length } as Json, "ceo");
  return { reasoning: `Reviewed ${list.length} enrollment(s); ${atRisk.length} at-risk flagged for outreach.`, at_risk: atRisk.length };
}

async function handleAnalytics(ctx: HandlerCtx): Promise<Json> {
  await ctx.emit("analytics.weekly_insight", { note: "Insight card pending GA4/Ads credentials" }, "ceo");
  return { reasoning: "Weekly insight card queued (waiting on GA4/Ads credentials)." };
}

async function handleFinance(ctx: HandlerCtx): Promise<Json> {
  await ctx.createTask("Reconcile last week's revenue vs marketing spend", "medium");
  return { reasoning: "Finance reconciliation task queued (Stripe credential pending)." };
}

async function handleOperations(ctx: HandlerCtx): Promise<Json> {
  const { data: tasks } = await ctx.supa.from("agents_tasks")
    .select("id,status,scheduled_for").eq("status", "pending").limit(200);
  await ctx.emit("ops.sla_snapshot", { pending: (tasks ?? []).length }, "ceo");
  return { reasoning: `Snapshot: ${(tasks ?? []).length} pending task(s) across workforce.` };
}

// ---------- Research (Tavily / SerpAPI / Firecrawl) ----------
async function handleResearch(ctx: HandlerCtx): Promise<Json> {
  const queries = [
    "online music school marketing trends 2026",
    "guitar lessons pricing strategy",
    "music education social media growth playbook",
  ];
  const results: Array<{ query: string; hits: number; top?: string }> = [];
  const allHits: Array<{ title: string; url: string; snippet: string }> = [];
  for (const q of queries) {
    const r = await researchSearch(q, 5);
    if (r.ok) {
      results.push({ query: q, hits: r.data.length, top: r.data[0]?.title });
      allHits.push(...r.data.slice(0, 3));
    } else {
      results.push({ query: q, hits: 0, top: `error: ${r.error}` });
    }
  }

  if (allHits.length > 0) {
    let brief = "";
    try {
      brief = await chatCompletion({
        messages: [
          { role: "system", content: "You are a market research analyst. Synthesize the following search results into a 5-bullet weekly brief for a music education business. No fluff." },
          { role: "user", content: JSON.stringify(allHits).slice(0, 6000) },
        ],
        temperature: 0.3,
      });
    } catch { /* optional */ }
    if (brief) {
      await ctx.supa.from("agents_knowledge").insert({
        category: "research-brief",
        title: `Weekly market brief — ${new Date().toISOString().slice(0, 10)}`,
        content: brief,
        tags: ["auto-generated", "research"],
      });
    }
  }

  await ctx.emit("research.weekly_brief", { queries: results.length, hits: allHits.length } as Json, "ceo");
  return { reasoning: `Ran ${queries.length} research queries; ${allHits.length} total hits.`, results };
}

async function handleKnowledge(ctx: HandlerCtx): Promise<Json> {
  const { data } = await ctx.supa.from("agents_knowledge").select("id,category,updated_at");
  const stale = (data ?? []).filter((k: { updated_at: string }) =>
    Date.now() - new Date(k.updated_at).getTime() > 1000 * 60 * 60 * 24 * 90,
  ).length;
  if (stale > 0) await ctx.createTask(`Review ${stale} knowledge entry(ies) older than 90 days`, "low");
  return { reasoning: `${(data ?? []).length} knowledge entries indexed, ${stale} stale.` };
}

async function handleSEO(ctx: HandlerCtx): Promise<Json> {
  await ctx.createTask("Audit top 10 landing pages for on-page SEO", "low");
  return { reasoning: "SEO audit task queued (Search Console credential pending)." };
}

// ---------- Automation ----------
// Scans event bus for repetitive patterns and files them as automation candidates.
async function handleAutomation(ctx: HandlerCtx): Promise<Json> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data: events } = await ctx.supa
    .from("agents_events").select("event_type,from_agent,to_agent,created_at")
    .gte("created_at", since).limit(500);
  const list = (events ?? []) as Array<{ event_type: string; from_agent: string; to_agent: string | null }>;

  const counts = new Map<string, number>();
  for (const e of list) {
    const key = `${e.from_agent}→${e.to_agent ?? "*"}:${e.event_type}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const candidates = [...counts.entries()]
    .filter(([, n]) => n >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));

  for (const c of candidates.slice(0, 3)) {
    await ctx.createTask(`Automate recurring pattern: ${c.pattern} (${c.count}×/14d)`, "low");
  }

  await ctx.emit("automation.candidates", { count: candidates.length, sample: candidates.slice(0, 5) } as Json, "ceo");
  return { reasoning: `Scanned ${list.length} events; ${candidates.length} automation candidate pattern(s) identified.`, candidates };
}

const HANDLERS: Record<string, (ctx: HandlerCtx) => Promise<Json>> = {
  ceo: handleCEO,
  marketing: handleMarketing,
  sales: handleSales,
  content: handleContent,
  google_business: handleGoogleBusiness,
  customer_success: handleCustomerSuccess,
  analytics: handleAnalytics,
  finance: handleFinance,
  operations: handleOperations,
  research: handleResearch,
  knowledge: handleKnowledge,
  seo: handleSEO,
  automation: handleAutomation,
};

export const runAgentNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    const { data: agent, error: aErr } = await supa
      .from("agents_registry").select("*").eq("slug", data.slug).maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!agent) throw new Error("Agent not found");
    if (!agent.enabled) throw new Error("Agent is disabled");

    const startedAt = new Date();
    const { data: runIns, error: rErr } = await supa
      .from("agents_runs")
      .insert({ agent_slug: data.slug, status: "running", trigger: "manual", started_at: startedAt.toISOString() })
      .select("id").single();
    if (rErr) throw new Error(rErr.message);
    const runId = runIns.id as string;

    const log: HandlerCtx["log"] = async (level, message, extra) => {
      await supa.from("agents_logs").insert({
        run_id: runId, agent_slug: data.slug, level, message, data: extra ?? null,
      });
    };
    const emit: HandlerCtx["emit"] = async (event_type, payload, to = null) => {
      await supa.from("agents_events").insert({
        from_agent: data.slug, to_agent: to, event_type, payload, run_id: runId,
      });
    };
    const createTask: HandlerCtx["createTask"] = async (title, priority = "medium") => {
      await supa.from("agents_tasks").insert({
        agent_slug: data.slug, title, priority, status: "pending",
      });
    };
    const knowledge: HandlerCtx["knowledge"] = async (category) => {
      let q = supa.from("agents_knowledge").select("title,content,category");
      if (category) q = q.eq("category", category);
      const { data } = await q.limit(20);
      return (data ?? []) as Array<{ title: string; content: string; category: string }>;
    };

    try {
      await log("info", `Agent ${agent.name} invoked (manual trigger).`);
      const handler = HANDLERS[data.slug];
      let output: Json = { note: "No handler registered; noop run." };
      if (handler) {
        output = await handler({ supa, slug: data.slug, runId, log, emit, createTask, knowledge });
      } else {
        await log("warn", `No handler registered for ${data.slug}.`);
      }

      const finishedAt = new Date();
      await supa.from("agents_runs").update({
        status: "succeeded",
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        output,
      }).eq("id", runId);
      await supa.from("agents_registry").update({ last_run_at: finishedAt.toISOString() }).eq("slug", data.slug);

      return { ok: true as const, runId, output };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supa.from("agents_runs").update({
        status: "failed", finished_at: new Date().toISOString(), error: msg,
      }).eq("id", runId);
      await log("error", msg);
      throw new Error(msg);
    }
  });

// ============ Overview ============
export const getWorkforceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;

    const [regRes, runsAllRes, runsTodayRes, latestBriefRes, tasksRes, eventsRes] = await Promise.all([
      supa.from("agents_registry").select("*"),
      supa.from("agents_runs").select("agent_slug,status,started_at,duration_ms").order("started_at", { ascending: false }).limit(50),
      supa.from("agents_runs").select("id,status").gte("started_at", todayIso),
      supa.from("agents_briefs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supa.from("agents_tasks").select("id,agent_slug,title,status,priority").eq("status", "pending").order("created_at", { ascending: false }).limit(20),
      supa.from("agents_events").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    const registry = (regRes.data ?? []) as AgentRow[];
    const runsAll = runsAllRes.data ?? [];
    const runsToday = runsTodayRes.data ?? [];

    return {
      registry,
      counts: {
        total: registry.length,
        active: registry.filter((a) => a.enabled && a.mode !== "disabled").length,
        idle: registry.filter((a) => a.enabled && !a.last_run_at).length,
        disabled: registry.filter((a) => !a.enabled || a.mode === "disabled").length,
        running: runsAll.filter((r: { status: string }) => r.status === "running").length,
        completedToday: runsToday.filter((r: { status: string }) => r.status === "succeeded").length,
        failedToday: runsToday.filter((r: { status: string }) => r.status === "failed").length,
      },
      recentRuns: runsAll.slice(0, 15),
      pendingTasks: tasksRes.data ?? [],
      recentEvents: eventsRes.data ?? [],
      brief: latestBriefRes.data ?? null,
    };
  });

// ============ Knowledge ============
export const listKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any)
      .from("agents_knowledge").select("*").order("category").order("title");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().optional(),
      category: z.string().min(1),
      title: z.string().min(1),
      content: z.string().min(1),
      tags: z.array(z.string()).default([]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    if (data.id) {
      const { error } = await supa.from("agents_knowledge").update({
        category: data.category, title: data.title, content: data.content, tags: data.tags,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supa.from("agents_knowledge").insert({
        category: data.category, title: data.title, content: data.content, tags: data.tags,
        created_by: context.userId,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any).from("agents_knowledge").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Integrations ============
export const getIntegrationsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return INTEGRATION_DEFS.map((i) => ({
      key: i.key,
      label: i.label,
      envVars: i.requiredEnv,
      status: (i.requiredEnv.every((v) => !!process.env[v]) ? "ready" : "missing_credentials") as IntegrationStatus["status"],
    })) satisfies IntegrationStatus[];
  });
