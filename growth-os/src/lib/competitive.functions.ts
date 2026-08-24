import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletionJson } from "@/lib/ai.server";
import { computeHealthScore } from "@/lib/gbp.functions";

// NOTE ON TYPES: `gbp_competitor_candidates`, `gbp_competitor_ads`, and the
// new columns on `gbp_reputation_snapshots` (see
// 20260823070000_competitive_intelligence.sql) don't exist yet in the
// generated Supabase types (src/integrations/supabase/types.ts is generated
// FROM the live schema — it only regenerates after this migration is
// actually applied to the database). Casting to `any` at the query-builder
// boundary here is the same documented workaround used elsewhere in this
// codebase for the same reason; replace with real generated types once the
// migration is applied and `supabase gen types` is re-run.
type AnyRow = Record<string, unknown>;
function untyped(supabase: unknown) {
  return supabase as { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface BrandSnapshot {
  id: string;
  created_at: string;
  total_reviews: number;
  avg_rating: number;
  sentiment_score: number | null;
  consistency_score: number | null;
  review_velocity: number | null;
  response_rate: number | null;
}
export interface CompetitorCandidate {
  id: string;
  name: string;
  address: string | null;
  url: string | null;
  rating: number | null;
  review_count: number;
  categories: string[];
  confidence: number;
  status: string;
}
export interface CompetitorAd {
  id: string;
  competitor_id: string;
  platform: string;
  ad_creative_url: string | null;
  ad_copy: string | null;
  first_seen: string | null;
  last_seen: string | null;
  created_at: string;
  is_active: boolean;
}

// Competitive Intelligence — additive module on top of the existing GBP
// tables. Reuses gbp_profile / gbp_reviews / gbp_posts / gbp_competitors and
// the extended gbp_reputation_snapshots table (see the
// 20260823070000_competitive_intelligence.sql migration). Nothing here
// touches intel.functions.ts (unrelated marketing/revenue intel) or the
// Agents module.

// ---------- 1. Brand Intelligence ----------

export const captureBrandSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const [profileRes, reviewsRes, recentReviewsRes, postsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("gbp_reviews").select("rating, replied").eq("user_id", context.userId),
      context.supabase.from("gbp_reviews").select("id, rating").eq("user_id", context.userId).gte("reviewed_at", since30),
      context.supabase.from("gbp_posts").select("id").eq("user_id", context.userId),
    ]);
    const profile = profileRes.data;
    const reviews = reviewsRes.data ?? [];
    const recent = recentReviewsRes.data ?? [];
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / total : 0;
    const replied = reviews.filter((r) => r.replied).length;

    // Deterministic sentiment (same rating->bucket convention already used
    // for gbp_reviews.sentiment on submission — kept consistent, no LLM
    // dependency needed for this signal).
    const positive = reviews.filter((r) => (r.rating ?? 0) >= 4).length;
    const negative = reviews.filter((r) => (r.rating ?? 0) <= 2).length;
    const sentimentScore = total > 0 ? Math.round(((positive - negative) / total) * 50 + 50) : 50; // 0-100, 50 = neutral

    const { score: consistencyScore } = computeHealthScore(profile, { total, avg, replied });
    const reviewVelocity = +(recent.length / 30).toFixed(2); // reviews/day, trailing 30d
    const responseRate = total > 0 ? +((replied / total) * 100).toFixed(1) : 0;

    const { data: row, error } = await untyped(context.supabase)
      .from("gbp_reputation_snapshots")
      .insert({
        user_id: context.userId,
        total_reviews: total,
        avg_rating: +avg.toFixed(2),
        photo_count: (profile?.photo_count as number) ?? 0,
        post_count: (postsRes.data ?? []).length,
        visibility_score: (profile?.visibility_score as number) ?? 0,
        health_score: (profile?.health_score as number) ?? consistencyScore,
        sentiment_score: sentimentScore,
        review_velocity: reviewVelocity,
        response_rate: responseRate,
        consistency_score: consistencyScore,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as BrandSnapshot;
  });

export const brandTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ days: z.number().int().min(7).max(365) }).partial().parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - (data.days ?? 90) * 86400000).toISOString();
    const { data: rows, error } = await untyped(context.supabase)
      .from("gbp_reputation_snapshots")
      .select("*")
      .eq("user_id", context.userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as BrandSnapshot[];
  });

