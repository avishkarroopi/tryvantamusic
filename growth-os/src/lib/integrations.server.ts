// Server-only wrappers around external APIs used by AI Workforce handlers.
// NEVER import from client-reachable code paths.
// Every call returns a typed { ok, data?, error? } envelope so handlers can
// degrade gracefully when credentials are missing or an upstream call fails.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GRAPH_VERSION = "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function envOk(...keys: string[]): string | null {
  for (const k of keys) if (!process.env[k]) return k;
  return null;
}

async function jfetch<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const msg =
        typeof body === "object" && body && "error" in body
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((body as any).error?.message ?? JSON.stringify(body))
          : String(body).slice(0, 300);
      return { ok: false, error: `HTTP ${res.status}: ${msg}` };
    }
    return { ok: true, data: body as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ============ Meta (Facebook Page) ============
export type FbPageInsight = { name: string; period: string; value: number };
export type FbPagePost = {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  reactions?: { summary?: { total_count: number } };
  comments?: { summary?: { total_count: number } };
  shares?: { count: number };
};

export async function fbPageOverview(): Promise<
  ApiResult<{
    page: { id: string; name: string; fan_count?: number; followers_count?: number };
    recentPosts: FbPagePost[];
  }>
> {
  const missing = envOk("FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  const id = process.env.FACEBOOK_PAGE_ID!;
  const tok = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;

  const pageRes = await jfetch<{
    id: string;
    name: string;
    fan_count?: number;
    followers_count?: number;
  }>(
    `${GRAPH}/${id}?fields=id,name,fan_count,followers_count&access_token=${encodeURIComponent(tok)}`,
  );
  if (!pageRes.ok) return pageRes;

  const postsRes = await jfetch<{ data: FbPagePost[] }>(
    `${GRAPH}/${id}/posts?limit=10&fields=id,message,created_time,permalink_url,reactions.summary(true),comments.summary(true),shares&access_token=${encodeURIComponent(tok)}`,
  );
  if (!postsRes.ok) return postsRes;

  return { ok: true, data: { page: pageRes.data, recentPosts: postsRes.data.data ?? [] } };
}

// ============ Instagram (Graph API via Meta) ============
export type IgMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

export async function igAccountOverview(): Promise<
  ApiResult<{
    account: { id: string; username: string; followers_count?: number; media_count?: number };
    recentMedia: IgMedia[];
  }>
> {
  const tok = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
  const igBiz = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "";
  if (!tok) return { ok: false, error: "missing_env:INSTAGRAM_ACCESS_TOKEN" };

  // Prefer Facebook Graph host when we have a linked IG Business Account +
  // a Page/System-User token (the modern setup). Fall back to graph.instagram.com
  // for legacy IG Login tokens.
  const isFbGraphToken = tok.startsWith("EAA");
  if (igBiz && isFbGraphToken) {
    const accRes = await jfetch<{
      id: string;
      username: string;
      followers_count?: number;
      media_count?: number;
    }>(
      `${GRAPH}/${igBiz}?fields=id,username,followers_count,media_count&access_token=${encodeURIComponent(tok)}`,
    );
    if (accRes.ok) {
      const mediaRes = await jfetch<{ data: IgMedia[] }>(
        `${GRAPH}/${igBiz}/media?limit=10&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${encodeURIComponent(tok)}`,
      );
      if (mediaRes.ok)
        return { ok: true, data: { account: accRes.data, recentMedia: mediaRes.data.data ?? [] } };
    }
  }

  const meRes = await jfetch<{ user_id?: string; id?: string }>(
    `https://graph.instagram.com/me?fields=id,user_id,username&access_token=${encodeURIComponent(tok)}`,
  );
  if (!meRes.ok) return meRes;
  const igId = meRes.data.user_id ?? meRes.data.id;
  if (!igId) return { ok: false, error: "could_not_resolve_instagram_id" };

  const accRes = await jfetch<{
    id: string;
    username: string;
    followers_count?: number;
    media_count?: number;
  }>(
    `https://graph.instagram.com/${igId}?fields=id,username,followers_count,media_count&access_token=${encodeURIComponent(tok)}`,
  );
  if (!accRes.ok) return accRes;

  const mediaRes = await jfetch<{ data: IgMedia[] }>(
    `https://graph.instagram.com/${igId}/media?limit=10&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${encodeURIComponent(tok)}`,
  );
  if (!mediaRes.ok) return mediaRes;

  return { ok: true, data: { account: accRes.data, recentMedia: mediaRes.data.data ?? [] } };
}

// ============ WhatsApp Business Cloud API ============
export async function waSendText(
  to: string,
  body: string,
): Promise<ApiResult<{ message_id: string }>> {
  const missing = envOk("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  const tok = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await jfetch<{ messages: Array<{ id: string }> }>(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: body.slice(0, 4096), preview_url: false },
    }),
  });
  if (!res.ok) return res;
  return { ok: true, data: { message_id: res.data.messages?.[0]?.id ?? "" } };
}

