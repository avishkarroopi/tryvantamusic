import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app-shell";
import { marketingIntel } from "@/lib/intel.functions";
import { Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/intelligence")({
  loader: ({ context }) => context.queryClient.ensureQueryData(intelOpts(90)),
  component: IntelPage,
});

const intelOpts = (days: number) =>
  queryOptions({
    queryKey: ["intel", days],
    queryFn: () => marketingIntel({ data: { days } }),
  });

function IntelPage() {
  const [days, setDays] = useState(90);
  const { data } = useSuspenseQuery(intelOpts(days));
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;
  const fmtNum = (n: number) => n.toLocaleString();

  return (
    <>
      <PageHeader
        eyebrow="V3 · Marketing Intelligence"
        title="Marketing Intelligence"
        description="Which sources, campaigns, cities, and instruments convert the best."
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {[7, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Leads" value={fmtNum(data.totals.leads)} />
          <Kpi label="Enrollments" value={fmtNum(data.totals.enrollments)} />
          <Kpi label="Revenue" value={data.totals.revenue.toLocaleString()} tint="primary" />
          <Kpi label="Conv rate" value={data.totals.leads > 0 ? fmtPct((data.totals.enrollments / data.totals.leads) * 100) : "—"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PerfCard title="Source performance" rows={data.bySource} />
          <PerfCard title="Campaign performance" rows={data.byCampaign} />
          <PerfCard title="Country performance" rows={data.byCountry} />
          <PerfCard title="City performance" rows={data.byCity} />
          <PerfCard title="Instrument performance" rows={data.byInstrument} />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Label conversion</div>
            <div className="space-y-2">
              {data.byLabel.length === 0 ? (
                <div className="text-sm text-muted-foreground">No qualified leads yet.</div>
              ) : data.byLabel.slice(0, 12).map((b) => (
                <div key={b.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="uppercase text-xs tracking-wider">{b.key.replace(/_/g, " ")}</span>
                  <div className="flex gap-3 tabular-nums text-xs text-muted-foreground">
                    <span>{b.leads} leads</span>
                    <span className="font-semibold text-primary">{fmtPct(b.conversionRate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-4">
            <TrendingUp className="h-3.5 w-3.5" /> Conversion funnel
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {[
              ["New", data.funnel.new],
              ["Contacted", data.funnel.contacted],
              ["Qualified", data.funnel.qualified],
              ["Assessment", data.funnel.assessment],
              ["Pending", data.funnel.enrollment_pending],
              ["Enrolled", data.funnel.enrolled],
              ["Lost", data.funnel.lost],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-md border border-border p-3 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                <div className="text-xl font-bold tabular-nums">{v as number}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" /> AI insights (auto)
          </div>
          <p className="text-sm text-muted-foreground">
            Insights are surfaced on the <a href="/command" className="text-primary underline">Growth Command Center</a>. Trigger a regeneration from that page.
          </p>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tint }: { label: string; value: string; tint?: "primary" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${tint === "primary" ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

type Row = { key: string; leads: number; qualified?: number; enrolled: number; revenue: number; avgScore?: number; conversionRate: number };
function PerfCard({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">No data yet.</div>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 8).map((r) => (
            <div key={r.key} className="grid grid-cols-6 gap-2 items-center text-sm">
              <div className="col-span-2 truncate font-medium">{r.key}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{r.leads} leads</div>
              <div className="text-xs text-muted-foreground tabular-nums">{r.enrolled} enrl</div>
              <div className="text-xs text-muted-foreground tabular-nums">{r.revenue.toLocaleString()}</div>
              <div className="text-xs font-semibold text-primary tabular-nums text-right">{r.conversionRate.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
