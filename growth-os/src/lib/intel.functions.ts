import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type LeadRow = {
  id: string;
  status: string;
  source: string;
  country: string | null;
  city: string | null;
  instrument: string | null;
  campaign_source: string | null;
  score: number;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  lead_id: string | null;
  amount: number;
  currency: string;
  instrument: string | null;
  country: string | null;
  source: string | null;
  campaign: string | null;
  enrolled_at: string;
};

type Bucket = {
  key: string;
  leads: number;
  qualified: number;
  enrolled: number;
  revenue: number;
  avgScore: number;
  conversionRate: number;
};

function group<T>(rows: T[], keyFn: (r: T) => string | null | undefined) {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = (keyFn(r) ?? "unknown").toString();
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return map;
}

function computeBuckets(
  leads: LeadRow[],
  enrollments: EnrollmentRow[],
  leadKeyFn: (l: LeadRow) => string | null | undefined,
  enrollKeyFn: (e: EnrollmentRow) => string | null | undefined,
): Bucket[] {
  const leadGroups = group(leads, leadKeyFn);
  const enrollGroups = group(enrollments, enrollKeyFn);
  const keys = new Set<string>([...leadGroups.keys(), ...enrollGroups.keys()]);
  const buckets: Bucket[] = [];
  for (const key of keys) {
    const ls = leadGroups.get(key) ?? [];
    const es = enrollGroups.get(key) ?? [];
    const leadsCount = ls.length;
    const qualified = ls.filter((l) => l.score >= 60).length;
    const enrolled = ls.filter((l) => l.status === "enrolled").length + (leadsCount === 0 ? es.length : 0);
    const revenue = es.reduce((a, e) => a + Number(e.amount || 0), 0);
    const avgScore = leadsCount > 0 ? ls.reduce((a, l) => a + l.score, 0) / leadsCount : 0;
    const conversionRate = leadsCount > 0 ? (enrolled / leadsCount) * 100 : 0;
    buckets.push({ key, leads: leadsCount, qualified, enrolled, revenue, avgScore, conversionRate });
  }
  return buckets.sort((a, b) => b.revenue - a.revenue || b.leads - a.leads).slice(0, 20);
}

const rangeSchema = z.object({
  days: z.number().int().min(1).max(365).default(90),
}).partial();

export const marketingIntel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rangeSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const days = data.days ?? 90;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [leadsRes, enrollRes, labelsRes] = await Promise.all([
      context.supabase.from("leads").select("id,status,source,country,city,instrument,campaign_source,score,created_at").gte("created_at", since),
      context.supabase.from("enrollments").select("id,lead_id,amount,currency,instrument,country,source,campaign,enrolled_at").gte("enrolled_at", since),
      context.supabase.from("lead_label_assignments").select("lead_id,label"),
    ]);
    if (leadsRes.error) throw new Error(leadsRes.error.message);
    if (enrollRes.error) throw new Error(enrollRes.error.message);

    const leads = (leadsRes.data ?? []) as LeadRow[];
    const enrollments = (enrollRes.data ?? []) as EnrollmentRow[];
    const labelMap = new Map<string, string[]>();
    for (const row of labelsRes.data ?? []) {
      const arr = labelMap.get(row.lead_id) ?? [];
      arr.push(row.label as string);
      labelMap.set(row.lead_id, arr);
    }

    const bySource = computeBuckets(leads, enrollments, (l) => l.source, (e) => e.source ?? "unknown");
    const byCampaign = computeBuckets(leads, enrollments, (l) => l.campaign_source, (e) => e.campaign);
    const byCountry = computeBuckets(leads, enrollments, (l) => l.country, (e) => e.country);
    const byCity = computeBuckets(leads, enrollments, (l) => l.city, () => null);
    const byInstrument = computeBuckets(leads, enrollments, (l) => l.instrument, (e) => e.instrument);

    // Labels performance
    const labelBuckets = new Map<string, { leads: number; enrolled: number }>();
    for (const l of leads) {
      const labels = labelMap.get(l.id) ?? [];
      for (const label of labels) {
        const b = labelBuckets.get(label) ?? { leads: 0, enrolled: 0 };
        b.leads++;
        if (l.status === "enrolled") b.enrolled++;
        labelBuckets.set(label, b);
      }
    }
    const byLabel = Array.from(labelBuckets.entries())
      .map(([key, v]) => ({
        key,
        leads: v.leads,
        enrolled: v.enrolled,
        conversionRate: v.leads > 0 ? (v.enrolled / v.leads) * 100 : 0,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // Funnel
    const funnel = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      assessment: leads.filter((l) => l.status.startsWith("assessment")).length,
      enrollment_pending: leads.filter((l) => l.status === "enrollment_pending").length,
      enrolled: leads.filter((l) => l.status === "enrolled").length,
      lost: leads.filter((l) => l.status === "lost").length,
      total: leads.length,
    };

    return {
      range: { days, since },
      totals: {
        leads: leads.length,
        enrollments: enrollments.length,
        revenue: enrollments.reduce((a, e) => a + Number(e.amount || 0), 0),
      },
      bySource, byCampaign, byCountry, byCity, byInstrument, byLabel,
      funnel,
    };
  });

