import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAgent,
  runAgentNow,
  setAgentEnabled,
  setAgentMode,
} from "@/lib/agents.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft, Play, Crown, Bot, CheckCircle2, XCircle, PauseCircle, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agents/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — AI Workforce` }] }),
  component: AgentDetail,
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <p className="text-sm text-red-500">{error.message}</p>
      <Button size="sm" onClick={reset} className="mt-3">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Agent not found.</div>,
});

function AgentDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();
  const fetchAgent = useServerFn(getAgent);
  const runNow = useServerFn(runAgentNow);
  const setEnabled = useServerFn(setAgentEnabled);
  const setMode = useServerFn(setAgentMode);

  const { data, isLoading } = useQuery({
    queryKey: ["agents", "detail", slug],
    queryFn: () => fetchAgent({ data: { slug } }),
    refetchInterval: 10000,
  });

  const runMutation = useMutation({
    mutationFn: () => runNow({ data: { slug } }),
    onSuccess: () => {
      toast.success("Run completed");
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => setEnabled({ data: { slug, enabled } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const modeMutation = useMutation({
    mutationFn: (mode: "manual" | "scheduled" | "disabled") =>
      setMode({ data: { slug, mode } }),
    onSuccess: () => {
      toast.success("Mode updated");
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  if (isLoading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading agent…</div>;
  }

  const { agent, runs, tasks, logs, metrics, events } = data;
  const lastRun = runs[0] as { started_at: string; output?: unknown } | undefined;
  const isCeo = agent.slug === "ceo";

  const successCount = metrics.reduce((acc: number, m: { successes?: number | null }) => acc + (m.successes ?? 0), 0);
  const totalCount = metrics.reduce((acc: number, m: { runs?: number | null }) => acc + (m.runs ?? 0), 0);
  const health = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : agent.health_score ?? 100;

  const reasoning = lastRun && typeof lastRun.output === "object" && lastRun.output && "reasoning" in lastRun.output
    ? String((lastRun.output as { reasoning?: unknown }).reasoning ?? "")
    : "";

  return (
    <div>
      <PageHeader
        eyebrow={agent.category}
        title={agent.name}
        description={agent.description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button size="sm" disabled={!agent.enabled || runMutation.isPending} onClick={() => runMutation.mutate()}>
              <Play className="h-4 w-4" /> Run now
            </Button>
          </div>
        }
      />

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="mt-1 flex items-center gap-2">
              {isCeo ? <Crown className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4" />}
              <span className="font-medium">
                {!agent.enabled || agent.mode === "disabled" ? "Disabled" : agent.mode === "scheduled" ? "Scheduled" : "Manual"}
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</div>
            <div className="font-display text-2xl font-bold">{health}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last run</div>
            <div className="text-sm mt-1">{lastRun ? new Date(lastRun.started_at).toLocaleString() : "Never"}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next scheduled</div>
            <div className="text-sm mt-1">{agent.next_run_at ? new Date(agent.next_run_at).toLocaleString() : "—"}</div>
          </Card>
        </div>

        {reasoning && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">AI reasoning — last run</h2>
            </div>
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </Card>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="p-5 space-y-3">
              <Field label="Mission" value={agent.mission} />
              <Field label="Goal" value={agent.goal} />
              <Field label="System prompt" value={agent.prompt} mono />
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <ChipCard title="Skills" items={agent.skills} />
              <ChipCard title="Tools" items={agent.tools} />
              <ChipCard title="KPIs" items={agent.kpis} />
              <ChipCard title="Integrations" items={agent.integrations} muted />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Activity log</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {logs.map((l: { id: string; level: string; message: string; created_at: string }) => (
                    <div key={l.id} className="flex items-start gap-2 border-b border-border/60 last:border-0 pb-2 last:pb-0">
                      <Badge variant={l.level === "error" ? "destructive" : l.level === "warn" ? "outline" : "secondary"} className="mt-0.5">
                        {l.level}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div>{l.message}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Tasks</h3>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {tasks.map((t: { id: string; status: string; title: string; scheduled_for: string | null; priority?: string | null }) => (
                    <div key={t.id} className="flex items-center gap-3 border-b border-border/60 last:border-0 pb-2 last:pb-0">
                      <Badge variant="secondary">{t.status}</Badge>
                      {t.priority && <Badge variant="outline">{t.priority}</Badge>}
                      <span className="flex-1">{t.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.scheduled_for ? new Date(t.scheduled_for).toLocaleString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="runs" className="mt-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Run history</h3>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {runs.map((r: { id: string; status: string; trigger: string; started_at: string; duration_ms: number | null }) => (
                    <div key={r.id} className="flex items-center gap-3 border-b border-border/60 last:border-0 pb-2 last:pb-0">
                      {r.status === "succeeded" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : r.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{r.status}</span>
                      <span className="text-xs text-muted-foreground">{r.trigger}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(r.started_at).toLocaleString()}{r.duration_ms ? ` · ${r.duration_ms}ms` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Agent communication</h3>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inter-agent events yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {(events as Array<{ id: string; from_agent: string; to_agent: string | null; event_type: string; created_at: string }>).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 border-b border-border/60 last:border-0 pb-2 last:pb-0">
                      <Badge variant="secondary">{e.event_type}</Badge>
                      <span className="text-xs">{e.from_agent} → {e.to_agent ?? "broadcast"}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enabled</div>
                  <div className="text-xs text-muted-foreground">When disabled, this agent will not run manually or on schedule.</div>
                </div>
                <Switch checked={agent.enabled} onCheckedChange={(v) => toggleMutation.mutate(v)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Mode</div>
                  <div className="text-xs text-muted-foreground">Manual = human-triggered. Scheduled = runs on cron. Disabled = paused.</div>
                </div>
                <Select value={agent.mode} onValueChange={(v) => modeMutation.mutate(v as "manual" | "scheduled" | "disabled")}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                Version {agent.version} · slug <code className="font-mono">{agent.slug}</code>
              </div>
              <div>
                <Link to="/agents" className="text-xs text-primary hover:underline">← Back to workforce</Link>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={mono ? "text-xs font-mono mt-1 whitespace-pre-wrap" : "text-sm mt-1"}>
        {value || <span className="text-muted-foreground italic">Not set</span>}
      </div>
    </div>
  );
}

function ChipCard({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <Badge key={s} variant={muted ? "outline" : "secondary"} className="font-mono text-[11px]">{s}</Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">None configured</p>
      )}
    </Card>
  );
}
