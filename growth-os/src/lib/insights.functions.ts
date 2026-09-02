import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai.server";

export const listInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      agent: z.string().optional(),
      includeDismissed: z.boolean().default(false),
      limit: z.number().int().min(1).max(100).default(30),
    }).partial().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("insights").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 30);
    if (data.agent) q = q.eq("agent", data.agent);
    if (!data.includeDismissed) q = q.is("dismissed_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const dismissInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("insights")
      .update({ dismissed_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Unified generator — deterministic signals + AI narrative
export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const [leadsRes, enrollRes, reviewsRes, tasksRes] = await Promise.all([
      context.supabase.from("leads").select("id,status,source,country,city,instrument,score,created_at,last_activity_at").gte("created_at", since30),
      context.supabase.from("enrollments").select("*").gte("enrolled_at", since30),
      context.supabase.from("reviews").select("id,rating,platform,created_at").gte("created_at", since30),
      context.supabase.from("tasks").select("*").in("status", ["pending", "in_progress"]),
    ]);
    const leads = leadsRes.data ?? [];
    const enrolls = enrollRes.data ?? [];
    const reviews = reviewsRes.data ?? [];
    const tasks = tasksRes.data ?? [];

    const seeds: { agent: string; kind: string; title: string; body: string; priority: "low" | "normal" | "high" | "critical" }[] = [];

    // Marketing: best converting source
    const sourceGroups = new Map<string, { leads: number; enrolled: number }>();
    for (const l of leads) {
      const g = sourceGroups.get(l.source ?? "unknown") ?? { leads: 0, enrolled: 0 };
      g.leads++;
      if (l.status === "enrolled") g.enrolled++;
      sourceGroups.set(l.source ?? "unknown", g);
    }
    const sourceStats = Array.from(sourceGroups.entries())
      .filter(([, v]) => v.leads >= 3)
      .map(([k, v]) => ({ k, rate: v.enrolled / v.leads, leads: v.leads }))
      .sort((a, b) => b.rate - a.rate);
    if (sourceStats.length >= 2 && sourceStats[0].rate > 0) {
      const lift = sourceStats[1].rate > 0 ? ((sourceStats[0].rate - sourceStats[1].rate) / sourceStats[1].rate) * 100 : 100;
      seeds.push({
        agent: "marketing", kind: "top_source",
        title: `${sourceStats[0].k} converts ${lift.toFixed(0)}% better than ${sourceStats[1].k}`,
        body: `${sourceStats[0].k} closed ${(sourceStats[0].rate * 100).toFixed(1)}% of ${sourceStats[0].leads} leads in the last 30 days. Consider shifting budget or attention.`,
        priority: "high",
      });
    }

    // Revenue: top instrument
    const instRevenue = new Map<string, number>();
    let totalRev = 0;
    for (const e of enrolls) {
      const k = e.instrument ?? "unknown";
      const amt = Number(e.amount ?? 0);
      instRevenue.set(k, (instRevenue.get(k) ?? 0) + amt);
      totalRev += amt;
    }
    const topInst = Array.from(instRevenue.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topInst && totalRev > 0) {
      const pct = (topInst[1] / totalRev) * 100;
      if (pct >= 40) {
        seeds.push({
          agent: "revenue", kind: "top_instrument",
          title: `${topInst[0]} programs drive ${pct.toFixed(0)}% of revenue`,
          body: `${topInst[0]} generated ${topInst[1].toLocaleString()} in the last 30 days. Double down on marketing that highlights this program.`,
          priority: "high",
        });
      }
    }

    // Hot leads awaiting follow-up
    const hotOpen = leads.filter((l) => l.score >= 85 && l.status !== "enrolled" && l.status !== "lost");
    if (hotOpen.length > 0) {
      seeds.push({
        agent: "leads", kind: "hot_leads",
        title: `${hotOpen.length} high-value lead${hotOpen.length === 1 ? "" : "s"} need immediate follow-up`,
        body: `Score 85+ with open status. Call today to protect conversion.`,
        priority: "critical",
      });
    }

    // Reviews growth
    const since60 = new Date(Date.now() - 60 * 86400000).toISOString();
    const { data: prevReviews } = await context.supabase.from("reviews").select("id").gte("created_at", since60).lt("created_at", since30);
    const prevCount = prevReviews?.length ?? 0;
    if (prevCount > 0) {
      const change = ((reviews.length - prevCount) / prevCount) * 100;
      if (change <= -15) {
        seeds.push({
          agent: "reviews", kind: "review_growth_drop",
          title: `Review acquisition slowed by ${Math.abs(change).toFixed(0)}%`,
          body: `Only ${reviews.length} reviews in the last 30 days vs ${prevCount} in the prior window. Trigger a review request campaign.`,
          priority: "high",
        });
      }
    }

    // Overdue tasks
    const overdue = tasks.filter((t) => t.due_at && t.due_at < new Date().toISOString());
    if (overdue.length >= 5) {
      seeds.push({
        agent: "ops", kind: "overdue_tasks",
        title: `${overdue.length} overdue tasks`,
        body: `Clear the backlog to keep leads warm.`,
        priority: "normal",
      });
    }

    // Optional AI polish — add an executive narrative insight
    if (seeds.length > 0) {
      try {
        const summary = await chatCompletion({
          messages: [
            { role: "system", content: "You are a growth analyst. Summarise the following signals into ONE punchy, founder-friendly insight (max 2 sentences). Return plain text only." },
            { role: "user", content: JSON.stringify(seeds.map((s) => s.title)) },
          ],
          purpose: "insights-narrative",
          supa: context.supabase,
        });
        if (summary.trim()) {
          seeds.unshift({
            agent: "growth", kind: "executive_summary",
            title: "Executive summary",
            body: summary.trim(),
            priority: "high",
          });
        }
      } catch { /* non-blocking */ }
    }

    if (seeds.length === 0) return { created: 0 };
    const { error } = await context.supabase.from("insights").insert(seeds);
    if (error) throw new Error(error.message);
    return { created: seeds.length };
  });
