import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion, chatCompletionJson } from "@/lib/ai.server";

// ---------- Profile ----------
export const getGbpProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gbp_profile")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileUpsertSchema = z.object({
  business_name: z.string().max(200).optional().nullable(),
  primary_category: z.string().max(200).optional().nullable(),
  additional_categories: z.array(z.string()).optional(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  keywords: z.array(z.string()).optional(),
  cover_image_url: z.string().max(1000).optional().nullable(),
  logo_url: z.string().max(1000).optional().nullable(),
  photo_count: z.number().int().min(0).optional(),
  video_count: z.number().int().min(0).optional(),
  post_count: z.number().int().min(0).optional(),
  qna_count: z.number().int().min(0).optional(),
  appointment_link: z.string().max(500).optional().nullable(),
  total_reviews: z.number().int().min(0).optional(),
  avg_rating: z.number().min(0).max(5).optional(),
  opening_hours: z.record(z.string(), z.any()).optional(),
  services: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
});

export const upsertGbpProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileUpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const existing = await context.supabase
      .from("gbp_profile")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing.data?.id) {
      const { data: row, error } = await context.supabase
        .from("gbp_profile")
        .update(data)
        .eq("id", existing.data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("gbp_profile")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Health score ----------
// Exported (additive change only) so the Competitive Intelligence module can
// reuse the exact same consistency calculation for Brand Intelligence rather
// than duplicating it.
export function computeHealthScore(p: Record<string, unknown> | null, reviewStats: { total: number; avg: number; replied: number }) {
  if (!p) return { score: 0, breakdown: {} as Record<string, { got: number; max: number }> };
  const bd: Record<string, { got: number; max: number }> = {};
  const add = (k: string, got: number, max: number) => { bd[k] = { got: Math.min(got, max), max }; };

  add("Business name", p.business_name ? 5 : 0, 5);
  add("Phone", p.phone ? 4 : 0, 4);
  add("Website", p.website ? 4 : 0, 4);
  add("Address", p.address ? 4 : 0, 4);
  add("Primary category", p.primary_category ? 5 : 0, 5);
  add("Description", (p.description as string | null)?.length ? Math.min(5, Math.round(((p.description as string).length / 400) * 5)) : 0, 5);
  add("Keywords", Array.isArray(p.keywords) ? Math.min(4, (p.keywords as string[]).length) : 0, 4);
  add("Opening hours", p.opening_hours && Object.keys(p.opening_hours as object).length ? 3 : 0, 3);
  add("Appointment link", p.appointment_link ? 3 : 0, 3);
  add("Logo", p.logo_url ? 3 : 0, 3);
  add("Cover image", p.cover_image_url ? 3 : 0, 3);

  const photos = (p.photo_count as number) ?? 0;
  add("Photos", Math.min(10, Math.round(photos / 3)), 10);
  const videos = (p.video_count as number) ?? 0;
  add("Videos", Math.min(4, videos), 4);
  const posts = (p.post_count as number) ?? 0;
  add("Posts", Math.min(6, Math.round(posts / 2)), 6);
  add("Q&A", Math.min(3, (p.qna_count as number) ?? 0), 3);
  add("Services", Array.isArray(p.services) ? Math.min(5, (p.services as unknown[]).length) : 0, 5);
  add("Products", Array.isArray(p.products) ? Math.min(3, (p.products as unknown[]).length) : 0, 3);

  add("Total reviews", Math.min(10, Math.round(reviewStats.total / 5)), 10);
  add("Average rating", Math.round(reviewStats.avg * 2), 10);
  add("Reply rate", reviewStats.total > 0 ? Math.round((reviewStats.replied / reviewStats.total) * 8) : 0, 8);

  const got = Object.values(bd).reduce((a, x) => a + x.got, 0);
  const max = Object.values(bd).reduce((a, x) => a + x.max, 0);
  return { score: Math.round((got / max) * 100), breakdown: bd };
}

// ---------- Dashboard ----------
export const gbpDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, reviewsRes, postsRes, competitorsRes, actionsRes, snapsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("gbp_reviews").select("*").eq("user_id", context.userId).order("reviewed_at", { ascending: false }),
      context.supabase.from("gbp_posts").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
      context.supabase.from("gbp_competitors").select("*").eq("user_id", context.userId),
      context.supabase.from("gbp_actions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("gbp_reputation_snapshots").select("*").eq("user_id", context.userId).order("snapshot_date", { ascending: true }).limit(90),
    ]);
    const profile = profileRes.data;
    const reviews = reviewsRes.data ?? [];
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / total : 0;
    const replied = reviews.filter((r) => r.replied).length;
    const positive = reviews.filter((r) => (r.rating ?? 0) >= 4).length;
    const negative = reviews.filter((r) => (r.rating ?? 0) <= 2).length;
    const unanswered = total - replied;
    const now = Date.now();
    const last30 = reviews.filter((r) => r.reviewed_at && new Date(r.reviewed_at).getTime() > now - 30 * 86400000);
    const prev30 = reviews.filter((r) => r.reviewed_at && new Date(r.reviewed_at).getTime() > now - 60 * 86400000 && new Date(r.reviewed_at).getTime() <= now - 30 * 86400000);
    const growth = prev30.length > 0 ? ((last30.length - prev30.length) / prev30.length) * 100 : (last30.length > 0 ? 100 : 0);

    const health = computeHealthScore(profile as Record<string, unknown> | null, { total, avg, replied });

    // Keyword cloud
    const kwCounts = new Map<string, number>();
    for (const r of reviews) {
      const text = (r.content ?? "").toLowerCase();
      const words = text.match(/\b[a-z]{4,}\b/g) ?? [];
      for (const w of words) {
        if (STOPWORDS.has(w)) continue;
        kwCounts.set(w, (kwCounts.get(w) ?? 0) + 1);
      }
    }
    const keywordCloud = Array.from(kwCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([word, count]) => ({ word, count }));

    // Scores
    const localSeoScore = Math.round(
      ((profile?.business_name ? 15 : 0) +
        (profile?.primary_category ? 15 : 0) +
        (profile?.description ? 15 : 0) +
        (Array.isArray(profile?.keywords) ? Math.min(20, (profile.keywords as string[]).length * 4) : 0) +
        (profile?.website ? 15 : 0) +
        (profile?.address ? 10 : 0) +
        (profile?.city ? 5 : 0) +
        (profile?.phone ? 5 : 0)),
    );
    const reviewScore = total === 0 ? 0 : Math.round((avg / 5) * 60 + (replied / Math.max(total, 1)) * 40);
    const photoScore = Math.min(100, Math.round(((profile?.photo_count ?? 0) / 50) * 100));
    const postingScore = Math.min(100, Math.round(((profile?.post_count ?? 0) / 20) * 100));
    const visibilityScore = Math.round(0.35 * (health.score) + 0.25 * localSeoScore + 0.2 * reviewScore + 0.1 * photoScore + 0.1 * postingScore);

    // Checklist
    const checklist = [
      { key: "name", label: "Business name", ok: !!profile?.business_name },
      { key: "phone", label: "Phone number", ok: !!profile?.phone },
      { key: "website", label: "Website", ok: !!profile?.website },
      { key: "address", label: "Address", ok: !!profile?.address },
      { key: "category", label: "Primary category", ok: !!profile?.primary_category },
      { key: "description", label: "Rich description (200+ chars)", ok: !!profile?.description && (profile?.description as string).length >= 200 },
      { key: "hours", label: "Opening hours", ok: !!profile?.opening_hours && Object.keys(profile.opening_hours as object).length > 0 },
      { key: "photos", label: "20+ photos uploaded", ok: (profile?.photo_count ?? 0) >= 20 },
      { key: "videos", label: "At least 3 videos", ok: (profile?.video_count ?? 0) >= 3 },
      { key: "posts", label: "Weekly Google Posts (4+)", ok: (profile?.post_count ?? 0) >= 4 },
      { key: "services", label: "Services listed", ok: Array.isArray(profile?.services) && (profile.services as unknown[]).length > 0 },
      { key: "appointment", label: "Appointment/booking link", ok: !!profile?.appointment_link },
      { key: "qna", label: "Q&A populated", ok: (profile?.qna_count ?? 0) >= 3 },
      { key: "reply-rate", label: "80%+ review reply rate", ok: total > 0 && replied / total >= 0.8 },
      { key: "unanswered", label: "No unanswered reviews", ok: unanswered === 0 && total > 0 },
      { key: "keywords", label: "5+ local keywords", ok: Array.isArray(profile?.keywords) && (profile.keywords as string[]).length >= 5 },
    ];

    return {
      profile,
      scores: {
        health: health.score,
        healthBreakdown: health.breakdown,
        visibility: visibilityScore,
        review: reviewScore,
        localSeo: localSeoScore,
        photo: photoScore,
        posting: postingScore,
      },
      reviews: {
        total,
        avg,
        replied,
        unanswered,
        positive,
        negative,
        growth,
        last30: last30.length,
        list: reviews.slice(0, 25),
        keywordCloud,
      },
      posts: postsRes.data ?? [],
      competitors: competitorsRes.data ?? [],
      actions: actionsRes.data ?? [],
      snapshots: snapsRes.data ?? [],
      checklist,
    };
  });

