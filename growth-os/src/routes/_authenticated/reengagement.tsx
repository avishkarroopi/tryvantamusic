import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app-shell";
import { reengagementStats, listDormantLeads } from "@/lib/reengagement.functions";
import { RefreshCcw, TrendingUp, DollarSign, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";

const statsOpts = queryOptions({
  queryKey: ["reengagement-stats"],
  queryFn: () => reengagementStats(),
});
const dormant30Opts = queryOptions({
  queryKey: ["dormant", 30],
  queryFn: () => listDormantLeads({ data: { days: 30 } }),
});

export const Route = createFileRoute("/_authenticated/reengagement")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(statsOpts),
      context.queryClient.ensureQueryData(dormant30Opts),
    ]),
  component: ReengagementPage,
});

function ReengagementPage() {
  const { data: stats } = useSuspenseQuery(statsOpts);
  const { data: dormant } = useSuspenseQuery(dormant30Opts);

  return (
    <>
      <PageHeader
        eyebrow="V5 Re-engagement agent"
        title="Recover dormant leads"
        description="Automated recovery across 30, 60, 90, 180, and 365-day thresholds."
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="Total dormant (30d+)" value={stats.buckets.d30} icon={RefreshCcw} />
          <Kpi label="Recovered" value={stats.recovered} icon={TrendingUp} />
          <Kpi label="Recovery rate" value={`${stats.recoveryRate}%`} icon={TrendingUp} />
          <Kpi label="Revenue recovered" value={`₹${stats.revenueRecovered.toLocaleString()}`} icon={DollarSign} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
          <h3 className="font-display font-semibold mb-4">Dormancy timeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { d: 30, label: "30 days", copy: "Friendly check-in" },
              { d: 60, label: "60 days", copy: "Program update" },
              { d: 90, label: "90 days", copy: "Success story" },
              { d: 180, label: "180 days", copy: "Special invitation" },
              { d: 365, label: "365 days", copy: "Reactivation" },
            ].map((b) => (
              <div key={b.d} className="rounded-lg border border-border p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{b.label}</div>
                <div className="font-display text-2xl font-bold mt-1 tabular-nums">
                  {stats.buckets[`d${b.d}` as "d30"]}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{b.copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Dormant queue (30+ days)</h3>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Send className="h-3.5 w-3.5" /> Queue campaign
            </button>
          </div>
          {dormant.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              🎉 No dormant leads. Your pipeline is fresh.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {dormant.map((l) => {
                const days = Math.floor(
                  (Date.now() - new Date(l.last_activity_at).getTime()) / (24 * 60 * 60 * 1000),
                );
                return (
                  <Link
                    key={l.id} to="/leads/$id" params={{ id: l.id }}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{l.name ?? l.email ?? l.phone ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.country ?? "—"} · {l.instrument ?? "—"} · last activity {days}d ago
                      </div>
                    </div>
                    <div className="text-xs font-bold text-secondary tabular-nums">{days}d</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof RefreshCcw }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
