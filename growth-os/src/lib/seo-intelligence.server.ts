// ============================================================================
// Competitor page crawler (Part 10/14), comparison (Part 11), keyword SERP
// tracking (Part 12), content-gap detection (Part 13), and content briefs
// (Part 15). One module: these five phases share the same underlying data
// (competitor_pages, keywords, seo_content_gaps) closely enough that
// splitting them into five files would just mean re-importing the same
// helpers everywhere.
//
// Real providers used: Firecrawl (crawling, already real/available) and
// SerpAPI (SERP position tracking, already real/available). NOT used:
// nothing fabricates search_volume/difficulty/cpc -- there is no connected
// keyword-metrics provider (Ahrefs/SEMrush/Google Keyword Planner all
// require credentials this deployment doesn't have), so those columns stay
// NULL and every score below is computed only from real, observed
// SERP/crawl signals. keywords.source is always the real provider name,
// per that column's own "never 'estimated'" constraint.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai.server";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function untyped(supabase: unknown) {
  return supabase as { from: (table: string) => any; rpc: (fn: string, args: unknown) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Deterministic opportunity score from real SERP signals only: how much
 * better a competitor ranks than us, weighted toward "they're on page 1
 * and we're not there at all." No AI, no fabricated search volume. Kept as
 * a pure, exported function (no supabase/network dependency) so it's
 * directly unit-testable (Phase 21) -- see src/lib/__tests__/seo-scoring.test.ts.
 */
export function computeOpportunityScore(
  ourPosition: number | null,
  bestCompetitorPosition: number | null,
): number {
  if (bestCompetitorPosition === null) return 0;
  const competitorScore = Math.max(0, 11 - bestCompetitorPosition);
  const ourScore = ourPosition !== null ? Math.max(0, 11 - ourPosition) : 0;
  return Math.max(0, competitorScore - ourScore) * 10;
}

// ============ Part 10/14: crawl one competitor page ============

async function firecrawlScrapeDetailed(url: string): Promise<
  ApiResult<{
    markdown: string;
    html: string;
    links: string[];
    title?: string;
    description?: string;
    statusCode?: number;
  }>
> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return { ok: false, error: "missing_env:FIRECRAWL_API_KEY" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html", "links"] }),
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok)
      return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}` };
    const d = body?.data ?? {};
    return {
      ok: true,
      data: {
        markdown: d.markdown ?? "",
        html: d.html ?? "",
        links: d.links ?? [],
        title: d.metadata?.title,
        description: d.metadata?.description,
        statusCode: d.metadata?.statusCode,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Deterministic extraction from raw HTML -- regex-based, not AI, so results are reproducible and auditable. */
function extractTechnicalSignals(html: string, pageUrl: string) {
  const headings = [...html.matchAll(/<h([1-6])[^>]*>(.*?)<\/h\1>/gis)]
    .map((m) => ({ level: Number(m[1]), text: m[2].replace(/<[^>]+>/g, "").trim() }))
    .filter((h) => h.text.length > 0)
    .slice(0, 50);

  const schemaTypes = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis),
  ].flatMap((m) => {
    try {
      const parsed = JSON.parse(m[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items.map((i) => i["@type"]).filter(Boolean);
    } catch {
      return [];
    }
  });

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  const robotsContent = robotsMatch?.[1]?.toLowerCase() ?? "";
  const hasNoindex = robotsContent.includes("noindex");

  let host = "";
  try {
    host = new URL(pageUrl).host;
  } catch {
    /* leave empty */
  }

  return {
    headings,
    schemaTypes: [...new Set(schemaTypes)],
    canonicalUrl: canonicalMatch?.[1] ?? null,
    robotsIndexable: !hasNoindex,
    hasNoindex,
    host,
  };
}

/** Heuristic, deterministic extraction of offers/pricing/CTAs/contact info from markdown -- pattern-matched, never AI-guessed numbers. */
function extractCommercialSignals(markdown: string) {
  const pricingMatches = [...markdown.matchAll(/(?:₹|Rs\.?|INR|\$|USD)\s?[\d,]+(?:\.\d+)?/gi)]
    .map((m) => m[0])
    .slice(0, 20);
  const ctaPhrases = [
    "enroll now",
    "book now",
    "buy now",
    "sign up",
    "get started",
    "apply now",
    "contact us",
    "download",
    "register",
    "join now",
    "free trial",
    "book a demo",
  ];
  const lowerMd = markdown.toLowerCase();
  const ctas = ctaPhrases.filter((p) => lowerMd.includes(p));
  const emails = [
    ...new Set(
      [...markdown.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map((m) => m[0]),
    ),
  ].slice(0, 5);
  const phones = [
    ...new Set([...markdown.matchAll(/(?:\+91[-\s]?)?[6-9]\d{9}\b/g)].map((m) => m[0])),
  ].slice(0, 5);
  return { pricing: pricingMatches, ctas, offers: ctas, contactInfo: { emails, phones } };
}

/**
 * Crawls one competitor URL, upserts the parsed result into
 * competitor_pages, and -- only if content actually changed since the last
 * crawl -- records a competitor_page_history row with an AI-generated
 * diff summary (never generated on a no-op crawl, per that table's schema
 * comment).
 */
export async function crawlCompetitorPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  userId: string,
  competitorId: string,
  url: string,
): Promise<ApiResult<{ pageId: string; changed: boolean }>> {
  const u = untyped(supa);
  const scraped = await firecrawlScrapeDetailed(url);
  if (!scraped.ok) return scraped;

  const tech = extractTechnicalSignals(scraped.data.html, url);
  const commercial = extractCommercialSignals(scraped.data.markdown);
  const contentHash = createHash("sha256").update(scraped.data.markdown).digest("hex");
  const wordCount = scraped.data.markdown.split(/\s+/).filter(Boolean).length;
  const internalLinks = scraped.data.links.filter((l) => {
    try {
      return new URL(l).host === tech.host;
    } catch {
      return false;
    }
  });

  const { data: existing } = await u
    .from("competitor_pages")
    .select("id, content_hash")
    .eq("competitor_id", competitorId)
    .eq("url", url)
    .maybeSingle();
  const changed = !existing || existing.content_hash !== contentHash;

  const row = {
    user_id: userId,
    competitor_id: competitorId,
    url,
    title: scraped.data.title ?? null,
    meta_description: scraped.data.description ?? null,
    headings: tech.headings,
    word_count: wordCount,
    schema_types: tech.schemaTypes,
    canonical_url: tech.canonicalUrl,
    internal_links: internalLinks,
    offers: commercial.offers,
    pricing: commercial.pricing,
    ctas: commercial.ctas,
    contact_info: commercial.contactInfo,
    content_hash: contentHash,
    last_crawled_at: new Date().toISOString(),
    http_status: scraped.data.statusCode ?? null,
    robots_indexable: tech.robotsIndexable,
    has_noindex: tech.hasNoindex,
    raw_markdown: scraped.data.markdown.slice(0, 20000),
  };

  const { data: upserted, error } = await u
    .from("competitor_pages")
    .upsert(row, { onConflict: "competitor_id,url" })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (changed) {
    let diffSummary: string | null = null;
    if (existing) {
      // Only ask the AI to summarize a real, detected diff -- never invoked on first crawl or a no-op.
      diffSummary = await chatCompletion({
        messages: [
          {
            role: "system",
            content:
              "Summarize what meaningfully changed on this competitor's page in 1-2 sentences. Be concrete (pricing, offers, headline changes). If nothing commercially relevant changed, say so plainly.",
          },
          {
            role: "user",
            content: `URL: ${url}\n\nNew content (truncated):\n${scraped.data.markdown.slice(0, 3000)}`,
          },
        ],
        purpose: "competitor-page-diff-summary",
        supa,
      }).catch(() => null);
    }
    await u.from("competitor_page_history").insert({
      page_id: upserted.id,
      content_hash: contentHash,
      diff_summary: diffSummary,
      raw_markdown: scraped.data.markdown.slice(0, 20000),
    });
  }

  return { ok: true, data: { pageId: upserted.id, changed } };
}

// ============ Part 11: competitor comparison (deterministic scoring) ============

export type ComparisonRow = {
  competitorId: string;
  competitorName: string;
  pagesCrawled: number;
  avgWordCount: number;
  hasSchema: boolean;
  hasCtas: boolean;
  hasPricing: boolean;
};

export async function compareCompetitorPages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  userId: string,
): Promise<ApiResult<ComparisonRow[]>> {
  const u = untyped(supa);
  const { data: competitors, error: cErr } = await u
    .from("gbp_competitors")
    .select("id, name")
    .eq("user_id", userId);
  if (cErr) return { ok: false, error: cErr.message };

  const rows: ComparisonRow[] = [];
  for (const comp of (competitors ?? []) as Array<{ id: string; name: string }>) {
    const { data: pages } = await u
      .from("competitor_pages")
      .select("word_count, schema_types, ctas, pricing")
      .eq("competitor_id", comp.id);
    const list = (pages ?? []) as Array<{
      word_count: number | null;
      schema_types: string[];
      ctas: string[];
      pricing: string[];
    }>;
    if (list.length === 0) continue;
    rows.push({
      competitorId: comp.id,
      competitorName: comp.name,
      pagesCrawled: list.length,
      avgWordCount: Math.round(list.reduce((s, p) => s + (p.word_count ?? 0), 0) / list.length),
      hasSchema: list.some((p) => (p.schema_types ?? []).length > 0),
      hasCtas: list.some((p) => (p.ctas ?? []).length > 0),
      hasPricing: list.some((p) => (p.pricing ?? []).length > 0),
    });
  }
  return { ok: true, data: rows };
}

// ============ Part 12: keyword SERP position tracking ============

/**
 * Fetches real Google SERP results via SerpAPI and records which tracked
 * competitors (by domain) appear, at what position. No volume/difficulty/cpc
 * -- no connected provider for those (left NULL).
 *
 * Deliberately does NOT filter gbp_competitors by user_id: keywords and
 * seo_content_gaps are team-wide tables (is_team_member RLS), and matching
 * against the whole team's approved competitor list -- not one arbitrary
 * caller's subset -- is the correct scope for a read-only domain match,
 * regardless of whether this runs from a user's own session (manual
 * trigger) or the worker's service-role client (scheduled/event/task).
 */
export async function refreshKeywordSerp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  keyword: string,
  country = "IN",
  language = "en",
): Promise<
  ApiResult<{
    keywordId: string;
    ourPosition: number | null;
    competitorPositions: Array<{ domain: string; position: number; url: string }>;
  }>
> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return { ok: false, error: "missing_env:SERPAPI_KEY" };
  const u = untyped(supa);

  const res = await fetch(
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&gl=${country.toLowerCase()}&hl=${language}&num=10&api_key=${key}`,
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) return { ok: false, error: `SerpAPI HTTP ${res.status}` };
  const organic = (body.organic_results ?? []) as Array<{ link: string; position: number }>;

  const { data: competitors } = await u.from("gbp_competitors").select("id, url");
  const domainOf = (url: string) => {
    try {
      return new URL(url).host.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  const compDomains = new Map<string, string>(
    (competitors ?? [])
      .filter((c: { url: string | null }) => c.url)
      .map((c: { id: string; url: string }) => [domainOf(c.url), c.id]),
  );

  const competitorPositions: Array<{
    domain: string;
    position: number;
    url: string;
    competitor_id?: string;
  }> = [];
  let ourPosition: number | null = null;
  const ourDomain = process.env.PRIMARY_DOMAIN
    ? domainOf(process.env.PRIMARY_DOMAIN)
    : "muziclly.com";
  for (const r of organic) {
    const domain = domainOf(r.link);
    if (domain === ourDomain) ourPosition = r.position;
    if (compDomains.has(domain))
      competitorPositions.push({
        domain,
        position: r.position,
        url: r.link,
        competitor_id: compDomains.get(domain),
      });
  }

  const bestCompetitorPosition =
    competitorPositions.length > 0 ? Math.min(...competitorPositions.map((c) => c.position)) : null;
  const opportunityScore = computeOpportunityScore(ourPosition, bestCompetitorPosition);

  const { data: kw, error } = await u
    .from("keywords")
    .upsert(
      {
        keyword,
        country,
        language,
        our_position: ourPosition,
        our_position_updated_at: ourPosition !== null ? new Date().toISOString() : null,
        competitor_positions: competitorPositions,
        opportunity_score: opportunityScore,
        source: "serpapi",
        raw: { organic_results_count: organic.length },
      },
      { onConflict: "keyword,country,language" },
    )
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: { keywordId: kw.id, ourPosition, competitorPositions } };
}