// ---------- Reviews ----------
export const importGbpReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      reviewer_name: z.string().max(200).optional().nullable(),
      rating: z.number().int().min(1).max(5),
      content: z.string().max(4000).optional().nullable(),
      reviewed_at: z.string().optional().nullable(),
      replied: z.boolean().optional(),
      reply_text: z.string().max(4000).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sentiment = data.rating >= 4 ? "positive" : data.rating === 3 ? "neutral" : "negative";
    const { data: row, error } = await context.supabase.from("gbp_reviews").insert({
      user_id: context.userId,
      reviewer_name: data.reviewer_name ?? null,
      rating: data.rating,
      content: data.content ?? null,
      reviewed_at: data.reviewed_at ?? new Date().toISOString(),
      replied: data.replied ?? !!data.reply_text,
      reply_text: data.reply_text ?? null,
      sentiment,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), reply_text: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("gbp_reviews")
      .update({ reply_text: data.reply_text, replied: true })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      tone: z.enum(["professional", "friendly", "premium", "empathetic"]).default("premium"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase
      .from("gbp_reviews")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !r) throw new Error(error?.message ?? "Review not found");

    const profileRes = await context.supabase
      .from("gbp_profile")
      .select("business_name, primary_category")
      .eq("user_id", context.userId)
      .maybeSingle();
    const businessName = profileRes.data?.business_name ?? "Muziclly";

    const system = `You are the founder of ${businessName}, a premium music education academy. Write a ${data.tone} reply to a Google review. Rules:
- 2 to 4 sentences, no fluff, no emojis unless the reviewer used one.
- Thank them by first name when available.
- Reflect one specific thing they mentioned so the reply feels human.
- ${r.rating <= 3 ? "Acknowledge the concern sincerely, apologize, invite them to reach out directly." : "Celebrate their experience and reinforce our teaching philosophy."}
- Never generic. Never marketing-speak. Never use the phrase "we appreciate your feedback".`;
    const user = `Reviewer: ${r.reviewer_name ?? "Anonymous"}
Rating: ${r.rating}/5
Review: ${r.content ?? "(no text)"}`;
    const reply = await chatCompletion({
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.7,
    });
    return { reply: reply.trim() };
  });

