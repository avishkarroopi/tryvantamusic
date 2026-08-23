import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const platformEnum = z.enum(["meta", "google"]);

export const listAdEntities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ platform: platformEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ad_entities")
      .select("*")
      .eq("platform", data.platform)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createAdEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      platform: platformEnum,
      level: z.enum(["campaign", "adset", "ad", "keyword", "ad_group"]),
      external_id: z.string().max(200).optional().nullable(),
      parent_external_id: z.string().max(200).optional().nullable(),
      name: z.string().min(1).max(200),
      status: z.string().max(50).optional().nullable(),
      budget: z.number().optional().nullable(),
      currency: z.string().max(10).default("INR"),
      metrics: z.record(z.string(), z.number()).default({}),
      period_start: z.string().optional().nullable(),
      period_end: z.string().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("ad_entities").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAdRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      platform: platformEnum.optional(),
      status: z.enum(["pending", "approved", "dismissed", "applied"]).optional(),
    }).partial().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("ad_recommendations").select("*").order("created_at", { ascending: false });
    if (data.platform) q = q.eq("platform", data.platform);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const decideAdRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approve", "dismiss", "apply"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch =
      data.decision === "approve"
        ? { status: "approved" as const, approved_by: context.userId, approved_at: now }
        : data.decision === "apply"
        ? { status: "applied" as const, approved_by: context.userId, approved_at: now }
        : { status: "dismissed" as const, dismissed_at: now };
    const { data: row, error } = await context.supabase
      .from("ad_recommendations").update(patch).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

// Generate deterministic + AI recommendations based on ad_entities metrics
export const generateAdRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ platform: platformEnum }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: entities, error } = await context.supabase
      .from("ad_entities")
      .select("*")
      .eq("platform", data.platform);
    if (error) throw new Error(error.message);

    const created: unknown[] = [];
    for (const e of entities ?? []) {
      const m = (e.metrics ?? {}) as Record<string, number>;
      const clicks = Number(m.clicks ?? 0);
      const conv = Number(m.conversions ?? 0);
      const spend = Number(m.spend ?? 0);
      const ctr = Number(m.ctr ?? (m.impressions ? clicks / m.impressions * 100 : 0));
      const roas = Number(m.roas ?? 0);

      const recs: { kind: string; title: string; rationale: string; priority: "low" | "normal" | "high" | "critical" }[] = [];
      if (roas > 3) {
        recs.push({ kind: "increase_budget", title: `Scale ${e.name} — ROAS ${roas.toFixed(1)}x`, rationale: `Return on ad spend is strong. Consider a 20–40% budget lift while efficiency holds.`, priority: "high" });
      }
      if (spend > 0 && conv === 0) {
        recs.push({ kind: "pause", title: `Pause ${e.name}`, rationale: `Spend of ${spend} with zero conversions. Pause and diagnose targeting/creative before continuing.`, priority: "critical" });
      }
      if (ctr > 0 && ctr < 0.8) {
        recs.push({ kind: "test_creative", title: `Test new creative for ${e.name}`, rationale: `CTR is ${ctr.toFixed(2)}% — below the 1% healthy benchmark. Refresh hook/thumbnail.`, priority: "normal" });
      }
      if (data.platform === "google" && e.level === "keyword" && conv === 0 && clicks > 20) {
        recs.push({ kind: "add_negative", title: `Consider negative for "${e.name}"`, rationale: `${clicks} clicks and no conversions suggests low intent.`, priority: "high" });
      }

      for (const r of recs) {
        const { data: inserted } = await context.supabase.from("ad_recommendations").insert({
          platform: data.platform,
          entity_ref: e.external_id ?? e.id,
          entity_name: e.name,
          kind: r.kind,
          title: r.title,
          rationale: r.rationale,
          priority: r.priority,
          metrics_snapshot: m,
        }).select("*").single();
        if (inserted) created.push(inserted);
      }
    }
    return { created: created.length };
  });