// ---------- 2. Automatic Competitor Discovery ----------

export const discoverCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { available: false, reason: "GOOGLE_PLACES_API_KEY not configured", inserted: 0 };
    }

    const { data: profile } = await context.supabase
      .from("gbp_profile").select("primary_category, city, country").eq("user_id", context.userId).maybeSingle();
    const category = profile?.primary_category || "music school";
    const city = profile?.city ? `${profile.city}${profile.country ? ", " + profile.country : ""}` : "";
    const query = `${category} near ${city || "me"}`;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.websiteUri",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 15 }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { available: false, reason: `Google Places error ${res.status}: ${text.slice(0, 200)}`, inserted: 0 };
    }
    const json = (await res.json()) as { places?: Array<Record<string, unknown>> };
    const places = json.places ?? [];

    let inserted = 0;
    for (const p of places) {
      const placeId = p.id as string | undefined;
      if (!placeId) continue;
      const name = (p.displayName as { text?: string } | undefined)?.text ?? "Unknown";
      const { error } = await untyped(context.supabase).from("gbp_competitor_candidates").upsert(
        {
          user_id: context.userId,
          place_id: placeId,
          name,
          address: (p.formattedAddress as string) ?? null,
          url: (p.websiteUri as string) ?? null,
          rating: (p.rating as number) ?? null,
          review_count: (p.userRatingCount as number) ?? 0,
          categories: (p.types as string[]) ?? [],
          source: "google_places",
          confidence: 0.75,
          raw: p,
        },
        { onConflict: "user_id,place_id", ignoreDuplicates: true },
      );
      if (!error) inserted++;
    }
    return { available: true, found: places.length, inserted };
  });

export const listCompetitorCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await untyped(context.supabase)
      .from("gbp_competitor_candidates").select("*").eq("user_id", context.userId)
      .eq("status", "pending").order("confidence", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CompetitorCandidate[];
  });

export const approveCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: candidate, error: fetchErr } = await untyped(context.supabase)
      .from("gbp_competitor_candidates").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (fetchErr) throw new Error(fetchErr.message);

    const visibility_score = Math.min(100, Math.round(((candidate.review_count ?? 0) / 3) * 0.3 + (candidate.rating ?? 0) * 8));
    const { error: insertErr } = await context.supabase.from("gbp_competitors").insert({
      user_id: context.userId,
      name: candidate.name,
      url: candidate.url,
      review_count: candidate.review_count ?? 0,
      avg_rating: candidate.rating ?? 0,
      categories: candidate.categories ?? [],
      visibility_score,
    });
    if (insertErr) throw new Error(insertErr.message);

    const { error: updateErr } = await untyped(context.supabase)
      .from("gbp_competitor_candidates")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (updateErr) throw new Error(updateErr.message);
    return { ok: true };
  });

export const rejectCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await untyped(context.supabase)
      .from("gbp_competitor_candidates")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- 3. Competitor Ad Intelligence ----------