export const reviewSentimentSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("gbp_reviews")
      .select("rating, content")
      .eq("user_id", context.userId)
      .order("reviewed_at", { ascending: false })
      .limit(60);
    const reviews = rows ?? [];
    if (reviews.length === 0) return { summary: "No reviews yet.", themes: [] as string[] };

    const sample = reviews.map((r) => `[${r.rating}★] ${r.content ?? ""}`).join("\n").slice(0, 6000);
    const result = await chatCompletionJson<{ summary: string; themes: string[] }>({
      messages: [
        { role: "system", content: "You analyze Google Business reviews for a music academy. Return JSON: { summary: string (2–3 sentence executive summary), themes: string[] (5–8 recurring positive/negative themes, phrase-length) }." },
        { role: "user", content: sample },
      ],
      fallback: { summary: "Unable to analyze right now.", themes: [] },
    });
    return result;
  });

// ---------- Posts ----------
export const listGbpPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gbp_posts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createGbpPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      post_type: z.string().max(50).default("update"),
      title: z.string().max(200).optional().nullable(),
      body: z.string().max(4000).optional().nullable(),
      scheduled_at: z.string().optional().nullable(),
      status: z.enum(["draft", "scheduled", "published"]).default("draft"),
      image_url: z.string().max(1000).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("gbp_posts")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const generatePostIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ theme: z.string().max(200).optional() }).partial().parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const theme = data.theme?.trim() || "weekly mix";
    const result = await chatCompletionJson<{ posts: Array<{ post_type: string; title: string; body: string }> }>({
      messages: [
        { role: "system", content: "You are the content strategist for Muziclly, a premium music education academy. Generate Google Business Profile posts. Return JSON: { posts: [{ post_type: 'update'|'event'|'offer'|'achievement', title: string (max 60 chars), body: string (150-300 chars, warm, specific, no generic emoji spam) }] }. Include a range: weekly update, student achievement (Trinity/festival), teaching tip, offer, event." },
        { role: "user", content: `Theme: ${theme}. Generate 6 posts.` },
      ],
      fallback: { posts: [] },
    });
    return result;
  });

