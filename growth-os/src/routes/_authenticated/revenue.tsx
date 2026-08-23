import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { revenueIntel, logEnrollment } from "@/lib/intel.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/revenue")({
  loader: ({ context }) => context.queryClient.ensureQueryData(revOpts(90)),
  component: RevenuePage,
});

const revOpts = (days: number) =>
  queryOptions({
    queryKey: ["revenue", days],
    queryFn: () => revenueIntel({ data: { days } }),
  });

function RevenuePage() {
  const [days, setDays] = useState(90);
  const { data } = useSuspenseQuery(revOpts(days));
  const qc = useQueryClient();
  const fn = useServerFn(logEnrollment);
  const [form, setForm] = useState({ amount: "", currency: "INR", program: "", instrument: "", country: "", source: "", campaign: "" });
  const [open, setOpen] = useState(false);
  const mut = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue"] });
      setOpen(false);
      setForm({ amount: "", currency: "INR", program: "", instrument: "", country: "", source: "", campaign: "" });
      toast.success("Enrollment recorded");
    },
    onError: (e) => toast.error(e.message),
  });

  const fmt = (n: number | null) => n === null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const money = (n: number) => `₹${n.toLocaleString()}`;

  return (
    <>
      <PageHeader
        eyebrow="V7 · Revenue Intelligence"
        title="Revenue Intelligence"
        description="Track revenue, ROI, and pipeline value across campaigns, sources, and programs."
        actions={
          <>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              {[7, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4" /> Log enrollment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log enrollment</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
                  <F label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></F>
                  <F label="Program"><Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></F>
                  <F label="Instrument"><Input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} /></F>
                  <F label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></F>
                  <F label="Source"><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="website / facebook_ads / …" /></F>
                  <F label="Campaign"><Input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} /></F>
                </div>
                <div className="flex justify-end">
                  <Button
                    disabled={!form.amount || mut.isPending}
                    onClick={() => mut.mutate({ data: { amount: Number(form.amount), currency: form.currency, program: form.program || null, instrument: form.instrument || null, country: form.country || null, source: form.source || null, campaign: form.campaign || null } })}
                  >
                    {mut.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Revenue" value={money(data.totals.revenue)} tint="primary" />
          <Kpi label="Enrollments" value={data.totals.enrollments.toLocaleString()} />
          <Kpi label="AOV" value={money(Math.round(data.totals.aov))} />
          <Kpi label="Pipeline value" value={money(Math.round(data.pipelineValue))} />
          <Kpi label="Marketing cost" value={money(data.totals.cost)} />
          <Kpi label="ROI" value={data.totals.roi === null ? "—" : `${fmt(data.totals.roi)}%`} />
          <Kpi label="CPL" value={data.totals.cpl === null ? "—" : money(Math.round(data.totals.cpl))} />
          <Kpi label="CPE" value={data.totals.cpe === null ? "—" : money(Math.round(data.totals.cpe))} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevCard title="Revenue by instrument" rows={data.byInstrument} />
          <RevCard title="Revenue by country" rows={data.byCountry} />
          <RevCard title="Revenue by source" rows={data.bySource} />
          <RevCard title="Revenue by campaign" rows={data.byCampaign} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Recent enrollments</div>
          {data.recent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No enrollments logged yet.</div>
          ) : (
            <div className="space-y-1">
              {data.recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold tabular-nums">{Number(e.amount).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">· {e.instrument ?? "—"} · {e.country ?? "—"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tint }: { label: string; value: string; tint?: "primary" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold tabular-nums ${tint === "primary" ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
function RevCard({ title, rows }: { title: string; rows: { key: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {rows.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No data.</div> : (
        <div className="space-y-2">
          {rows.slice(0, 8).map((r) => (
            <div key={r.key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="truncate">{r.key}</span>
                <span className="tabular-nums font-medium">₹{r.value.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand-gradient" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
