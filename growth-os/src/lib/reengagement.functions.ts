import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reengagementStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const now = new Date();
    const dormantAt = (days: number) =>
      new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    const [dormant30, dormant60, dormant90, dormant180, dormant365, sends] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).lt("last_activity_at", dormantAt(30)).not("status", "in", "(enrolled,lost)"),
      supabase.from("leads").select("*", { count: "exact", head: true }).lt("last_activity_at", dormantAt(60)).not("status", "in", "(enrolled,lost)"),
      supabase.from("leads").select("*", { count: "exact", head: true }).lt("last_activity_at", dormantAt(90)).not("status", "in", "(enrolled,lost)"),
      supabase.from("leads").select("*", { count: "exact", head: true }).lt("last_activity_at", dormantAt(180)).not("status", "in", "(enrolled,lost)"),
      supabase.from("leads").select("*", { count: "exact", head: true }).lt("last_activity_at", dormantAt(365)).not("status", "in", "(enrolled,lost)"),
      supabase.from("reengagement_sends").select("*"),
    ]);

    const totalSent = sends.data?.length ?? 0;
    const recovered = sends.data?.filter((s) => s.recovered).length ?? 0;
    const revenue = (sends.data ?? [])
      .filter((s) => s.recovered)
      .reduce((acc, s) => acc + Number(s.revenue_recovered ?? 0), 0);

    return {
      buckets: {
        d30: dormant30.count ?? 0,
        d60: dormant60.count ?? 0,
        d90: dormant90.count ?? 0,
        d180: dormant180.count ?? 0,
        d365: dormant365.count ?? 0,
      },
      totalSent,
      recovered,
      recoveryRate: totalSent ? Math.round((recovered / totalSent) * 100) : 0,
      revenueRecovered: revenue,
    };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reengagement_campaigns").select("*").order("trigger_days");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listDormantLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ days: z.number().int().min(1).max(3650).default(30) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const cutoff = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("leads").select("*")
      .lt("last_activity_at", cutoff)
      .not("status", "in", "(enrolled,lost)")
      .order("last_activity_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
