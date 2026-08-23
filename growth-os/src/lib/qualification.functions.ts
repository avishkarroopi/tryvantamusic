import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const qualSchema = z.object({
  lead_id: z.string().uuid(),
  student_age: z.number().int().min(1).max(120).optional().nullable(),
  instrument: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  skill_level: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  goal: z.enum(["hobby", "certification", "professional", "teacher_training"]).optional().nullable(),
  preferred_timing: z.string().trim().max(200).optional().nullable(),
  learning_format: z.string().trim().max(100).optional().nullable(),
  budget: z.enum(["low", "medium", "high", "premium"]).optional().nullable(),
  urgency: z.enum(["low", "medium", "high", "immediate"]).optional().nullable(),
});

type QualInput = z.infer<typeof qualSchema>;
type Lead = { country?: string | null; instrument?: string | null; source?: string | null };

// Deterministic scoring — 0-100 across 7 dimensions
function computeScore(q: QualInput, lead: Lead) {
  const demographic = q.student_age
    ? q.student_age >= 5 && q.student_age <= 65 ? 12 : 6
    : 4;
  const geographic = q.country
    ? ["IN", "India", "US", "USA", "UK", "UAE", "AE", "AU", "CA", "SG"].some((c) =>
        (q.country ?? "").toLowerCase().includes(c.toLowerCase()))
      ? 14 : 8
    : 4;
  const program_fit = q.instrument && q.goal ? 14 : q.instrument || q.goal ? 8 : 3;
  const intent = q.goal === "certification" || q.goal === "professional" ? 18
    : q.goal === "teacher_training" ? 16
    : q.goal === "hobby" ? 8 : 4;
  const urgency = q.urgency === "immediate" ? 15 : q.urgency === "high" ? 12
    : q.urgency === "medium" ? 8 : q.urgency === "low" ? 4 : 2;
  const budget = q.budget === "premium" ? 15 : q.budget === "high" ? 12
    : q.budget === "medium" ? 8 : q.budget === "low" ? 4 : 3;
  const engagement = 12; // freshly qualified counts as engaged
  const total = Math.min(
    100,
    demographic + geographic + program_fit + intent + urgency + budget + engagement,
  );
  return { demographic, geographic, program_fit, intent, urgency, budget, engagement, total };
}

function suggestLabels(q: QualInput, breakdown: ReturnType<typeof computeScore>) {
  const labels: string[] = [];
  if (breakdown.total >= 85) labels.push("hot");
  else if (breakdown.total >= 60) labels.push("warm");
  else labels.push("cold");
  if (q.budget === "premium" || q.budget === "high") labels.push("high_value");
  if (q.country && !/^(in|india)$/i.test(q.country.trim())) labels.push("nri");
  if (q.student_age && q.student_age < 18) labels.push("parent");
  else if (q.student_age && q.student_age >= 18) labels.push("adult_learner");
  if (q.goal === "certification") labels.push("certification");
  if (q.goal === "professional" || q.goal === "teacher_training") labels.push("professional");
  return labels;
}

async function generateAiSummary(
  q: QualInput,
  lead: Lead,
  breakdown: ReturnType<typeof computeScore>,
): Promise<{ summary: string; nextAction: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const fallback = {
    summary: `${q.country ?? "Unknown region"} lead seeking ${q.instrument ?? "music"} classes${q.student_age ? ` for age ${q.student_age}` : ""}. Goal: ${q.goal ?? "not specified"}. Score ${breakdown.total}/100.`,
    nextAction: breakdown.total >= 85 ? "Call within 24 hours"
      : breakdown.total >= 60 ? "Send personalized WhatsApp within 48 hours"
      : "Nurture with newsletter",
  };
  if (!apiKey) return fallback;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a lead-qualification analyst for Muziclly, a premium music education platform. Return strict JSON with keys `summary` (2 sentences, concrete, no fluff) and `next_action` (single imperative sentence).",
          },
          {
            role: "user",
            content: JSON.stringify({ qualification: q, lead, score_breakdown: breakdown }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content) as { summary?: string; next_action?: string };
    return {
      summary: parsed.summary ?? fallback.summary,
      nextAction: parsed.next_action ?? fallback.nextAction,
    };
  } catch {
    return fallback;
  }
}

export const submitQualification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => qualSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: lead, error: leadErr } = await supabase
      .from("leads").select("*").eq("id", data.lead_id).maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) throw new Error("Lead not found");

    const { error: qErr } = await supabase.from("qualification_responses").insert({
      lead_id: data.lead_id,
      student_age: data.student_age,
      instrument: data.instrument,
      country: data.country,
      skill_level: data.skill_level,
      goal: data.goal,
      preferred_timing: data.preferred_timing,
      learning_format: data.learning_format,
      budget: data.budget,
      urgency: data.urgency,
      raw_answers: data,
    });
    if (qErr) throw new Error(qErr.message);

    const breakdown = computeScore(data, lead);
    const { summary, nextAction } = await generateAiSummary(data, lead, breakdown);

    await supabase.from("lead_score_breakdown").upsert({
      lead_id: data.lead_id,
      ...breakdown,
      ai_summary: summary,
      ai_next_action: nextAction,
      updated_at: new Date().toISOString(),
    }, { onConflict: "lead_id" });

    await supabase.from("leads").update({
      score: breakdown.total,
      status: breakdown.total >= 60 ? "qualified" : lead.status,
      instrument: lead.instrument ?? data.instrument,
      country: lead.country ?? data.country,
      learning_goal: lead.learning_goal ?? data.goal,
      skill_level: lead.skill_level ?? data.skill_level,
      last_activity_at: new Date().toISOString(),
    }).eq("id", data.lead_id);

    const labels = suggestLabels(data, breakdown);
    if (labels.length) {
      await supabase.from("lead_label_assignments").upsert(
        labels.map((label) => ({ lead_id: data.lead_id, label: label as never })),
        { onConflict: "lead_id,label" },
      );
    }

    await supabase.from("activities").insert({
      lead_id: data.lead_id, actor_id: userId,
      kind: "qualification.completed",
      payload: { score: breakdown.total, labels },
    });

    if (breakdown.total >= 85) {
      await supabase.from("notifications").insert({
        user_id: null, type: "hot_lead",
        title: `🔥 Hot lead qualified — ${breakdown.total}/100`,
        body: summary, lead_id: data.lead_id,
      });
      await supabase.from("tasks").insert({
        lead_id: data.lead_id,
        title: "High-priority follow-up",
        description: nextAction,
        priority: "urgent",
        rule_source: "score>=85",
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return { score: breakdown.total, labels, summary, nextAction };
  });
