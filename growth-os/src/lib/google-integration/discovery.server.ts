// Server-only Google resource discovery.
// Each product returns detailed diagnostics so the UI can surface exact reasons
// (HTTP status, response preview, missing scopes, missing dev token, etc.).
import type { GoogleResourceType } from "./scopes";

export type DiscoveryStep = {
  label: string;
  url: string;
  status: number | null; // null when the request never left (e.g. missing dev token)
  ok: boolean;
  bodyPreview: string; // truncated, sensitive fields stripped
  count: number; // resources parsed from this step
  note?: string; // human-readable explanation
};

export type ProductDiagnostic = {
  product: "gbp" | "ga4" | "gsc" | "gmail" | "ads";
  label: string;
  steps: DiscoveryStep[];
  count: number;
  reason?: string; // set when count === 0
};

export type DiscoveredResource = {
  resource_type: GoogleResourceType;
  resource_id: string;
  display_name: string | null;
  metadata: Record<string, unknown>;
};

const MAX_BODY_PREVIEW = 800;

const SENSITIVE_KEYS = new Set([
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
  "developer-token",
  "authorization",
  "cookie",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) out[k] = "[redacted]";
      else out[k] = sanitize(v);
    }
    return out;
  }
  return value;
}

function previewBody(text: string): string {
  if (!text) return "";
  let clean = text;
  try {
    clean = JSON.stringify(sanitize(JSON.parse(text)));
  } catch {
    // not JSON — keep raw
  }
  return clean.length > MAX_BODY_PREVIEW ? `${clean.slice(0, MAX_BODY_PREVIEW)}…[truncated]` : clean;
}

async function callStep<T>(
  label: string,
  url: string,
  accessToken: string,
  extraHeaders?: Record<string, string>,
): Promise<{ step: DiscoveryStep; parsed: T | null }> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", ...(extraHeaders ?? {}) },
    });
    const text = await res.text();
    const bodyPreview = previewBody(text);
    let parsed: T | null = null;
    if (res.ok && text) {
      try { parsed = JSON.parse(text) as T; } catch { parsed = null; }
    }
    const step: DiscoveryStep = {
      label,
      url,
      status: res.status,
      ok: res.ok,
      bodyPreview,
      count: 0,
    };
    if (!res.ok) {
      step.note = explainHttpError(res.status, text);
    }
    return { step, parsed };
  } catch (e) {
    return {
      step: {
        label,
        url,
        status: null,
        ok: false,
        bodyPreview: "",
        count: 0,
        note: `Network error: ${e instanceof Error ? e.message : String(e)}`,
      },
      parsed: null,
    };
  }
}

function explainHttpError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 401) return "401 Unauthorized — token invalid or expired; reconnect the Google account.";
  if (status === 403) {
    if (lower.includes("insufficient") || lower.includes("scope")) {
      return "403 Forbidden — the required OAuth scope was not granted. Disconnect and reconnect, and approve every permission.";
    }
    if (lower.includes("developer-token") || lower.includes("developer token")) {
      return "403 Forbidden — Google Ads developer token missing or not approved.";
    }
    if (lower.includes("api has not been used") || lower.includes("has not been enabled")) {
      return "403 Forbidden — API is not enabled in the Google Cloud project. Enable it in APIs & Services.";
    }
    return "403 Forbidden — the connected account lacks permission on this resource.";
  }
  if (status === 404) return "404 Not Found — endpoint or resource unavailable for this account.";
  if (status === 429) return "429 Rate limited by Google.";
  if (status >= 500) return `${status} Google server error — try again shortly.`;
  return `HTTP ${status}`;
}

// Rate-limit-aware fetch: honors Retry-After on 429/503 and falls back to
// exponential backoff. Also retries transient 5xx errors. Used for GBP where
// Google's per-minute quotas are very low.
async function fetchWithRateLimit(
  url: string,
  init: RequestInit,
  opts: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number; logPrefix?: string } = {},
): Promise<{ response: Response; text: string; attempts: number; waitedMs: number }> {
  const maxRetries = opts.maxRetries ?? 4;
  const baseDelay = opts.baseDelayMs ?? 1000;
  const maxDelay = opts.maxDelayMs ?? 16000;
  const prefix = opts.logPrefix ?? "[rate-limit]";
  let attempt = 0;
  let waitedMs = 0;
  while (true) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status < 500) {
      const text = await res.text();
      return { response: res, text, attempts: attempt + 1, waitedMs };
    }
    // Drain body so we can log it but still retry.
    const text = await res.text();
    if (attempt >= maxRetries) {
      return { response: res, text, attempts: attempt + 1, waitedMs };
    }
    const retryAfter = res.headers.get("Retry-After");
    let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    if (retryAfter) {
      const secs = parseInt(retryAfter, 10);
      if (!Number.isNaN(secs) && secs > 0) delay = Math.min(secs * 1000, 60000);
    }
    // Add jitter to avoid thundering-herd on retries.
    delay += Math.floor(Math.random() * 250);
    console.log(`${prefix} ${res.status} on ${url} — attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms${retryAfter ? ` (Retry-After: ${retryAfter})` : " (exp backoff)"}`);
    await new Promise((r) => setTimeout(r, delay));
    waitedMs += delay;
    attempt++;
  }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ---- Google Business Profile ----
