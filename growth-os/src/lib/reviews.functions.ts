import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      platform: z.string().optional(),
      minRating: z.number().int().min(1).max(5).optional(),
    }).partial().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data.platform) q = q.eq("platform", data.platform);
    if (data.minRating) q = q.gte("rating", data.minRating);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid().optional().nullable(),
      platform: z.string().min(1).max(50),
      rating: z.number().int().min(1).max(5),
      content: z.string().max(4000).optional().nullable(),
      reviewer_name: z.string().max(200).optional().nullable(),
      review_url: z.string().url().max(500).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("reviews").insert({
      ...data,
      review_received_at: new Date().toISOString(),
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const reviewMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ days: z.number().int().min(1).max(730).default(180) }).partial().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const days = data.days ?? 180;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [allRes, recentRes] = await Promise.all([
      context.supabase.from("reviews").select("*"),
      context.supabase.from("reviews").select("*").gte("created_at", since),
    ]);
    const all = allRes.data ?? [];
    const recent = recentRes.data ?? [];
    const total = all.length;
    const avg = total > 0 ? all.reduce((a, r) => a + (r.rating ?? 0), 0) / total : 0;
    const bySource = new Map<string, number>();
    for (const r of all) bySource.set(r.platform ?? "unknown", (bySource.get(r.platform ?? "unknown") ?? 0) + 1);

    // Growth: recent vs previous same-length window
    const prevSince = new Date(Date.now() - 2 * days * 86400000).toISOString();
    const prev = all.filter((r) => r.created_at >= prevSince && r.created_at < since);
    const growth = prev.length > 0 ? ((recent.length - prev.length) / prev.length) * 100 : (recent.length > 0 ? 100 : 0);

    return {
      total,
      avg,
      recent: recent.length,
      growth,
      bySource: Array.from(bySource.entries()).map(([key, value]) => ({ key, value })),
      recentList: recent.slice(0, 20),
    };
  });

// Review request templates — canonical seed
export const reviewTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => [
    {
      id: "google-review",
      title: "Google Review Request (Parent, post-enrollment)",
      body: `Hi {{parent_name}}, thank you for enrolling {{student_name}} in {{instrument}} classes at Music! 🎵\n\nWould you take 30 seconds to share your experience? It helps other parents discover us: {{google_review_link}}\n\nWith gratitude, Team Music`,
    },
    {
      id: "testimonial",
      title: "Parent Testimonial Request",
      body: `Hi {{parent_name}}, we're preparing a small feature on students making great progress. Would you be open to sharing a short 2–3 sentence note on {{student_name}}'s journey with us? We'd love to include it.`,
    },
    {
      id: "success-story",
      title: "Student Success Story",
      body: `We'd love to celebrate {{student_name}}'s milestone at {{instrument}}! Could we schedule a 10-minute chat to capture the story for our community? Even a short voice note works.`,
    },
    {
      id: "campaign-google-30d",
      title: "Google Review Campaign — 30 days post-enrollment",
      body: `Hi {{parent_name}}, one month in — how has {{student_name}} been enjoying classes? If it's been a good experience, a Google review means the world to our teachers: {{google_review_link}}`,
    },
  ]);
