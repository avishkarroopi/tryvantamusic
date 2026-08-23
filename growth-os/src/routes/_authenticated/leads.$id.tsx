import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { getLead, addLeadNote, changeLeadStatus } from "@/lib/leads.functions";
import { submitQualification } from "@/lib/qualification.functions";
import { createTask, updateTaskStatus, deleteTask, toggleLeadLabel } from "@/lib/tasks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, Mail, MessageSquare, Sparkles, Plus, Check, Trash2, Circle } from "lucide-react";

const ALL_LABELS = [
  "hot", "warm", "cold", "high_value", "nri",
  "parent", "adult_learner", "certification", "professional",
] as const;
type LeadLabel = typeof ALL_LABELS[number];

export const Route = createFileRoute("/_authenticated/leads/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(leadOpts(params.id)),
  component: LeadDetail,
});

const leadOpts = (id: string) =>
  queryOptions({
    queryKey: ["lead", id],
    queryFn: () => getLead({ data: { id } }),
  });

function LeadDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(leadOpts(id));
  const { lead, labels, score, activities, tasks, qualification } = data;
  const qc = useQueryClient();
  const noteFn = useServerFn(addLeadNote);
  const statusFn = useServerFn(changeLeadStatus);
  const labelFn = useServerFn(toggleLeadLabel);
  const [note, setNote] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["lead", id] });

  const noteMut = useMutation({
    mutationFn: noteFn,
    onSuccess: () => { invalidate(); setNote(""); toast.success("Note added"); },
    onError: (e) => toast.error(e.message),
  });
  const statusMut = useMutation({
    mutationFn: statusFn,
    onSuccess: () => { invalidate(); toast.success("Status changed"); },
  });
  const labelMut = useMutation({
    mutationFn: labelFn,
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow={<span>{lead.source}</span> as unknown as string}
        title={lead.name ?? lead.student_name ?? lead.email ?? "Unnamed lead"}
        description={`${lead.country ?? "—"} · ${lead.instrument ?? "—"} · Created ${new Date(lead.created_at).toLocaleDateString()}`}
        actions={
          <Link to="/leads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All leads
          </Link>
        }
      />
      <div className="p-6 md:p-8 grid gap-6 lg:grid-cols-3">
        {/* Left: profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Lead score</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-primary tabular-nums">{lead.score}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {labels.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No labels yet</span>
                  ) : labels.map((l) => (
                    <Badge key={l} variant="secondary" className="text-[10px] uppercase">{l.replace("_", " ")}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${lead.phone}`}><Phone className="h-4 w-4" /> Call</a>
                  </Button>
                )}
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageSquare className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4" /> Email</a>
                  </Button>
                )}
              </div>
            </div>

            {score?.ai_summary && (
              <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI qualification summary
                </div>
                <p className="text-sm">{score.ai_summary}</p>
                {score.ai_next_action && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong className="text-foreground">Next action:</strong> {score.ai_next_action}
                  </p>
                )}
              </div>
            )}

            {score && (
              <div className="mt-6 grid grid-cols-4 md:grid-cols-7 gap-2">
                {(
                  [
                    ["Demo", score.demographic],
                    ["Geo", score.geographic],
                    ["Program", score.program_fit],
                    ["Intent", score.intent],
                    ["Urgency", score.urgency],
                    ["Budget", score.budget],
                    ["Engage", score.engagement],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-2 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                    <div className="font-bold tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="tasks">Tasks {tasks.length > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({tasks.length})</span>}</TabsTrigger>
              <TabsTrigger value="qualify">Qualify</TabsTrigger>
              <TabsTrigger value="attribution">Attribution</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Add note</Label>
                <Textarea rows={3} className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a call, meeting, next step…" />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" disabled={!note.trim() || noteMut.isPending}
                    onClick={() => noteMut.mutate({ data: { id, note } })}>
                    {noteMut.isPending ? "Saving…" : "Save note"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center rounded-lg border border-dashed border-border">
                    No activity yet.
                  </div>
                ) : activities.map((a) => (
                  <div key={a.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold">{a.kind}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                      {a.payload && typeof a.payload === "object" && "text" in a.payload && (
                        <div className="mt-2 text-sm">{String((a.payload as { text: string }).text)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="tasks" className="mt-4">
              <TasksPanel leadId={id} tasks={tasks} onChange={invalidate} />
            </TabsContent>
            <TabsContent value="qualify" className="mt-4">
              <QualifyForm leadId={id} existing={qualification} onDone={invalidate} />
            </TabsContent>
            <TabsContent value="attribution" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Source", lead.source],
                  ["Campaign", lead.campaign_source],
                  ["UTM source", lead.utm_source],
                  ["UTM medium", lead.utm_medium],
                  ["UTM campaign", lead.utm_campaign],
                  ["UTM content", lead.utm_content],
                  ["UTM term", lead.utm_term],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                    <div>{v || "—"}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: side */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
            <select
              value={lead.status}
              onChange={(e) => statusMut.mutate({ data: { id, status: e.target.value as "new" } })}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {["new","contacted","qualified","assessment_scheduled","assessment_completed","enrollment_pending","enrolled","lost","dormant","re_engagement"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Labels</Label>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_LABELS.map((l) => {
                const on = labels.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={labelMut.isPending}
                    onClick={() => labelMut.mutate({ data: { lead_id: id, label: l, on: !on } })}
                    className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider border transition-colors ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}
                  >
                    {l.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-sm space-y-2">
            <Row label="Email" v={lead.email} />
            <Row label="Phone" v={lead.phone} />
            <Row label="Country" v={lead.country} />
            <Row label="City" v={lead.city} />
            <Row label="Instrument" v={lead.instrument} />
            <Row label="Goal" v={lead.learning_goal} />
            <Row label="Skill" v={lead.skill_level} />
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, v }: { label: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{v || "—"}</span>
    </div>
  );
}

function QualifyForm({
  leadId, existing, onDone,
}: { leadId: string; existing: unknown; onDone: () => void }) {
  const existingObj = (existing ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    student_age: (existingObj.student_age as number | undefined) ?? undefined,
    instrument: (existingObj.instrument as string | undefined) ?? "",
    country: (existingObj.country as string | undefined) ?? "",
    skill_level: (existingObj.skill_level as string | undefined) ?? "",
    goal: (existingObj.goal as string | undefined) ?? "",
    preferred_timing: (existingObj.preferred_timing as string | undefined) ?? "",
    learning_format: (existingObj.learning_format as string | undefined) ?? "",
    budget: (existingObj.budget as string | undefined) ?? "",
    urgency: (existingObj.urgency as string | undefined) ?? "",
  });
  const fn = useServerFn(submitQualification);
  const mut = useMutation({
    mutationFn: fn,
    onSuccess: (r) => { toast.success(`Scored ${r.score}/100`); onDone(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate({
          data: {
            lead_id: leadId,
            student_age: form.student_age ? Number(form.student_age) : null,
            instrument: form.instrument || null,
            country: form.country || null,
            skill_level: (form.skill_level || null) as never,
            goal: (form.goal || null) as never,
            preferred_timing: form.preferred_timing || null,
            learning_format: form.learning_format || null,
            budget: (form.budget || null) as never,
            urgency: (form.urgency || null) as never,
          },
        });
      }}
      className="rounded-xl border border-border bg-card p-5 grid gap-4 md:grid-cols-2"
    >
      <F label="Student age">
        <Input type="number" value={form.student_age ?? ""} onChange={(e) => setForm({ ...form, student_age: e.target.value ? Number(e.target.value) : undefined })} />
      </F>
      <F label="Instrument"><Input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} /></F>
      <F label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></F>
      <F label="Skill level">
        <Select value={form.skill_level} onChange={(v) => setForm({ ...form, skill_level: v })} options={["beginner","intermediate","advanced"]} />
      </F>
      <F label="Goal">
        <Select value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} options={["hobby","certification","professional","teacher_training"]} />
      </F>
      <F label="Preferred timing"><Input value={form.preferred_timing} onChange={(e) => setForm({ ...form, preferred_timing: e.target.value })} placeholder="e.g. Weekday evenings" /></F>
      <F label="Learning format"><Input value={form.learning_format} onChange={(e) => setForm({ ...form, learning_format: e.target.value })} placeholder="Online / In-person" /></F>
      <F label="Budget">
        <Select value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} options={["low","medium","high","premium"]} />
      </F>
      <F label="Urgency">
        <Select value={form.urgency} onChange={(v) => setForm({ ...form, urgency: v })} options={["low","medium","high","immediate"]} />
      </F>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Scoring…" : "Qualify & Score"}
        </Button>
      </div>
    </form>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
    >
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
    </select>
  );
}

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
};

function TasksPanel({
  leadId, tasks, onChange,
}: { leadId: string; tasks: TaskRow[]; onChange: () => void }) {
  const createFn = useServerFn(createTask);
  const updateFn = useServerFn(updateTaskStatus);
  const deleteFn = useServerFn(deleteTask);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [dueAt, setDueAt] = useState("");

  const createMut = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      onChange(); setTitle(""); setDueAt(""); setPriority("normal");
      toast.success("Task added");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: updateFn,
    onSuccess: () => { onChange(); toast.success("Task updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => { onChange(); toast.success("Task deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const open = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const closed = tasks.filter((t) => t.status === "done" || t.status === "cancelled");

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          createMut.mutate({
            data: {
              lead_id: leadId,
              title: title.trim(),
              priority,
              due_at: dueAt ? new Date(dueAt).toISOString() : null,
            },
          });
        }}
        className="rounded-xl border border-border bg-card p-4 space-y-3"
      >
        <div className="flex gap-2">
          <Input
            placeholder="New task (e.g. Call parent Monday 4pm)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!title.trim() || createMut.isPending}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {(["low", "normal", "high", "urgent"] as const).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Due (optional)</Label>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </form>

      <TaskList
        title="Open"
        tasks={open}
        onToggle={(t) =>
          updateMut.mutate({
            data: { id: t.id, status: t.status === "done" ? "pending" : "done" },
          })
        }
        onDelete={(t) => deleteMut.mutate({ data: { id: t.id } })}
      />
      {closed.length > 0 && (
        <TaskList
          title="Completed"
          tasks={closed}
          onToggle={(t) =>
            updateMut.mutate({
              data: { id: t.id, status: t.status === "done" ? "pending" : "done" },
            })
          }
          onDelete={(t) => deleteMut.mutate({ data: { id: t.id } })}
        />
      )}
    </div>
  );
}

function TaskList({
  title, tasks, onToggle, onDelete,
}: {
  title: string;
  tasks: TaskRow[];
  onToggle: (t: TaskRow) => void;
  onDelete: (t: TaskRow) => void;
}) {
  if (tasks.length === 0) return null;
  const priorityColor: Record<TaskRow["priority"], string> = {
    low: "text-muted-foreground",
    normal: "text-foreground",
    high: "text-orange-500",
    urgent: "text-red-500",
  };
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="space-y-2">
        {tasks.map((t) => {
          const done = t.status === "done";
          return (
            <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <button
                type="button"
                onClick={() => onToggle(t)}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
              >
                {done ? <Check className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={`uppercase font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
                  {t.due_at && <span>· Due {new Date(t.due_at).toLocaleString()}</span>}
                  <span>· {new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(t)}
                className="shrink-0 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
