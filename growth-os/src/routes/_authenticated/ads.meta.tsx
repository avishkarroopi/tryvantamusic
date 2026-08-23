import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listAdEntities, listAdRecommendations, createAdEntity, generateAdRecommendations, decideAdRecommendation } from "@/lib/ads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Check, X, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ads/meta")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(entOpts("meta")),
      context.queryClient.ensureQueryData(recOpts("meta")),
    ]);
  },
  component: () => <AdsSurface platform="meta" />,
});
export const entOpts = (platform: "meta" | "google") => queryOptions({ queryKey: ["ads", platform, "entities"], queryFn: () => listAdEntities({ data: { platform } }) });
export const recOpts = (platform: "meta" | "google") => queryOptions({ queryKey: ["ads", platform, "recos"], queryFn: () => listAdRecommendations({ data: { platform } }) });

export function AdsSurface({ platform }: { platform: "meta" | "google" }) {
  const { data: entities } = useSuspenseQuery(entOpts(platform));
  const { data: recos } = useSuspenseQuery(recOpts(platform));
  const qc = useQueryClient();
  const createFn = useServerFn(createAdEntity);
  const genFn = useServerFn(generateAdRecommendations);
  const decideFn = useServerFn(decideAdRecommendation);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ level: platform === "google" ? "keyword" : "campaign", name: "", budget: "", impressions: "", clicks: "", conversions: "", spend: "" });

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ads", platform] }); setOpen(false); toast.success("Entity added"); setForm({ ...form, name: "", budget: "", impressions: "", clicks: "", conversions: "", spend: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const generate = useMutation({
    mutationFn: genFn,
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["ads", platform, "recos"] }); toast.success(`${r.created} recommendation(s) generated`); },
    onError: (e) => toast.error(e.message),
  });
  const decide = useMutation({
    mutationFn: decideFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ads", platform, "recos"] }),
    onError: (e) => toast.error(e.message),
  });

  const totalSpend = entities.reduce((a, e) => a + Number((e.metrics as Record<string, number>)?.spend ?? 0), 0);
  const totalConv = entities.reduce((a, e) => a + Number((e.metrics as Record<string, number>)?.conversions ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-3 gap-3 flex-1 max-w-md">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Entities</div>
            <div className="font-display text-xl font-bold tabular-nums">{entities.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Spend</div>
            <div className="font-display text-xl font-bold tabular-nums">₹{totalSpend.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Conversions</div>
            <div className="font-display text-xl font-bold tabular-nums text-primary">{totalConv}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={generate.isPending || entities.length === 0} onClick={() => generate.mutate({ data: { platform } })}>
            <Sparkles className="h-4 w-4" /> Generate recos
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add entity</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add {platform} entity</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <F label="Level">
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
                    {(platform === "meta" ? ["campaign", "adset", "ad"] : ["campaign", "ad_group", "keyword"]).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </F>
                <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
                <F label="Budget (optional)"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></F>
                <F label="Spend"><Input type="number" value={form.spend} onChange={(e) => setForm({ ...form, spend: e.target.value })} /></F>
                <F label="Impressions"><Input type="number" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: e.target.value })} /></F>
                <F label="Clicks"><Input type="number" value={form.clicks} onChange={(e) => setForm({ ...form, clicks: e.target.value })} /></F>
                <F label="Conversions"><Input type="number" value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} /></F>
              </div>
              <div className="flex justify-end">
                <Button disabled={!form.name || create.isPending}
                  onClick={() => {
                    const imp = Number(form.impressions || 0);
                    const clk = Number(form.clicks || 0);
                    const metrics = { impressions: imp, clicks: clk, conversions: Number(form.conversions || 0), spend: Number(form.spend || 0), ctr: imp > 0 ? (clk / imp) * 100 : 0 };
                    create.mutate({ data: { platform, level: form.level as "campaign", name: form.name, budget: form.budget ? Number(form.budget) : null, metrics } });
                  }}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Recommendations</span>
          <Badge variant="outline" className="text-[10px] ml-auto">Human approval required</Badge>
        </div>
        {recos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No recommendations yet. Add entities with metrics and click "Generate recos".</div>
        ) : (
          <div className="divide-y divide-border">
            {recos.map((r) => (
              <div key={r.id} className="p-4 flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <Badge variant={r.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{r.priority}</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.kind.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.rationale}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => decide.mutate({ data: { id: r.id, decision: "dismiss" } })}><X className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => decide.mutate({ data: { id: r.id, decision: "approve" } })}><Check className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" onClick={() => decide.mutate({ data: { id: r.id, decision: "apply" } })}><Rocket className="h-3.5 w-3.5" /> Applied</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entities table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border text-sm font-semibold">Tracked {platform === "meta" ? "campaigns & ads" : "campaigns & keywords"}</div>
        {entities.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No entities. Add campaigns/ads to start tracking.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Level</th>
                  <th className="text-right px-4 py-2 font-medium">Impr.</th>
                  <th className="text-right px-4 py-2 font-medium">Clicks</th>
                  <th className="text-right px-4 py-2 font-medium">CTR</th>
                  <th className="text-right px-4 py-2 font-medium">Conv</th>
                  <th className="text-right px-4 py-2 font-medium">Spend</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((e) => {
                  const m = (e.metrics as Record<string, number>) ?? {};
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{e.name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{e.level}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(m.impressions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(m.clicks ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(m.ctr ?? 0).toFixed(2)}%</td>
                      <td className="px-4 py-2 text-right tabular-nums text-primary">{Number(m.conversions ?? 0)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">₹{Number(m.spend ?? 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>; }