// ---------- V7 Revenue Intelligence ----------
export const revenueIntel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rangeSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const days = data.days ?? 90;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [enrollRes, costsRes, pipelineRes] = await Promise.all([
      context.supabase.from("enrollments").select("*").gte("enrolled_at", since),
      context.supabase.from("marketing_costs").select("*").gte("period_start", since.slice(0, 10)),
      context.supabase.from("leads").select("id,score,status,source,instrument,country").in("status", ["qualified", "assessment_scheduled", "assessment_completed", "enrollment_pending"]),
    ]);
    if (enrollRes.error) throw new Error(enrollRes.error.message);
    const enrollments = (enrollRes.data ?? []) as EnrollmentRow[];
    const costs = costsRes.data ?? [];
    const pipeline = pipelineRes.data ?? [];

    const totalRevenue = enrollments.reduce((a, e) => a + Number(e.amount || 0), 0);
    const totalCost = costs.reduce((a, c) => a + Number(c.cost || 0), 0);
    const aov = enrollments.length > 0 ? totalRevenue / enrollments.length : 0;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : null;
    const cpl = costs.length > 0 && pipeline.length > 0 ? totalCost / pipeline.length : null;
    const cpe = costs.length > 0 && enrollments.length > 0 ? totalCost / enrollments.length : null;

    const groupSum = <T>(rows: T[], keyFn: (r: T) => string | null | undefined, valFn: (r: T) => number) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = keyFn(r) ?? "unknown";
        m.set(k, (m.get(k) ?? 0) + valFn(r));
      }
      return Array.from(m.entries())
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => b.value - a.value);
    };

    return {
      totals: { revenue: totalRevenue, cost: totalCost, aov, roi, cpl, cpe, enrollments: enrollments.length, pipeline: pipeline.length },
      pipelineValue: pipeline.length * (aov || 0),
      byInstrument: groupSum(enrollments, (e) => e.instrument, (e) => Number(e.amount || 0)),
      byCountry: groupSum(enrollments, (e) => e.country, (e) => Number(e.amount || 0)),
      bySource: groupSum(enrollments, (e) => e.source, (e) => Number(e.amount || 0)),
      byCampaign: groupSum(enrollments, (e) => e.campaign, (e) => Number(e.amount || 0)),
      recent: enrollments.slice(-10).reverse(),
    };
  });

// Manual enrollment logging (to seed revenue data)
export const logEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid().optional().nullable(),
      amount: z.number().positive(),
      currency: z.string().max(10).default("INR"),
      program: z.string().max(200).optional().nullable(),
      instrument: z.string().max(100).optional().nullable(),
      country: z.string().max(100).optional().nullable(),
      source: z.string().optional().nullable(),
      campaign: z.string().max(200).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("enrollments").insert({
      ...data,
      source: data.source as never,
    }).select("*").single();
    if (error) throw new Error(error.message);
    if (data.lead_id) {
      await context.supabase.from("leads").update({ status: "enrolled", last_activity_at: new Date().toISOString() }).eq("id", data.lead_id);
      await context.supabase.from("activities").insert({
        lead_id: data.lead_id, actor_id: context.userId,
        kind: "enrollment.recorded", payload: { amount: data.amount, currency: data.currency },
      });
    }
    return row;
  });
