import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  competitiveDashboard, competitiveIntelBrief, brandTrend, discoverCompetitors,
  listCompetitorCandidates, approveCandidate, rejectCandidate, refreshCompetitorAds, listCompetitorAds,
} from "@/lib/competitive.functions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingUp, Radar, Check, X, RefreshCw, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/competitive-intelligence")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardOpts),
  component: CompetitiveIntelligencePage,
});

const dashboardOpts = queryOptions({ queryKey: ["competitive", "dashboard"], queryFn: () => competitiveDashboard({ data: undefined as never }) });
const trendOpts = queryOptions({ queryKey: ["competitive", "trend"], queryFn: () => brandTrend({ data: { days: 90 } }) });
const candidatesOpts = queryOptions({ queryKey: ["competitive", "candidates"], queryFn: () => listCompetitorCandidates({ data: undefined as never }) });

function CompetitiveIntelligencePage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(dashboardOpts);
  const trend = useQuery(trendOpts);
  const candidates = useQuery(candidatesOpts);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const discoverFn = useServerFn(discoverCompetitors);
  const discover = useMutation({
    mutationFn: () => discoverFn({ data: undefined as never }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["competitive", "candidates"] }); },
  });

  const approveFn = useServerFn(approveCandidate);
  const rejectFn = useServerFn(rejectCandidate);
  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["competitive"] }); },
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["competitive", "candidates"] }); },
  });

  const briefFn = useServerFn(competitiveIntelBrief);
  const brief = useMutation({ mutationFn: () => briefFn({ data: undefined as never }) });

  const adsFn = useServerFn(listCompetitorAds);
  const refreshAdsFn = useServerFn(refreshCompetitorAds);
  const ads = useQuery({
    queryKey: ["competitive", "ads", selectedCompetitor],
    queryFn: () => adsFn({ data: { competitorId: selectedCompetitor! } }),
    enabled: !!selectedCompetitor,
  });
  const refreshAds = useMutation({
    mutationFn: (competitorId: string) => refreshAdsFn({ data: { competitorId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["competitive", "ads"] }); },
  });

  const snap = data.brandSnapshot;

  return (
    <>
      <PageHeader
        eyebrow="Competitive Intelligence"
        title="Competitive Intelligence"
        description="Brand health, automatic competitor discovery, and ad activity — synthesized into one strategic brief."
        actions={
          <Button size="sm" onClick={() => brief.mutate()} disabled={brief.isPending}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {brief.isPending ? "Analyzing…" : "Generate Brief"}
          </Button>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        {/* Brand Intelligence */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Brand Intelligence</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Kpi label="Sentiment" value={snap?.sentiment_score != null ? `${snap.sentiment_score}/100` : "—"} />
              <Kpi label="Consistency" value={snap?.consistency_score != null ? `${snap.consistency_score}/100` : "—"} />
              <Kpi label="Review velocity" value={snap?.review_velocity != null ? `${snap.review_velocity}/day` : "—"} />
              <Kpi label="Response rate" value={snap?.response_rate != null ? `${snap.response_rate}%` : "—"} />
            </div>
            {trend.data && trend.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend.data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="created_at" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <Line type="monotone" dataKey="sentiment_score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Sentiment" />
                  <Line type="monotone" dataKey="consistency_score" stroke="#f59e0b" strokeWidth={2} dot={false} name="Consistency" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No snapshots captured yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Competitor Discovery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Radar className="h-4 w-4" /> Competitor Discovery</CardTitle>
            <Button size="sm" variant="outline" onClick={() => discover.mutate()} disabled={discover.isPending}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {discover.isPending ? "Searching…" : "Discover competitors"}
            </Button>
          </CardHeader>
          <CardContent>
            {discover.data && discover.data.available === false && (
              <p className="text-sm text-amber-600 mb-3">{discover.data.reason} — add a Google Places API key to enable automatic discovery.</p>
            )}
            {candidates.data && candidates.data.length > 0 ? (
              <div className="space-y-2">
                {candidates.data.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.address} · {c.rating ?? "—"}★ · {c.review_count} reviews</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => approve.mutate(c.id)}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => reject.mutate(c.id)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending candidates. Run discovery to find nearby competitors.</p>
            )}
          </CardContent>
        </Card>

        {/* Comparison + Ad Intelligence */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Competitor Comparison &amp; Ad Activity</CardTitle></CardHeader>
          <CardContent>
            {data.competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved competitors yet.</p>
            ) : (
              <div className="space-y-2">
                {data.competitors.map((c) => (
                  <div key={c.id} className="rounded-lg border">
                    <button
                      className="w-full flex items-center justify-between gap-3 p-3 text-sm text-left"
                      onClick={() => setSelectedCompetitor(selectedCompetitor === c.id ? null : c.id)}
                    >
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">visibility {c.visibility_score}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{c.avg_rating}★ · {c.review_count} reviews</span>
                    </button>
                    {selectedCompetitor === c.id && (
                      <div className="border-t p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Megaphone className="h-3 w-3" /> Ad Activity</span>
                          <Button size="sm" variant="outline" onClick={() => refreshAds.mutate(c.id)} disabled={refreshAds.isPending}>Refresh</Button>
                        </div>
                        {refreshAds.data && refreshAds.data.available === false && (
                          <p className="text-xs text-amber-600">{refreshAds.data.reason}</p>
                        )}
                        {ads.data && ads.data.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {ads.data.filter((a) => a.is_active).length} active ads · last seen {new Date(ads.data[0].last_seen ?? ads.data[0].created_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No ad data yet — click Refresh.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Brief */}
        {brief.data && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Strategic Brief</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{brief.data.summary}</p>
              <BriefList title="Our strengths" items={brief.data.ourStrengths} />
              <BriefList title="Competitor threats" items={brief.data.competitorThreats} />
              <BriefList title="Opportunities" items={brief.data.opportunities} />
              <BriefList title="Recommended actions" items={brief.data.recommendedActions} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      <ul className="list-disc list-inside space-y-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
