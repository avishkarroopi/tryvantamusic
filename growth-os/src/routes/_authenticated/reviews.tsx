import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { listReviews, createReview, reviewMetrics, reviewTemplates } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Star, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(listOpts()),
      context.queryClient.ensureQueryData(metricsOpts()),
      context.queryClient.ensureQueryData(tplOpts()),
    ]);
  },
  component: ReviewsPage,
});

const listOpts = () => queryOptions({ queryKey: ["reviews", "list"], queryFn: () => listReviews({ data: {} }) });
const metricsOpts = () => queryOptions({ queryKey: ["reviews", "metrics"], queryFn: () => reviewMetrics({ data: {} }) });
const tplOpts = () => queryOptions({ queryKey: ["reviews", "templates"], queryFn: () => reviewTemplates() });

function ReviewsPage() {
  const { data: reviews } = useSuspenseQuery(listOpts());
  const { data: metrics } = useSuspenseQuery(metricsOpts());
  const { data: templates } = useSuspenseQuery(tplOpts());
  const qc = useQueryClient();
  const createFn = useServerFn(createReview);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: "google", rating: "5", content: "", reviewer_name: "", review_url: "" });

  const mut = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      setOpen(false);
      setForm({ platform: "google", rating: "5", content: "", reviewer_name: "", review_url: "" });
      toast.success("Review logged");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="V6 · Reviews & Reputation"
        title="Reviews & Reputation"
        description="Track reviews across Google, testimonials, and success stories."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Log review</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log review</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <F label="Platform"><Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></F>
                <F label="Rating (1–5)"><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></F>
                <F label="Reviewer name"><Input value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })} /></F>
                <F label="Review URL"><Input value={form.review_url} onChange={(e) => setForm({ ...form, review_url: e.target.value })} /></F>
              </div>
              <div className="space-y-1"><Label className="text-xs">Content</Label><Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="flex justify-end">
                <Button disabled={mut.isPending} onClick={() => mut.mutate({ data: { platform: form.platform, rating: Number(form.rating), content: form.content || null, reviewer_name: form.reviewer_name || null, review_url: form.review_url || null } })}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total reviews" value={metrics.total.toString()} />
          <Kpi label="Avg rating" value={metrics.avg > 0 ? `${metrics.avg.toFixed(2)} ★` : "—"} tint="primary" />
          <Kpi label="Recent (window)" value={metrics.recent.toString()} />
          <Kpi label="Growth vs prior" value={`${metrics.growth >= 0 ? "+" : ""}${metrics.growth.toFixed(0)}%`} tint={metrics.growth >= 0 ? "primary" : undefined} />
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Reviews</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="sources">By source</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {reviews.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">No reviews yet.</div>
              ) : reviews.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: r.rating ?? 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />)}
                    </div>
                    <span className="text-xs text-muted-foreground">{r.platform ?? "—"} · {new Date(r.created_at).toLocaleDateString()}</span>
                    {r.reviewer_name && <span className="text-xs font-medium ml-auto">{r.reviewer_name}</span>}
                  </div>
                  {r.content && <p className="mt-2 text-sm">{r.content}</p>}
                  {r.review_url && <a href={r.review_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">View on {r.platform}</a>}
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="templates" className="mt-4 grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{t.title}</div>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed">{t.body}</pre>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="sources" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              {metrics.bySource.length === 0 ? <div className="text-sm text-muted-foreground">No data.</div> :
                metrics.bySource.map((s) => (
                  <div key={s.key} className="flex justify-between text-sm">
                    <span className="uppercase text-xs tracking-wider">{s.key}</span>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
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
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>; }