// Diagnostic-only: emit the full redacted raw JSON per request so we can pinpoint
// exactly which step returns zero results. Parsing is unchanged.
async function discoverGbp(accessToken: string): Promise<{ resources: DiscoveredResource[]; diag: ProductDiagnostic }> {
  const resources: DiscoveredResource[] = [];
  const steps: DiscoveryStep[] = [];

  // Widen preview cap for GBP steps so the raw accounts/locations JSON is
  // visible in Diagnostics even when several items are returned.
  const GBP_PREVIEW_CAP = 8000;
  const widen = (step: DiscoveryStep, rawText: string) => {
    let clean = rawText ?? "";
    try { clean = JSON.stringify(sanitize(JSON.parse(rawText)), null, 2); } catch { /* keep raw */ }
    step.bodyPreview = clean.length > GBP_PREVIEW_CAP
      ? `${clean.slice(0, GBP_PREVIEW_CAP)}…[truncated]`
      : clean;
  };

  // --- Step 1: list accounts ---
  const accountsUrl = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
  let accountsRawText = "";
  let accountsParsed: { accounts?: Array<{ name: string; accountName?: string; type?: string }> } | null = null;
  const accStep: DiscoveryStep = { label: "List GBP accounts", url: accountsUrl, status: null, ok: false, bodyPreview: "", count: 0 };
  try {
    const { response: res, text, attempts, waitedMs } = await fetchWithRateLimit(
      accountsUrl,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
      { logPrefix: "[gbp-discovery]" },
    );
    accountsRawText = text;
    accStep.status = res.status;
    accStep.ok = res.ok;
    widen(accStep, accountsRawText);
    if (res.ok && accountsRawText) {
      try { accountsParsed = JSON.parse(accountsRawText); } catch { accountsParsed = null; }
    }
    if (!res.ok) {
      accStep.note = `${explainHttpError(res.status, accountsRawText)} (after ${attempts} attempt(s), waited ${waitedMs}ms for rate limit)`;
    } else if (attempts > 1) {
      accStep.note = `Succeeded after ${attempts} attempt(s), waited ${waitedMs}ms for rate limit.`;
    }
    console.log(`[gbp-discovery] GET ${accountsUrl} -> status=${res.status} attempts=${attempts} waitedMs=${waitedMs}`);
    console.log(`[gbp-discovery] accounts raw body (redacted):\n${accStep.bodyPreview}`);
  } catch (e) {
    accStep.note = `Network error: ${e instanceof Error ? e.message : String(e)}`;
    console.log(`[gbp-discovery] GET ${accountsUrl} network error: ${accStep.note}`);
  }
  const accounts = accountsParsed?.accounts ?? [];
  accStep.count = accounts.length;
  if (accStep.ok && accounts.length === 0) {
    accStep.note = `Accounts endpoint returned HTTP 200 with an empty/absent "accounts" array. Raw body shown above. This means the connected Google user is not an owner/manager of any Business Profile account.`;
  }
  steps.push(accStep);
  console.log(`[gbp-discovery] parsed ${accounts.length} account(s): ${accounts.map((a) => a.name).join(", ") || "(none)"}`);

  // --- Step 2: per-account locations ---
  // Pace requests to stay under GBP's aggressive per-minute quotas (which
  // triggered the earlier 429s). Sequential + inter-request delay + rate-limit
  // aware retries with Retry-After / exponential backoff.
  const INTER_REQUEST_DELAY_MS = 1200;
  let idx = 0;
  for (const acc of accounts) {
    console.log(`[gbp-discovery] processing account.name="${acc.name}" accountName="${acc.accountName ?? ""}" type="${acc.type ?? ""}"`);
    resources.push({
      resource_type: "gbp_account",
      resource_id: acc.name,
      display_name: acc.accountName ?? acc.name,
      metadata: { type: acc.type },
    });

    if (idx > 0) await sleep(INTER_REQUEST_DELAY_MS);
    idx++;

    const locUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,storefrontAddress`;
    const locStep: DiscoveryStep = {
      label: `List locations for ${acc.accountName ?? acc.name} (${acc.name})`,
      url: locUrl,
      status: null,
      ok: false,
      bodyPreview: "",
      count: 0,
    };
    let locParsed: { locations?: Array<{ name: string; title?: string; storefrontAddress?: unknown }> } | null = null;
    try {
      const { response: res, text: rawText, attempts, waitedMs } = await fetchWithRateLimit(
        locUrl,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
        { logPrefix: "[gbp-discovery]" },
      );
      locStep.status = res.status;
      locStep.ok = res.ok;
      widen(locStep, rawText);
      if (res.ok && rawText) {
        try { locParsed = JSON.parse(rawText); } catch { locParsed = null; }
      }
      if (!res.ok) {
        locStep.note = `${explainHttpError(res.status, rawText)} (after ${attempts} attempt(s), waited ${waitedMs}ms for rate limit)`;
      } else if (attempts > 1) {
        locStep.note = `Succeeded after ${attempts} attempt(s), waited ${waitedMs}ms for rate limit.`;
      }
      console.log(`[gbp-discovery] GET ${locUrl} -> status=${res.status} attempts=${attempts} waitedMs=${waitedMs}`);
      console.log(`[gbp-discovery] locations raw body for ${acc.name} (redacted):\n${locStep.bodyPreview}`);
    } catch (e) {
      locStep.note = `Network error: ${e instanceof Error ? e.message : String(e)}`;
      console.log(`[gbp-discovery] GET ${locUrl} network error: ${locStep.note}`);
    }
    const locs = locParsed?.locations ?? [];
    locStep.count = locs.length;
    if (locStep.ok && locs.length === 0) {
      locStep.note = `Locations endpoint returned HTTP 200 with an empty/absent "locations" array for ${acc.name}. Raw body shown above. This account has no Business Profile locations visible to the connected user.`;
    }
    steps.push(locStep);
    console.log(`[gbp-discovery] parsed ${locs.length} location(s) for ${acc.name}`);

    for (const loc of locs) {
      resources.push({
        resource_type: "gbp_location",
        resource_id: loc.name,
        display_name: loc.title ?? loc.name,
        metadata: { account: acc.name, storefrontAddress: loc.storefrontAddress },
      });
    }
  }

  const diag: ProductDiagnostic = {
    product: "gbp",
    label: "Google Business Profile",
    steps,
    count: resources.length,
  };
  if (resources.length === 0) {
    const firstErr = steps.find((s) => !s.ok);
    if (firstErr) {
      diag.reason = `${firstErr.label}: ${firstErr.note ?? `HTTP ${firstErr.status}`}`;
    } else if (accounts.length === 0) {
      diag.reason = `Accounts endpoint returned HTTP 200 but "accounts" was empty/absent. Raw body: ${accStep.bodyPreview || "(empty)"}`;
    } else {
      const emptyLocSteps = steps.filter((s) => s.label.startsWith("List locations") && s.ok && s.count === 0);
      diag.reason = `Accounts returned ${accounts.length} account(s), but every locations call returned 0. Failing steps: ${emptyLocSteps.map((s) => s.url).join(" | ")}`;
    }
  }
  return { resources, diag };
}

// ---- Google Analytics 4 ----
async function discoverGa4(accessToken: string): Promise<{ resources: DiscoveredResource[]; diag: ProductDiagnostic }> {
  const resources: DiscoveredResource[] = [];
  const steps: DiscoveryStep[] = [];
  const call = await callStep<{
    accountSummaries?: Array<{
      displayName?: string;
      account?: string;
      propertySummaries?: Array<{ property: string; displayName?: string; propertyType?: string }>;
    }>;
  }>(
    "List GA4 account summaries",
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    accessToken,
  );
  const summaries = call.parsed?.accountSummaries ?? [];
  for (const acc of summaries) {
    for (const p of acc.propertySummaries ?? []) {
      resources.push({
        resource_type: "ga4_property",
        resource_id: p.property,
        display_name: p.displayName ?? p.property,
        metadata: { account: acc.account, accountName: acc.displayName, propertyType: p.propertyType },
      });
    }
  }
  call.step.count = resources.length;
  steps.push(call.step);

  const diag: ProductDiagnostic = { product: "ga4", label: "Google Analytics 4", steps, count: resources.length };
  if (resources.length === 0) {
    if (!call.step.ok) diag.reason = call.step.note ?? `HTTP ${call.step.status}`;
    else if (summaries.length === 0) diag.reason = "No GA4 accounts are visible to this Google user. Grant the user at least Viewer on a GA4 property.";
    else diag.reason = "GA4 accounts exist but contain no properties visible to this user.";
  }
  return { resources, diag };
}

// ---- Search Console ----
async function discoverGsc(accessToken: string): Promise<{ resources: DiscoveredResource[]; diag: ProductDiagnostic }> {
  const resources: DiscoveredResource[] = [];
  const call = await callStep<{ siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }> }>(
    "List Search Console sites",
    "https://searchconsole.googleapis.com/webmasters/v3/sites",
    accessToken,
  );
  const sites = call.parsed?.siteEntry ?? [];
  for (const s of sites) {
    resources.push({
      resource_type: "gsc_site",
      resource_id: s.siteUrl,
      display_name: s.siteUrl,
      metadata: { permissionLevel: s.permissionLevel },
    });
  }
  call.step.count = resources.length;
  const steps = [call.step];
  const diag: ProductDiagnostic = { product: "gsc", label: "Search Console", steps, count: resources.length };
  if (resources.length === 0) {
    if (!call.step.ok) diag.reason = call.step.note ?? `HTTP ${call.step.status}`;
    else diag.reason = "This Google user has no verified Search Console properties. Verify a site in Search Console first.";
  }
  return { resources, diag };
}

// ---- Gmail ----
async function discoverGmail(accessToken: string, email: string): Promise<{ resources: DiscoveredResource[]; diag: ProductDiagnostic }> {
  const call = await callStep<{ emailAddress?: string; messagesTotal?: number }>(
    "Fetch Gmail profile",
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    accessToken,
  );
  const md: Record<string, unknown> = { verified: call.step.ok };
  if (call.parsed?.messagesTotal !== undefined) md.messagesTotal = call.parsed.messagesTotal;
  const resources: DiscoveredResource[] = [{
    resource_type: "gmail_address",
    resource_id: call.parsed?.emailAddress ?? email,
    display_name: email,
    metadata: md,
  }];
  call.step.count = 1;
  const diag: ProductDiagnostic = {
    product: "gmail",
    label: "Gmail",
    steps: [call.step],
    count: 1,
  };
  if (!call.step.ok) {
    diag.reason = call.step.note ?? `HTTP ${call.step.status}. Address recorded from OAuth identity only.`;
  }
  return { resources, diag };
}

// ---- Google Ads ----
async function discoverAds(accessToken: string): Promise<{ resources: DiscoveredResource[]; diag: ProductDiagnostic }> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) {
    return {
      resources: [],
      diag: {
        product: "ads",
        label: "Google Ads",
        steps: [{
          label: "List accessible Ads customers",
          url: "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
          status: null,
          ok: false,
          bodyPreview: "",
          count: 0,
          note: "Skipped — GOOGLE_ADS_DEVELOPER_TOKEN secret is not set. Ads API cannot be called without an approved developer token.",
        }],
        count: 0,
        reason: "Missing GOOGLE_ADS_DEVELOPER_TOKEN. Add an approved Google Ads developer token in Secrets Manager.",
      },
    };
  }
  const call = await callStep<{ resourceNames?: string[] }>(
    "List accessible Ads customers",
    "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
    accessToken,
    { "developer-token": devToken },
  );
  const names = call.parsed?.resourceNames ?? [];
  const resources: DiscoveredResource[] = names.map((name) => ({
    resource_type: "ads_customer" as const,
    resource_id: name,
    display_name: name,
    metadata: {},
  }));
  call.step.count = resources.length;
  const diag: ProductDiagnostic = { product: "ads", label: "Google Ads", steps: [call.step], count: resources.length };
  if (resources.length === 0) {
    if (!call.step.ok) diag.reason = call.step.note ?? `HTTP ${call.step.status}`;
    else diag.reason = "Developer token accepted but no Ads customer accounts are accessible to this Google user.";
  }
  return { resources, diag };
}

export async function discoverAll(accessToken: string, email: string): Promise<{
  resources: DiscoveredResource[];
  perProduct: Record<string, number>;
  diagnostics: ProductDiagnostic[];
}> {
  const [gbp, ga4, gsc, gmail, ads] = await Promise.all([
    discoverGbp(accessToken),
    discoverGa4(accessToken),
    discoverGsc(accessToken),
    discoverGmail(accessToken, email),
    discoverAds(accessToken),
  ]);
  const diagnostics = [gbp.diag, ga4.diag, gsc.diag, gmail.diag, ads.diag];
  const resources = [...gbp.resources, ...ga4.resources, ...gsc.resources, ...gmail.resources, ...ads.resources];
  const perProduct = {
    gbp: gbp.resources.length,
    ga4: ga4.resources.length,
    gsc: gsc.resources.length,
    gmail: gmail.resources.length,
    ads: ads.resources.length,
  };
  // Server-side log for observability.
  for (const d of diagnostics) {
    console.log(`[google-discovery] ${d.product} count=${d.count}${d.reason ? ` reason=${d.reason}` : ""}`);
    for (const s of d.steps) {
      console.log(`  [${d.product}] ${s.label} status=${s.status} ok=${s.ok} count=${s.count}${s.note ? ` note=${s.note}` : ""}`);
    }
  }
  return { resources, perProduct, diagnostics };
}