export const refreshCompetitorAds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ competitorId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const token = process.env.MARKETING_API_TOKEN || process.env.META_AD_LIBRARY_TOKEN;
    if (!token) return { available: false, reason: "MARKETING_API_TOKEN not configured (Meta Ad Library requires a verified Meta app token)", fetched: 0 };

    const { data: competitor, error: compErr } = await context.supabase
      .from("gbp_competitors").select("id, name").eq("id", data.competitorId).eq("user_id", context.userId).single();
    if (compErr) throw new Error(compErr.message);

    const params = new URLSearchParams({
      access_token: token,
      search_terms: competitor.name,
      ad_type: "ALL",
      ad_reached_countries: "['IN','US']",
      fields: "id,ad_creative_link_captions,ad_creative_bodies,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time",
    });
    const res = await fetch(`https://graph.facebook.com/v20.0/ads_archive?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { available: false, reason: `Meta Ad Library error ${res.status}: ${text.slice(0, 200)}`, fetched: 0 };
    }
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const ads = json.data ?? [];

    let fetched = 0;
    for (const ad of ads) {
      const archiveId = ad.id as string | undefined;
      if (!archiveId) continue;
      const isActive = !ad.ad_delivery_stop_time;
      const { error } = await untyped(context.supabase).from("gbp_competitor_ads").upsert(
        {
          user_id: context.userId,
          competitor_id: data.competitorId,
          platform: "meta",
          ad_archive_id: archiveId,
          ad_creative_url: (ad.ad_snapshot_url as string) ?? null,
          ad_copy: Array.isArray(ad.ad_creative_bodies) ? (ad.ad_creative_bodies as string[])[0] : null,
          first_seen: (ad.ad_delivery_start_time as string) ?? null,
          last_seen: new Date().toISOString(),
          is_active: isActive,
          raw: ad,
        },
        { onConflict: "user_id,platform,ad_archive_id" },
      );
      if (!error) fetched++;
    }
    return { available: true, fetched };
  });

export const listCompetitorAds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ competitorId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await untyped(context.supabase)
      .from("gbp_competitor_ads").select("*")
      .eq("competitor_id", data.competitorId).eq("user_id", context.userId)
      .order("is_active", { ascending: false }).order("last_seen", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as CompetitorAd[];
  });

// ---------- 4. Unified dashboard + upgraded AI brief ----------

export const competitiveDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, latestSnapRes, competitorsRes, candidatesRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      untyped(context.supabase).from("gbp_reputation_snapshots").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("gbp_competitors").select("*").eq("user_id", context.userId).order("visibility_score", { ascending: false }),
      untyped(context.supabase).from("gbp_competitor_candidates").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("status", "pending"),
    ]);
    return {
      profile: profileRes.data,
      brandSnapshot: latestSnapRes.data as BrandSnapshot | null,
      competitors: competitorsRes.data ?? [],
      pendingCandidates: candidatesRes.count ?? 0,
    };
  });

export const competitiveIntelBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, snapRes, competitorsRes, adsRes] = await Promise.all([
      context.supabase.from("gbp_profile").select("*").eq("user_id", context.userId).maybeSingle(),
      untyped(context.supabase).from("gbp_reputation_snapshots").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(5),
      context.supabase.from("gbp_competitors").select("*").eq("user_id", context.userId),
      untyped(context.supabase).from("gbp_competitor_ads").select("competitor_id, is_active").eq("user_id", context.userId),
    ]);
    const competitors = competitorsRes.data ?? [];
    const adCounts = new Map<string, number>();
    for (const ad of (adsRes.data ?? []) as AnyRow[]) {
      if (!ad.is_active) continue;
      const cid = ad.competitor_id as string;
      adCounts.set(cid, (adCounts.get(cid) ?? 0) + 1);
    }
    const context_text = JSON.stringify({
      ourProfile: profileRes.data,
      ourBrandTrend: snapRes.data,
      competitors: competitors.map((c) => ({ ...c, activeAds: adCounts.get(c.id) ?? 0 })),
    }).slice(0, 10000);

    type Brief = { summary: string; ourStrengths: string[]; competitorThreats: string[]; opportunities: string[]; recommendedActions: string[] };
    const fallback: Brief = { summary: "Not enough data yet to generate a competitive brief.", ourStrengths: [], competitorThreats: [], opportunities: [], recommendedActions: [] };
    return chatCompletionJson<Brief>({
      messages: [
        {
          role: "system",
          content: "You are a competitive intelligence analyst for a premium music academy (Music). Given our brand trend data, our Google Business profile, and competitor data (visibility score, review count/rating, active ad count), respond as JSON: { summary: string (3-4 sentences, reference real numbers), ourStrengths: string[] (3-5), competitorThreats: string[] (3-5, name specific competitors), opportunities: string[] (3-5), recommendedActions: string[] (3-5, specific and actionable) }. Never generic — always reference the actual data given.",
        },
        { role: "user", content: context_text },
      ],
      fallback,
    });
  });
