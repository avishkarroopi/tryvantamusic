import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai.server";

const contentKindEnum = z.enum(["post", "reel", "story", "blog", "email", "template", "video", "carousel"]);
const contentStatusEnum = z.enum(["idea", "draft", "approved", "scheduled", "published", "archived"]);

const filterSchema = z.object({
  kind: contentKindEnum.optional(),
  status: contentStatusEnum.optional(),
  platform: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(100),
}).partial();

export const listContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => filterSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("content_items").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 100);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.status) q = q.eq("status", data.status);
    if (data.platform) q = q.eq("platform", data.platform);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      kind: contentKindEnum.default("post"),
      title: z.string().min(1).max(200),
      body: z.string().max(20000).optional().nullable(),
      category: z.string().max(100).optional().nullable(),
      status: contentStatusEnum.default("idea"),
      platform: z.string().max(50).optional().nullable(),
      scheduled_for: z.string().datetime().optional().nullable(),
      tags: z.array(z.string()).default([]),
      ai_generated: z.boolean().default(false),
      ai_prompt: z.string().max(2000).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    if (id) {
      const { data: row, error } = await context.supabase.from("content_items")
        .update(rest).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase.from("content_items")
      .insert({ ...rest, created_by: context.userId }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: contentStatusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: {
      status: z.infer<typeof contentStatusEnum>;
      approved_by?: string;
      published_at?: string;
    } = { status: data.status };
    if (data.status === "approved") patch.approved_by = context.userId;
    if (data.status === "published") patch.published_at = now;
    const { data: row, error } = await context.supabase
      .from("content_items").update(patch).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("content_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// AI content generation — human approval always required
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      kind: contentKindEnum,
      topic: z.string().trim().min(1).max(500),
      audience: z.string().trim().max(200).optional().nullable(),
      platform: z.string().max(50).optional().nullable(),
      tone: z.string().max(100).optional().nullable(),
      variants: z.number().int().min(1).max(5).default(3),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sys = `You write high-quality social/marketing content for Muziclly, a premium music education platform. Return strict JSON: {"items":[{"title":"...","body":"...","hashtags":["..."]}]} with exactly ${data.variants} items. Tone: ${data.tone ?? "warm, credible, founder-led"}. Keep it concise, human, and specific to music education for kids and adults.`;
    const user = JSON.stringify({ kind: data.kind, topic: data.topic, platform: data.platform ?? null, audience: data.audience ?? null });

    let items: { title: string; body: string; hashtags?: string[] }[] = [];
    try {
      const raw = await chatCompletion({
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        jsonMode: true,
      });
      const parsed = JSON.parse(raw) as { items?: { title: string; body: string; hashtags?: string[] }[] };
      items = parsed.items ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Content generation failed");
    }

    // Save as drafts, require approval before publishing
    type Draft = { id: string; title: string; body: string | null; kind: string; status: string };
    const inserted: Draft[] = [];
    for (const it of items) {
      const body = (it.body ?? "") + (it.hashtags?.length ? "\n\n" + it.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : "");
      const { data: row, error } = await context.supabase.from("content_items").insert({
        kind: data.kind,
        title: it.title ?? data.topic,
        body,
        category: data.audience ?? null,
        platform: data.platform ?? null,
        status: "draft",
        ai_generated: true,
        ai_prompt: data.topic,
        created_by: context.userId,
      }).select("id,title,body,kind,status").single();
      if (!error && row) inserted.push(row);
    }
    return { generated: inserted.length, items: inserted };
  });
