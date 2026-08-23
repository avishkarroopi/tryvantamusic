import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listLeads, changeLeadStatus } from "@/lib/leads.functions";
import { Search, Plus, Flame, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const listOpts = queryOptions({
  queryKey: ["leads", "all"],
  queryFn: () => listLeads({ data: {} }),
});

export const Route = createFileRoute("/_authenticated/leads/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listOpts),
  component: LeadsPage,
});

const STATUSES = [
  "new", "contacted", "qualified", "assessment_scheduled",
  "assessment_completed", "enrollment_pending", "enrolled", "lost",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  assessment_scheduled: "Assessment", assessment_completed: "Completed",
  enrollment_pending: "Pending", enrolled: "Enrolled", lost: "Lost",
  dormant: "Dormant", re_engagement: "Re-eng",
};

function scoreBadge(score: number) {
  if (score >= 85) return "bg-secondary/15 text-secondary border-secondary/30";
  if (score >= 60) return "bg-primary/15 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}

function LeadsPage() {
  const { data: leads } = useSuspenseQuery(listOpts);
  const qc = useQueryClient();
  const changeStatusFn = useServerFn(changeLeadStatus);
  const mutation = useMutation({
    mutationFn: changeStatusFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [view, setView] = useState<"table" | "kanban">("table");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (!s) return true;
      return [l.name, l.email, l.phone, l.student_name, l.country, l.instrument]
        .some((v) => v?.toLowerCase().includes(s));
    });
  }, [leads, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every lead in one intelligent pipeline."
        actions={
          <Link
            to="/leads/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New lead
          </Link>
        }
      />
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, country…"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-1">
            <button
              onClick={() => setView("table")}
              className={`px-2.5 py-1 rounded text-xs font-medium ${view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >Table</button>
            <button
              onClick={() => setView("kanban")}
              className={`px-2.5 py-1 rounded text-xs font-medium ${view === "kanban" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >Kanban</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold">No leads yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Capture your first lead to get started.</p>
            <Link
              to="/leads/new"
              className="inline-flex items-center gap-1.5 mt-4 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New lead
            </Link>
          </div>
        ) : view === "table" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-elegant">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Lead</th>
                    <th className="text-left font-medium px-4 py-3">Contact</th>
                    <th className="text-left font-medium px-4 py-3">Interest</th>
                    <th className="text-left font-medium px-4 py-3">Source</th>
                    <th className="text-left font-medium px-4 py-3">Score</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-right font-medium px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.name ?? l.student_name ?? "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{l.country ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">{l.email ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.phone ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{l.instrument ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] uppercase">{l.source}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${scoreBadge(l.score)}`}>
                          {l.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => mutation.mutate({ data: { id: l.id, status: e.target.value as "new" } })}
                          className="h-7 rounded border border-input bg-background px-2 text-xs"
                        >
                          {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/leads/$id" params={{ id: l.id }}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {STATUSES.map((s) => (
              <div key={s} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider">
                  <span>{STATUS_LABEL[s]}</span>
                  <span className="text-muted-foreground">
                    {filtered.filter((l) => l.status === s).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {filtered.filter((l) => l.status === s).map((l) => (
                    <Link
                      key={l.id} to="/leads/$id" params={{ id: l.id }}
                      className="block rounded-lg bg-card border border-border p-3 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm truncate">{l.name ?? l.student_name ?? "Unnamed"}</div>
                        <span className={`text-[10px] font-bold tabular-nums rounded px-1.5 py-0.5 border ${scoreBadge(l.score)}`}>{l.score}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground truncate">
                        {l.instrument ?? "—"} · {l.country ?? "—"}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