// ============ Part 13: SEO content gap detection (deterministic) ============

export async function detectContentGaps(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
): Promise<ApiResult<{ created: number }>> {
  const u = untyped(supa);
  const { data: keywords, error } = await u
    .from("keywords")
    .select("id, keyword, our_position, competitor_positions, opportunity_score")
    .gt("opportunity_score", 0);
  if (error) return { ok: false, error: error.message };

  let created = 0;
  for (const kw of (keywords ?? []) as Array<{
    id: string;
    keyword: string;
    our_position: number | null;
    competitor_positions: Array<{ competitor_id?: string; position: number }>;
    opportunity_score: number;
  }>) {
    const { data: existingGap } = await u
      .from("seo_content_gaps")
      .select("id")
      .eq("keyword_id", kw.id)
      .eq("status", "open")
      .maybeSingle();
    if (existingGap) continue; // don't duplicate an already-open gap for the same keyword

    const gapType = kw.our_position === null ? "missing_keyword" : "ranking_below_competitor";
    const priority =
      kw.opportunity_score >= 70
        ? "critical"
        : kw.opportunity_score >= 40
          ? "high"
          : kw.opportunity_score >= 15
            ? "medium"
            : "low";
    const bestCompetitor = kw.competitor_positions?.[0];
    const { error: insertErr } = await u.from("seo_content_gaps").insert({
      keyword_id: kw.id,
      competitor_id: bestCompetitor?.competitor_id ?? null,
      gap_type: gapType,
      priority,
      opportunity_score: kw.opportunity_score,
      detail: {
        keyword: kw.keyword,
        our_position: kw.our_position,
        competitor_positions: kw.competitor_positions,
      },
    });
    if (!insertErr) created++;
  }
  return { ok: true, data: { created } };
}