// ---------- Competitors ----------
export const upsertCompetitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(200),
      url: z.string().max(500).optional().nullable(),
      review_count: z.number().int().min(0).default(0),
      avg_rating: z.number().min(0).max(5).default(0),
      categories: z.array(z.string()).optional(),
      photo_count: z.number().int().min(0).default(0),
      post_count: z.number().int().min(0).default(0),
      strengths: z.array(z.string()).optional(),
      weaknesses: z.array(z.string()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const visibility_score = Math.min(
      100,
      Math.round((rest.review_count / 3) * 0.3 + rest.avg_rating * 8 + rest.photo_count * 0.4 + rest.post_count * 1.2),
    );
    if (id) {
      const { data: row, error } = await context.supabase
        .from("gbp_competitors")
        .update({ ...rest, visibility_score })
        .eq("id", id)
        .eq("user_id", context.userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("gbp_competitors")
      .insert({ ...rest, visibility_score, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCompetitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("gbp_competitors")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Actions ----------
export const updateActionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "in_progress", "done", "dismissed"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("gbp_actions")
      .update({ status: data.status, completed_at: data.status === "done" ? new Date().toISOString() : null })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, reviewsRes, postsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("gbp_reviews").select("id,rating,replied,content").eq("user_id", context.userId),
      context.supabase.from("gbp_posts").select("id,created_at").eq("user_id", context.userId),
    ]);
    const p = profileRes.data;
    const reviews = reviewsRes.data ?? [];
    const total = reviews.length;
    const unanswered = reviews.filter((r) => !r.replied).length;

    const candidates: Array<{ title: string; description: string; category: string; priority: string; expected_impact: string }> = [];
    if (unanswered > 0) candidates.push({ title: `Reply to ${unanswered} review${unanswered === 1 ? "" : "s"}`, description: "Boost reply rate to signal an active business.", category: "reviews", priority: unanswered >= 5 ? "high" : "normal", expected_impact: "+8 review score" });
    if ((p?.photo_count ?? 0) < 20) candidates.push({ title: `Upload ${20 - (p?.photo_count ?? 0)} classroom photos`, description: "Businesses with 20+ photos receive more direction requests.", category: "media", priority: "high", expected_impact: "+12 photo score" });
    if ((p?.post_count ?? 0) < 4) candidates.push({ title: "Publish a Google Post this week", description: "Weekly posts keep the profile fresh in local search.", category: "posts", priority: "normal", expected_impact: "+6 posting score" });
    if (!p?.appointment_link) candidates.push({ title: "Add an appointment / demo class link", description: "Direct booking action drives high-intent conversions.", category: "profile", priority: "high", expected_impact: "+15% CTA clicks" });
    if (!p?.description || (p.description as string).length < 200) candidates.push({ title: "Rewrite the business description", description: "Aim for 400+ characters with local keywords.", category: "seo", priority: "normal", expected_impact: "+10 local SEO score" });
    if (Array.isArray(p?.services) ? (p!.services as unknown[]).length < 5 : true) candidates.push({ title: "List all instrument programs as services", description: "Add each instrument + Trinity grade as a service.", category: "services", priority: "normal", expected_impact: "+8 discoverability" });
    if (total < 25) candidates.push({ title: "Request 5 new reviews from recent students", description: "Momentum matters — recency weighs heavily in local ranking.", category: "reviews", priority: "high", expected_impact: "+4 rating trust" });
    if ((p?.qna_count ?? 0) < 3) candidates.push({ title: "Seed 3 FAQ Q&As", description: "Fees, trial class, and location questions.", category: "qna", priority: "low", expected_impact: "+3 engagement" });

    // Clear old pending, insert new
    await context.supabase.from("gbp_actions").delete().eq("user_id", context.userId).eq("status", "pending");
    if (candidates.length > 0) {
      await context.supabase.from("gbp_actions").insert(candidates.map((c) => ({ ...c, user_id: context.userId })));
    }
    return { created: candidates.length };
  });

// ---------- AI Coach ----------
export const gbpCoachBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, reviewsRes, competitorsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("gbp_reviews").select("rating,content,replied,reviewed_at").eq("user_id", context.userId).order("reviewed_at", { ascending: false }).limit(60),
      context.supabase.from("gbp_competitors").select("*").eq("user_id", context.userId),
    ]);
    const context_text = JSON.stringify({
      profile: profileRes.data,
      reviews: reviewsRes.data?.slice(0, 30),
      competitors: competitorsRes.data,
    }).slice(0, 8000);
    const result = await chatCompletionJson<{ observations: string[]; recommendations: string[] }>({
      messages: [
        { role: "system", content: "You are a Google Business Profile growth consultant for a premium music academy. Given profile + review + competitor data, respond as JSON: { observations: string[] (3-5 concise, human observations — mention numbers), recommendations: string[] (3-5 specific next actions) }. Never generic. Reference actual data." },
        { role: "user", content: context_text },
      ],
      fallback: { observations: [], recommendations: [] },
    });
    return result;
  });