export async function waSendTemplate(
  to: string,
  templateName: string,
  languageCode = "en_US",
): Promise<ApiResult<{ message_id: string }>> {
  const missing = envOk("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  const tok = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await jfetch<{ messages: Array<{ id: string }> }>(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: templateName, language: { code: languageCode } },
    }),
  });
  if (!res.ok) return res;
  return { ok: true, data: { message_id: res.data.messages?.[0]?.id ?? "" } };
}

export async function waListTemplates(): Promise<
  ApiResult<{ data: Array<{ name: string; status: string; category: string; language: string }> }>
> {
  const missing = envOk("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_BUSINESS_ACCOUNT_ID");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  const tok = process.env.WHATSAPP_ACCESS_TOKEN!;
  const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!;
  return jfetch(
    `${GRAPH}/${waba}/message_templates?limit=50&access_token=${encodeURIComponent(tok)}`,
  );
}

// ============ Research (Tavily / SerpAPI / Firecrawl) ============
export type ResearchHit = {
  title: string;
  url: string;
  snippet: string;
  source: "tavily" | "serpapi";
};

export async function researchSearch(
  query: string,
  maxResults = 5,
): Promise<ApiResult<ResearchHit[]>> {
  // Prefer Tavily (LLM-optimised); fall back to SerpAPI.
  if (process.env.TAVILY_API_KEY) {
    const res = await jfetch<{ results: Array<{ title: string; url: string; content: string }> }>(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results: maxResults,
          search_depth: "basic",
        }),
      },
    );
    if (res.ok) {
      return {
        ok: true,
        data: res.data.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: (r.content ?? "").slice(0, 400),
          source: "tavily",
        })),
      };
    }
  }
  if (process.env.SERPAPI_KEY) {
    const res = await jfetch<{
      organic_results?: Array<{ title: string; link: string; snippet?: string }>;
    }>(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=${maxResults}&api_key=${process.env.SERPAPI_KEY}`,
    );
    if (res.ok) {
      return {
        ok: true,
        data: (res.data.organic_results ?? []).map((r) => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet ?? "",
          source: "serpapi",
        })),
      };
    }
  }
  return { ok: false, error: "no_research_provider_available" };
}

export async function firecrawlScrape(
  url: string,
): Promise<ApiResult<{ markdown: string; title?: string }>> {
  const missing = envOk("FIRECRAWL_API_KEY");
  if (missing) return { ok: false, error: `missing_env:${missing}` };
  const res = await jfetch<{ data?: { markdown?: string; metadata?: { title?: string } } }>(
    "https://api.firecrawl.dev/v1/scrape",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    },
  );
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      markdown: (res.data.data?.markdown ?? "").slice(0, 8000),
      title: res.data.data?.metadata?.title,
    },
  };
}

// ============ Capability registry (drives the Integrations panel) ============
export type IntegrationDef = {
  key: string;
  label: string;
  requiredEnv: string[]; // ALL must be present for status=ready
  optionalEnv?: string[]; // useful but not required
};

export const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    key: "meta_facebook",
    label: "Meta — Facebook Page",
    requiredEnv: ["META_APP_ID", "FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"],
  },
  {
    key: "meta_ads",
    label: "Meta Marketing API (Ads) (pending)",
    requiredEnv: ["MARKETING_API_TOKEN", "META_AD_ACCOUNT_ID"],
  },
  {
    key: "meta_instagram",
    label: "Meta — Instagram",
    requiredEnv: ["INSTAGRAM_ACCESS_TOKEN"],
    optionalEnv: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
  },
  {
    key: "whatsapp",
    label: "WhatsApp Business Cloud",
    requiredEnv: [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
    ],
  },
  {
    key: "google_base",
    label: "Google — OAuth Client + API Key",
    requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_API_KEY"],
  },
  // Correction (found while building Phase 7/8/9): Google Ads/GA4/GSC/GBP/
  // Gmail all actually reuse the ONE unified Google OAuth connection
  // (google-integration/*, whose GOOGLE_SCOPES already requests adwords/
  // analytics.readonly/webmasters.readonly/business.manage/gmail.readonly)
  // -- not separate per-product env credentials. But this status check
  // (see listIntegrationStatuses below) is a synchronous, env-var-only
  // check with no DB access, so it has no way to ask "is there an active
  // google_integrations row" (that's a live DB fact, not an env fact, and
  // is currently NO for all users -- confirmed empty). Deliberately kept
  // these requiredEnv lists as real-but-unrelated env vars this deployment
  // never sets, so status correctly reads "missing_credentials" instead of
  // a vacuously-true empty-array "ready" -- accurate outcome, inaccurate
  // reason, which is why this comment exists. A real fix (make this check
  // DB-aware) is Phase 20 UI scope, not a one-line env-list edit.
  {
    key: "google_ads",
    label: "Google Ads (pending: needs an active Google connection + developer token)",
    requiredEnv: ["GOOGLE_ADS_DEVELOPER_TOKEN"],
  },
  {
    key: "google_analytics",
    label: "Google Analytics 4 (pending: needs an active Google connection)",
    requiredEnv: ["GA4_PROPERTY_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
  {
    key: "google_search_console",
    label: "Google Search Console (pending: needs an active Google connection)",
    requiredEnv: ["GSC_SITE_URL", "GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
  {
    key: "google_business_profile",
    label: "Google Business Profile (pending: needs an active Google connection)",
    requiredEnv: ["GBP_ACCOUNT_ID", "GBP_LOCATION_ID"],
  },
  {
    key: "gmail",
    label: "Gmail (pending: needs an active Google connection)",
    requiredEnv: ["GMAIL_REFRESH_TOKEN"],
  },
  {
    key: "firebase",
    label: "Firebase Admin",
    requiredEnv: ["FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_PROJECT_ID"],
  },
  {
    key: "cloudflare",
    label: "Cloudflare",
    requiredEnv: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  },
  { key: "github", label: "GitHub", requiredEnv: ["GITHUB_TOKEN"] },
  {
    key: "twilio",
    label: "Twilio",
    requiredEnv: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
  },
  { key: "tavily", label: "Tavily Search", requiredEnv: ["TAVILY_API_KEY"] },
  { key: "serpapi", label: "SerpAPI", requiredEnv: ["SERPAPI_KEY"] },
  { key: "firecrawl", label: "Firecrawl", requiredEnv: ["FIRECRAWL_API_KEY"] },
  { key: "sentry", label: "Sentry", requiredEnv: ["SENTRY_DSN"] },
  { key: "logtail", label: "Logtail", requiredEnv: ["LOGTAIL_SOURCE_TOKEN"] },
  { key: "posthog", label: "PostHog", requiredEnv: ["POSTHOG_API_KEY", "POSTHOG_HOST"] },
  { key: "stripe", label: "Stripe (pending)", requiredEnv: ["STRIPE_SECRET_KEY"] },
];