// ============ Part 15: SEO content brief (brief only -- never auto-publishes) ============

export async function generateContentBrief(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supa: any,
  gapId: string,
): Promise<ApiResult<{ knowledgeId: string }>> {
  const u = untyped(supa);
  const { data: gap, error } = await u
    .from("seo_content_gaps")
    .select("*, keywords(keyword, our_position, competitor_positions)")
    .eq("id", gapId)
    .single();
  if (error) return { ok: false, error: error.message };

  const brief = await chatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are an SEO content strategist. Produce a concrete content brief: a working title, a section-by-section outline (H2s), the primary target keyword, 3-5 secondary keywords/phrases naturally related to it, and what to cover that ranking competitors likely already do (based on the gap detail given). Output plain markdown. This is a BRIEF for a human writer -- never full article copy.",
      },
      {
        role: "user",
        content: `Content gap detail:\n${JSON.stringify(gap.detail, null, 2)}\nGap type: ${gap.gap_type}, priority: ${gap.priority}`,
      },
    ],
    purpose: "seo-content-brief",
    supa,
  });

  const { data: knowledge, error: kErr } = await u
    .from("agents_knowledge")
    .insert({
      category: "seo-brief",
      title: `Content brief: ${gap.detail?.keyword ?? gap.keyword_id}`,
      content: brief,
      tags: ["seo", gap.priority],
    })
    .select("id")
    .single();
  if (kErr) return { ok: false, error: kErr.message };

  await u
    .from("seo_content_gaps")
    .update({ status: "briefed", content_brief_id: knowledge.id })
    .eq("id", gapId);
  return { ok: true, data: { knowledgeId: knowledge.id } };
}

// ============ UI-facing server functions ============

export const crawlCompetitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ competitorId: z.string().uuid(), url: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const result = await crawlCompetitorPage(
      context.supabase,
      context.userId,
      data.competitorId,
      data.url,
    );
    if (!result.ok) throw new Error(result.error);
    return result.data;
  });

export const getCompetitorComparison = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await compareCompetitorPages(context.supabase, context.userId);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  });

export const refreshKeyword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        keyword: z.string().min(1),
        country: z.string().default("IN"),
        language: z.string().default("en"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const result = await refreshKeywordSerp(
      context.supabase,
      data.keyword,
      data.country,
      data.language,
    );
    if (!result.ok) throw new Error(result.error);
    return result.data;
  });

export const listOpenContentGaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const u = untyped(context.supabase);
    const { data, error } = await u
      .from("seo_content_gaps")
      .select("*, keywords(keyword)")
      .eq("status", "open")
      .order("opportunity_score", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const draftContentBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ gapId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await generateContentBrief(context.supabase, data.gapId);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  });
