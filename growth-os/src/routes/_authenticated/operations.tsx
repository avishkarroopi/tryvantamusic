import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOperationsOverview, executeApproval } from "@/lib/operations.functions";
import { decideApproval } from "@/lib/approvals.functions";
import { getObservabilitySummary } from "@/lib/observability.server";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/operations")({
  head: () => ({ meta: [{ title: "Operations — Music Growth OS" }] }),
  component: OperationsPage,
});

type Approval = {
  id: string;
  agent_slug: string;
  action_type: string;
  risk_level: "low" | "medium" | "high";
  status: string;
  reasoning: string | null;
  requested_at: string;
  expires_at: string;
};

function OperationsPage() {
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getOperationsOverview);
  const fetchObservability = useServerFn(getObservabilitySummary);
  const decide = useServerFn(decideApproval);
  const execute = useServerFn(executeApproval);

  const { data, isLoading } = useQuery({
    queryKey: ["operations", "overview"],
    queryFn: () => fetchOverview(),
    refetchInterval: 15000,
  });
  const { data: obs } = useQuery({
    queryKey: ["operations", "observability"],
    queryFn: () => fetchObservability(),
    refetchInterval: 30000,
  });

  const decideMutation = useMutation({
    mutationFn: (vars: { id: string; decision: "approve" | "reject" }) => decide({ data: vars }),
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["operations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Decision failed"),
  });
  const executeMutation = useMutation({
    mutationFn: (approvalId: string) => execute({ data: { approvalId } }),
    onSuccess: () => {
      toast.success("Action executed");
      qc.invalidateQueries({ queryKey: ["operations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Execution failed"),
  });

  const approvals = (data?.approvals ?? []) as Approval[];
  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending").slice(0, 10);

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Worker, Approvals & Growth Signals"
        description="The 24/7 worker's health, every action awaiting a human decision, and top SEO/keyword opportunities — one place, no digging through tables."
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* Worker health */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">24/7 Worker</h2>
            {data && (
              <Badge variant={data.worker.alive ? "secondary" : "outline"} className="ml-auto">
                {data.worker.alive
                  ? "Alive"
                  : data.worker.status === "never_seen"
                    ? "Never seen"
                    : "Down / stale"}
              </Badge>
            )}
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.worker.lastTickAt ? (
            <p className="text-sm text-muted-foreground">
              No heartbeat recorded yet — the worker process (<code>npm run worker</code>) has never
              reported in. Scheduled/event/task/retry execution is not running until it does.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Last tick</div>
                {new Date(data.worker.lastTickAt).toLocaleString()}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                {data.worker.startedAt ? new Date(data.worker.startedAt).toLocaleString() : "—"}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ticks</div>
                {data.worker.ticks}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Scheduled runs</div>
                {data.worker.totals.scheduledRuns ?? 0}
              </div>
            </div>
          )}
        </Card>

        {/* Pending approvals — the safety-critical human-in-the-loop gate */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h2 className="font-display font-semibold">Pending approvals</h2>
            <Badge variant={pending.length > 0 ? "secondary" : "outline"} className="ml-auto">
              {pending.length} pending
            </Badge>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing awaiting a decision right now.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => (
                <div key={a.id} className="border border-border rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        a.risk_level === "high"
                          ? "destructive"
                          : a.risk_level === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {a.risk_level}
                    </Badge>
                    <span className="font-medium text-sm">{a.action_type}</span>
                    <span className="text-xs text-muted-foreground">by {a.agent_slug}</span>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(a.requested_at).toLocaleString()}
                    </span>
                  </div>
                  {a.reasoning && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {a.reasoning}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => decideMutation.mutate({ id: a.id, decision: "approve" })}
                      disabled={decideMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideMutation.mutate({ id: a.id, decision: "reject" })}
                      disabled={decideMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {decided.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Recently decided
              </h3>
              <div className="space-y-2">
                {decided.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-[10px]">
                      {a.status}
                    </Badge>
                    <span>{a.action_type}</span>
                    <span className="text-xs text-muted-foreground">({a.agent_slug})</span>
                    {a.status === "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        onClick={() => executeMutation.mutate(a.id)}
                        disabled={executeMutation.isPending}
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Execute now
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Observability */}
        {obs && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Agent runs (24h)</h3>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  {obs.agentRuns.total} total, {obs.agentRuns.failures} failed (
                  {obs.agentRuns.failureRatePct}%)
                </div>
                <div className="text-muted-foreground">
                  avg {obs.agentRuns.avgDurationMs}ms · p95 {obs.agentRuns.p95DurationMs}ms
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-medium">AI usage (24h)</h3>
              </div>
              <div className="text-sm space-y-1">
                <div>{obs.aiUsage.totalCalls} calls</div>
                <div className="text-muted-foreground">
                  {obs.aiUsage.totalInputTokens}→{obs.aiUsage.totalOutputTokens} tokens
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Events (24h)</h3>
              </div>
              <div className="text-sm space-y-1">
                <div>{obs.events.last24h} total</div>
                <div className="text-muted-foreground">
                  {obs.events.unprocessedBacklog} unprocessed
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* SEO content gaps + keywords */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-display font-semibold mb-3">Top content gaps</h2>
            {(data?.contentGaps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None detected yet — run the SEO agent.
              </p>
            ) : (
              <div className="space-y-2">
                {(data?.contentGaps ?? []).map(
                  (g: {
                    id: string;
                    gap_type: string;
                    priority: string;
                    opportunity_score: number;
                    keywords?: { keyword: string };
                  }) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0"
                    >
                      <Badge variant="outline" className="text-[10px]">
                        {g.priority}
                      </Badge>
                      <span>{g.keywords?.keyword ?? g.gap_type}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        score {g.opportunity_score}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-display font-semibold mb-3">Top keyword opportunities</h2>
            {(data?.keywords ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None tracked yet — run the SEO agent.</p>
            ) : (
              <div className="space-y-2">
                {(data?.keywords ?? []).map(
                  (k: {
                    keyword: string;
                    our_position: number | null;
                    opportunity_score: number;
                  }) => (
                    <div
                      key={k.keyword}
                      className="flex items-center gap-2 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0"
                    >
                      <span>{k.keyword}</span>
                      <span className="text-xs text-muted-foreground">
                        {k.our_position ? `us: #${k.our_position}` : "not ranking"}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        score {k.opportunity_score}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
