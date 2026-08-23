import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { dashboardMetrics } from "@/lib/dashboard.functions";
import { Users, Flame, Snowflake, RefreshCcw, Trophy, XCircle, ArrowUpRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
} from "recharts";

const metricsOpts = queryOptions({
  queryKey: ["dashboard-metrics"],
  queryFn: () => dashboardMetrics(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(metricsOpts),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-accent)",
  "var(--color-muted-foreground)",
];

function KpiCard({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: typeof Users; tone?: "hot" | "warm" | "cold" | "success" | "danger" }) {
  const toneCls =
    tone === "hot" ? "text-secondary bg-secondary/10"
    : tone === "warm" ? "text-primary bg-primary/15"
    : tone === "cold" ? "text-info bg-info/10"
    : tone === "success" ? "text-success bg-success/10"
    : tone === "danger" ? "text-destructive bg-destructive/10"
    : "text-muted-foreground bg-muted";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function DashboardPage() {
  const { data } = useSuspenseQuery(metricsOpts);
  const { totals, distributions, recentHot } = data;

  return (
    <>
      <PageHeader
        eyebrow="Founder view"
        title="Growth Dashboard"
        description="Every lead. Every source. Every opportunity — one view."
        actions={
          <Link
            to="/leads/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            New lead
          </Link>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Total leads" value={totals.all} icon={Users} />
          <KpiCard label="Hot" value={totals.hot} icon={Flame} tone="hot" />
          <KpiCard label="Warm" value={totals.warm} icon={Flame} tone="warm" />
          <KpiCard label="Cold" value={totals.cold} icon={Snowflake} tone="cold" />
          <KpiCard label="Enrolled" value={totals.enrolled} icon={Trophy} tone="success" />
          <KpiCard label="Dormant" value={totals.dormant} icon={RefreshCcw} tone="danger" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Conversion pipeline</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "New", value: totals.new },
                { name: "Contacted", value: totals.contacted },
                { name: "Qualified", value: totals.qualified },
                { name: "Assessment", value: totals.assessmentScheduled },
                { name: "Enrolled", value: totals.enrolled },
                { name: "Lost", value: totals.lost },
              ]}>
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
            <h3 className="font-display font-semibold mb-4">Sources</h3>
            {distributions.source.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={distributions.source} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {distributions.source.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DistCard title="Countries" items={distributions.country} />
          <DistCard title="Instruments" items={distributions.instrument} />
          <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Top hot leads</h3>
              <Link to="/leads" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                All <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {recentHot.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No qualified leads yet.</div>
            ) : (
              <div className="space-y-2">
                {recentHot.map((l) => (
                  <Link key={l.id} to="/leads/$id" params={{ id: l.id }} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{l.name ?? l.email ?? l.phone ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.country ?? "—"} · {l.instrument ?? "—"}</div>
                    </div>
                    <div className="text-sm font-bold tabular-nums text-primary">{l.score}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DistCard({ title, items }: { title: string; items: { name: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
      <h3 className="font-display font-semibold mb-3">{title}</h3>
      {items.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate">{i.name}</span>
                <span className="tabular-nums text-muted-foreground">{i.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand-gradient" style={{ width: `${(i.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="text-sm text-muted-foreground py-10 text-center">
      No data yet.
      <div className="mt-1 text-xs">Capture your first lead to see charts.</div>
    </div>
  );
}
