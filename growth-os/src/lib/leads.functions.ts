import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ------- Schemas -------
export const leadInputSchema = z.object({
  name: z.string().trim().max(200).optional().nullable(),
  parent_name: z.string().trim().max(200).optional().nullable(),
  student_name: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  age: z.number().int().min(1).max(120).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  instrument: z.string().trim().max(100).optional().nullable(),
  learning_goal: z.enum(["hobby", "certification", "professional", "teacher_training"]).optional().nullable(),
  skill_level: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  source: z
    .enum([
      "website", "facebook_ads", "instagram_ads", "whatsapp",
      "google_ads", "organic", "referral", "manual", "other",
    ])
    .default("manual"),
  campaign_source: z.string().trim().max(200).optional().nullable(),
  utm_source: z.string().trim().max(200).optional().nullable(),
  utm_medium: z.string().trim().max(200).optional().nullable(),
  utm_campaign: z.string().trim().max(200).optional().nullable(),
  utm_content: z.string().trim().max(200).optional().nullable(),
  utm_term: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const listFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  instrument: z.string().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  limit: z.number().int().min(1).max(200).default(100),
}).partial();

// ------- Server Functions -------
export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listFiltersSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status as never);
    if (data.source) q = q.eq("source", data.source as never);
    if (data.country) q = q.eq("country", data.country);
    if (data.instrument) q = q.eq("instrument", data.instrument);
    if (typeof data.minScore === "number") q = q.gte("score", data.minScore);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},student_name.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [leadRes, labelsRes, scoreRes, activitiesRes, tasksRes, qualRes] = await Promise.all([
      context.supabase.from("leads").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("lead_label_assignments").select("label").eq("lead_id", data.id),
      context.supabase.from("lead_score_breakdown").select("*").eq("lead_id", data.id).maybeSingle(),
      context.supabase.from("activities").select("*").eq("lead_id", data.id).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("tasks").select("*").eq("lead_id", data.id).order("created_at", { ascending: false }),
      context.supabase.from("qualification_responses").select("*").eq("lead_id", data.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (leadRes.error) throw new Error(leadRes.error.message);
    if (!leadRes.data) throw new Error("Lead not found");
    return {
      lead: leadRes.data,
      labels: (labelsRes.data ?? []).map((r) => r.label as string),
      score: scoreRes.data,
      activities: activitiesRes.data ?? [],
      tasks: tasksRes.data ?? [],
      qualification: qualRes.data,
    };
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => leadInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const insert = { ...data, email: data.email || null };
    const { data: row, error } = await context.supabase
      .from("leads").insert(insert).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("activities").insert({
      lead_id: row.id, actor_id: context.userId,
      kind: "lead.created", payload: { source: row.source },
    });
    await context.supabase.from("notifications").insert({
      user_id: null, type: "new_lead",
      title: `New lead: ${row.name ?? row.email ?? row.phone ?? "unknown"}`,
      body: `Source: ${row.source}`, lead_id: row.id,
    });
    return row;
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), patch: leadInputSchema.partial() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("leads").update({ ...data.patch, last_activity_at: new Date().toISOString() })
      .eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const changeLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum([
        "new", "contacted", "qualified", "assessment_scheduled",
        "assessment_completed", "enrollment_pending", "enrolled",
        "lost", "dormant", "re_engagement",
      ]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("leads").update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("activities").insert({
      lead_id: data.id, actor_id: context.userId,
      kind: "status.changed", payload: { status: data.status },
    });
    return row;
  });

export const addLeadNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().trim().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("activities").insert({
      lead_id: data.id, actor_id: context.userId,
      kind: "note.added", payload: { text: data.note },
    });
    await context.supabase.from("leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });
