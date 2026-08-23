import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const dashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: leads, error } = await supabase.from("leads").select("*");
    if (error) throw new Error(error.message);
    const { data: labels } = await supabase.from("lead_label_assignments").select("label, lead_id");

    const rows = leads ?? [];
    const now = Date.now();

    const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
    const hotCount = rows.filter((r) => (r.score ?? 0) >= 85).length;
    const warmCount = rows.filter((r) => (r.score ?? 0) >= 60 && (r.score ?? 0) < 85).length;
    const coldCount = rows.filter((r) => (r.score ?? 0) < 60).length;
    const dormantCount = rows.filter(
      (r) =>
        new Date(r.last_activity_at).getTime() < now - 30 * 24 * 60 * 60 * 1000 &&
        r.status !== "enrolled" && r.status !== "lost",
    ).length;

    const countBy = <T,>(arr: T[], key: (v: T) => string | null | undefined) => {
      const map = new Map<string, number>();
      arr.forEach((v) => {
        const k = key(v);
        if (!k) return;
        map.set(k, (map.get(k) ?? 0) + 1);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 6);
    };

    const sourceDist = countBy(rows, (r) => r.source);
    const countryDist = countBy(rows, (r) => r.country);
    const instrumentDist = countBy(rows, (r) => r.instrument);

    return {
      totals: {
        all: rows.length,
        new: byStatus("new"),
        contacted: byStatus("contacted"),
        qualified: byStatus("qualified"),
        assessmentScheduled: byStatus("assessment_scheduled"),
        enrolled: byStatus("enrolled"),
        lost: byStatus("lost"),
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
        dormant: dormantCount,
      },
      distributions: { source: sourceDist, country: countryDist, instrument: instrumentDist },
      recentHot: rows
        .filter((r) => (r.score ?? 0) >= 70)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5),
      totalLabels: labels?.length ?? 0,
    };
  });
