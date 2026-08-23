import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWorkforceOverview, runAgentNow, getIntegrationsStatus } from "@/lib/agents.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Play, Crown, Activity, CheckCircle2, XCircle, PauseCircle,
  ListChecks, AlertTriangle, Zap, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({ meta: [{ title: "AI Workforce — Muziclly Growth OS" }] }),
  component: AgentsOverview,
});

type Priority = { slug: string; name: string; reason: string };
type Bottleneck = { note: string };
type Action = { action: string };

function AgentsOverview() {
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getWorkforceOverview);
  const fetchIntegrations = useServerFn(getIntegrationsStatus);
  const runNow = useServerFn(runAgentNow);

  const { data, isLoading } = useQuery({
    queryKey: ["agents", "overview"],
    queryFn: () => fetchOverview(),
    refetchInterval: 15000,
  });
  const { data: integrations } = useQuery({
    queryKey: ["agents", "integrations"],
    queryFn: () => fetchIntegrations(),
  });

  const runMutation = useMutation({
    mutationFn: (slug: string) => runNow({ data: { slug } }),
    onSuccess: (_, slug) => {
      toast.success(`Agent "${slug}" run completed`);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const counts = data?.counts;
  const brief = data?.brief as
    | { summary: string; workforce_health: number; priorities?: Priority[]; bottlenecks?: Bottleneck[]; recommended_actions?: Action[] }
    | null | undefined;

  return (
    <div>
      <PageHeader
        eyebrow="AI Workforce"
        title="Executive Command Center"
        description="Your specialized AI employees, working alongside the growth team."
        actions={
          <div className="flex gap-2">
            <Link to="/knowledge"><Button size="sm" variant="outline"><BookOpen className="h-4 w-4" /> Knowledge</Button></Link>
            <Button size="sm" onClick={() => runMutation.mutate("ceo")} disabled={runMutation.isPending}>
              <Crown className="h-4 w-4" /> Run CEO brief
            </Button>
          </div>
        }
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Kpi label="Total" value={counts?.total ?? 0} />
          <Kpi label="Active" value={counts?.active ?? 0} tone="success" />
          <Kpi label="Idle" value={counts?.idle ?? 0} tone="muted" />
          <Kpi label="Disabled" value={counts?.disabled ?? 0} tone="muted" />
          <Kpi label="Running" value={counts?.running ?? 0} tone="info" />
          <Kpi label="Done today" value={counts?.completedToday ?? 0} tone="success" />
          <Kpi label="Failed today" value={counts?.failedToday ?? 0} tone="danger" />
        </div>

        {/* Executive summary */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Executive summary</h2>
            {brief && <Badge variant="secondary" className="ml-auto">Health {brief.workforce_health}%</Badge>}
          </div>
          {brief ? (
            <p className="text-sm text-muted-foreground">{brief.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No brief yet. Run the CEO agent to generate the first executive summary.
            </p>
          )}
        </Card>

        {/* Priorities / Bottlenecks / Actions */}
        {brief && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2"><ListChecks className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Today's priorities</h3></div>
              {(brief.priorities ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">None right now.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(brief.priorities ?? []).map((p) => (
                    <li key={p.slug} className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">{p.name}</Badge>
                      <span className="text-muted-foreground text-xs">{p.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-medium">Bottlenecks</h3></div>
              {(brief.bottlenecks ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No bottlenecks detected.</p>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(brief.bottlenecks ?? []).map((b, i) => <li key={i}>• {b.note}</li>)}
                </ul>
              )}
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Recommended actions</h3></div>
              {(brief.recommended_actions ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(brief.recommended_actions ?? []).map((a, i) => <li key={i}>→ {a.action}</li>)}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* Agent roster */}
        <div>
          <h2 className="font-display font-semibold mb-3">Workforce</h2>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading agents…</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(data?.registry ?? []).map((a) => (
                <Card key={a.slug} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-brand-gradient flex items-center justify-center text-primary-foreground">
                      {a.slug === "ceo" ? <Crown className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to="/agents/$slug" params={{ slug: a.slug }} className="font-medium hover:underline truncate">
                          {a.name}
                        </Link>
                        <StatusBadge enabled={a.enabled} mode={a.mode} />
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{a.category}</div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{a.last_run_at ? `Last run ${new Date(a.last_run_at).toLocaleString()}` : "Never run"}</span>
                    <Button size="sm" variant="ghost" disabled={!a.enabled || runMutation.isPending} onClick={() => runMutation.mutate(a.slug)}>
                      <Play className="h-3.5 w-3.5" /> Run
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Integrations */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Integrations</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {(integrations ?? []).map((i) => (
              <div key={i.key} className="border border-border rounded-md p-3">
                <div className="text-sm font-medium truncate">{i.label}</div>
                <Badge variant={i.status === "ready" ? "secondary" : "outline"} className="mt-1">
                  {i.status === "ready" ? "Ready" : "Missing credentials"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity + inter-agent events */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Recent runs</h2></div>
            <div className="space-y-2">
              {((data?.recentRuns ?? []) as Array<{ agent_slug: string; status: string; started_at: string }>).length === 0 && (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
              )}
              {((data?.recentRuns ?? []) as Array<{ agent_slug: string; status: string; started_at: string }>).map((r, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0">
                  {r.status === "succeeded" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                    r.status === "failed" ? <XCircle className="h-4 w-4 text-red-500" /> :
                    <PauseCircle className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium">{r.agent_slug}</span>
                  <span className="text-muted-foreground">{r.status}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(r.started_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Zap className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Agent communication</h2></div>
            <div className="space-y-2">
              {((data?.recentEvents ?? []) as Array<{ id: string; from_agent: string; to_agent: string | null; event_type: string; created_at: string }>).length === 0 && (
                <p className="text-sm text-muted-foreground">No events yet — run an agent to see cross-agent messages.</p>
              )}
              {((data?.recentEvents ?? []) as Array<{ id: string; from_agent: string; to_agent: string | null; event_type: string; created_at: string }>).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0">
                  <Badge variant="secondary" className="text-[10px]">{e.event_type}</Badge>
                  <span className="text-xs">{e.from_agent} → {e.to_agent ?? "broadcast"}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" | "info" | "muted" }) {
  const toneClass =
    tone === "success" ? "text-emerald-500" :
    tone === "danger" ? "text-red-500" :
    tone === "info" ? "text-primary" :
    tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl font-bold ${toneClass}`}>{value}</div>
    </Card>
  );
}

function StatusBadge({ enabled, mode }: { enabled: boolean; mode: string }) {
  if (!enabled || mode === "disabled") return <Badge variant="outline">Disabled</Badge>;
  if (mode === "scheduled") return <Badge>Scheduled</Badge>;
  return <Badge variant="secondary">Manual</Badge>;
}
