// ============================================================================
// Phase 20 — Operations dashboard server functions. Combines worker health
// (Phase 19), the approval queue (Phase 5), and SEO/keyword highlights
// (Phase 10-13) into one page's worth of data -- reuses every underlying
// function/table as-is, no new business logic here beyond assembling reads
// and dispatching an approved action to the right provider client.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runApprovedMetaAction } from "@/lib/meta-ads.server";
import { runApprovedGoogleAdsAction } from "@/lib/google-ads.server";

export const getOperationsOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    const [heartbeatRes, approvalsRes, gapsRes, keywordsRes] = await Promise.all([
      supa.from("worker_heartbeats").select("*").eq("id", "singleton").maybeSingle(),
      supa
        .from("approval_requests")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(50),
      supa
        .from("seo_content_gaps")
        .select("*, keywords(keyword)")
        .eq("status", "open")
        .order("opportunity_score", { ascending: false })
        .limit(10),
      supa
        .from("keywords")
        .select("keyword, our_position, opportunity_score, competitor_positions")
        .order("opportunity_score", { ascending: false })
        .limit(10),
    ]);

    const heartbeat = heartbeatRes.data as {
      status: string;
      last_tick_at: string | null;
      started_at: string;
      ticks: number;
      totals: Record<string, number>;
    } | null;
    const workerAlive =
      !!heartbeat?.last_tick_at &&
      (Date.now() - new Date(heartbeat.last_tick_at).getTime()) / 60_000 <= 5;

    return {
      worker: {
        alive: workerAlive,
        status: heartbeat?.status ?? "never_seen",
        startedAt: heartbeat?.started_at ?? null,
        lastTickAt: heartbeat?.last_tick_at ?? null,
        ticks: heartbeat?.ticks ?? 0,
        totals: heartbeat?.totals ?? {},
      },
      approvals: approvalsRes.data ?? [],
      contentGaps: gapsRes.data ?? [],
      keywords: keywordsRes.data ?? [],
    };
  });

/**
 * Dispatches an approved action to whichever provider client owns its
 * action_type prefix. This is the ONE place a human's "Execute" click in
 * the UI turns into a real API call -- deliberately kept as a thin router,
 * not a reimplementation of either client's execution logic.
 */
export const executeApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ approvalId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = context.supabase as any;
    const { data: approval, error } = await supa
      .from("approval_requests")
      .select("action_type")
      .eq("id", data.approvalId)
      .single();
    if (error) throw new Error(error.message);

    const actionType = approval.action_type as string;
    if (actionType.startsWith("meta.")) {
      const result = await runApprovedMetaAction(supa, data.approvalId);
      if (!result.ok) throw new Error(result.error);
      return { ok: true as const };
    }
    if (actionType.startsWith("google_ads.")) {
      // Executes using the reviewing human's own connected Google account
      // (context.userId) -- there is no separate "system" Google identity
      // in this architecture; Ads/GA4/GSC all ride on a real user's OAuth
      // connection (see google-integration/client.server.ts).
      const result = await runApprovedGoogleAdsAction(supa, data.approvalId, context.userId);
      if (!result.ok) throw new Error(result.error);
      return { ok: true as const };
    }
    throw new Error(`No execution handler registered for action_type "${actionType}".`);
  });