// ---------- Snapshot ----------
export const captureReputationSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, reviewsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("gbp_reviews").select("rating,replied").eq("user_id", context.userId),
    ]);
    const p = profileRes.data;
    const reviews = reviewsRes.data ?? [];
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / total : 0;
    const replied = reviews.filter((r) => r.replied).length;
    const health = computeHealthScore(p as Record<string, unknown> | null, { total, avg, replied });
    const visibility = Math.round(0.5 * health.score + 0.25 * (avg * 20) + 0.25 * Math.min(100, ((p?.photo_count ?? 0) / 50) * 100));
    const { data, error } = await context.supabase.from("gbp_reputation_snapshots").insert({
      user_id: context.userId,
      total_reviews: total,
      avg_rating: avg,
      photo_count: p?.photo_count ?? 0,
      post_count: p?.post_count ?? 0,
      visibility_score: visibility,
      health_score: health.score,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  });

const STOPWORDS = new Set([
  "this","that","with","have","from","they","were","been","their","would","there","which","when","what","about",
  "your","yours","really","just","very","also","some","much","more","most","other","them","then","than","into",
  "over","only","because","being","after","before","while","during","those","these","here","where","muziclly",
  "class","classes","teacher","teachers","music","kids","child","children","learning","learn","students","student",
  "great","good","best","nice","amazing","excellent","love","loves","loved","really","recommend","highly","would",
]);
