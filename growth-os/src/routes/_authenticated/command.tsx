import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { listInsights, dismissInsight, generateInsights } from "@/lib/insights.functions";
import { marketingIntel, revenueIntel } from "@/lib/intel.functions";
import { reviewMetrics } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, TrendingUp, Users, IndianRupee, Star, MessageSquare, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(insOpts()),
      context.queryClient.ensureQueryData(mktOpts()),
      context.queryClient.ensureQueryData(revOpts()),
      context.queryClient.ensureQueryData(revMOpts()),
    ]);
  },
  component: CommandCenter,
});

const insOpts = () => queryOptions({ queryKey: ["insights"], queryFn: () => listInsights({ data: {} }) });
const mktOpts = () => queryOptions({ queryKey: ["intel", 30], queryFn: () => marketingIntel({ data: { days: 30 } }) });
const revOpts = () => queryOptions({ queryKey: ["revenue", 30], queryFn: () => revenueIntel({ data: { days: 30 } }) });
const revMOpts = () => queryOptions({ queryKey: ["reviews", "metrics"], queryFn: () => reviewMetrics({ data: {} }) });

function CommandCenter() {
  const { data: insights } = useSuspenseQuery(insOpts());
  const { data: mkt } = useSuspenseQuery(mktOpts());
  const { data: rev } = useSuspenseQuery(revOpts());
  const { data: reviews } = useSuspenseQuery(revMOpts());
  const qc = useQueryClient();
  const genFn = useServerFn(generateInsights);
  const dismissFn = useServerFn(dismissInsight);

  const gen = useMutation({
    mutationFn: genFn,
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["insights"] }); toast.success(`${r.created} insight${r.created === 1 ? "" : "s"} added`); },
    onError: (e) => toast.error(e.message),
  });
  const dismiss = useMutation({ mutationFn: dismissFn, onSuccess: () => qc.invalidateQueries({ queryKey: ["insights"] }) });

  const priorityColor: Record<string, string> = {
    critical: "border-red-500/60 bg-red-500/5",
    high: "border-primary/60 bg-primary/5",
    normal: "border-border bg-card",
    low: "border-border bg-card",
  };

  return (
    <>
      <PageHeader
        eyebrow="Growth Command Center"
        title="Growth Command Center"
        description="One executive view: marketing, revenue, reviews, and AI insights across every agent."
        actions={
          <Button size="sm" disabled={gen.isPending} onClick={() => gen.mutate({})}>
            <Sparkles className="h-4 w-4" /> {gen.isPending ? "Analyzing…" : "Regenerate insights"}
          </Button>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={<Users className="h-4 w-4" />} label="Leads (30d)" value={mkt.totals.leads.toLocaleString()} />
          <Kpi icon={<Rocket className="h-4 w-4" />} label="Enrollments" value={mkt.totals.enrollments.toLocaleString()} />
          <Kpi icon={<IndianRupee className="h-4 w-4" />} label="Revenue" value={`₹${rev.totals.revenue.toLocaleString()}`} tint="primary" />
          <Kpi icon={<Star className="h-4 w-4" />} label="Avg rating" value={reviews.avg > 0 ? `${reviews.avg.toFixed(2)} ★` : "—"} />
        </div>

        {/* Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">AI insights</h2>
            <Badge variant="outline" className="text-[10px] ml-auto">{insights.length} active</Badge>
          </div>
          {insights.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No insights yet. Click "Regenerate insights" to run the analysis engine.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {insights.map((ins) => (
                <div key={ins.id} className={`rounded-xl border p-4 ${priorityColor[ins.priority] ?? "border-border bg-card"}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase">{ins.agent}</Badge>
                        <Badge variant={ins.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{ins.priority}</Badge>
                      </div>
                      <h3 className="text-sm font-semibold">{ins.title}</h3>
                      {ins.body && <p className="mt-1 text-xs text-muted-foreground">{ins.body}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismiss.mutate({ data: { id: ins.id } })}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <ModuleCard to="/intelligence" icon={<TrendingUp className="h-4 w-4" />} title="Marketing Intelligence" desc="Source, campaign, and conversion analysis" />
          <ModuleCard to="/revenue" icon={<IndianRupee className="h-4 w-4" />} title="Revenue Intelligence" desc="Money, ROI, pipeline value" />
          <ModuleCard to="/copilot" icon={<Sparkles className="h-4 w-4" />} title="Founder Copilot" desc="Ask anything about your business" />
          <ModuleCard to="/ads/meta" icon={<Rocket className="h-4 w-4" />} title="Ads Intelligence" desc="Meta + Google — approval required" />
          <ModuleCard to="/content" icon={<MessageSquare className="h-4 w-4" />} title="Content Studio" desc="AI-drafted, human-approved" />
          <ModuleCard to="/reviews" icon={<Star className="h-4 w-4" />} title="Reviews & Reputation" desc="Google, testimonials, success stories" />
        </div>
      </div>
    </>
  );
}
function Kpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint?: "primary" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${tint === "primary" ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
function ModuleCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-elegant transition-all">
      <div className="flex items-center gap-2 text-primary mb-2">{icon}<span className="text-sm font-semibold">{title}</span></div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
