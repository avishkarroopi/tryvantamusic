import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  gbpDashboard,
  upsertGbpProfile,
  importGbpReview,
  saveReviewReply,
  generateReviewReply,
  reviewSentimentSummary,
  createGbpPost,
  generatePostIdeas,
  upsertCompetitor,
  deleteCompetitor,
  updateActionStatus,
  generateActions,
  gbpCoachBrief,
  captureReputationSnapshot,
} from "@/lib/gbp.functions";
import {
  Sparkles, Star, MapPin, Camera, Megaphone, Users, CheckCircle2, Circle,
  TrendingUp, Trash2, Plus, RefreshCcw, Wand2, MessageSquare, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/gbp")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashOpts()),
  component: GbpPage,
});

const dashOpts = () => queryOptions({ queryKey: ["gbp", "dashboard"], queryFn: () => gbpDashboard({ data: undefined as never }) });

function GbpPage() {
  const { data } = useSuspenseQuery(dashOpts());
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["gbp"] });

  return (
    <>
      <PageHeader
        eyebrow="V11 · Google Business Growth"
        title="Google Business Growth"
        description="AI consultant for your Google Business Profile — health, reviews, local SEO, posts, and competitors."
        actions={<ActionsHeader onDone={invalidate} />}
      />
      <div className="p-6 md:p-8 space-y-6">
        <ScoreGrid scores={data.scores} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile & SEO</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="actions">Action Center</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <OverviewTab data={data} />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <ProfileTab profile={data.profile} onSaved={invalidate} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6 space-y-6">
            <ReviewsTab data={data} onChanged={invalidate} />
          </TabsContent>
          <TabsContent value="posts" className="mt-6 space-y-6">
            <PostsTab posts={data.posts} onChanged={invalidate} />
          </TabsContent>
          <TabsContent value="competitors" className="mt-6 space-y-6">
            <CompetitorsTab data={data} onChanged={invalidate} />
          </TabsContent>
          <TabsContent value="actions" className="mt-6 space-y-6">
            <ActionsTab data={data} onChanged={invalidate} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-6">
            <TimelineTab snapshots={data.snapshots} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ActionsHeader({ onDone }: { onDone: () => void }) {
  const genFn = useServerFn(generateActions);
  const snapFn = useServerFn(captureReputationSnapshot);
  const gen = useMutation({ mutationFn: genFn, onSuccess: (r) => { onDone(); toast.success(`${r.created} action${r.created === 1 ? "" : "s"} refreshed`); }, onError: (e) => toast.error(e.message) });
  const snap = useMutation({ mutationFn: snapFn, onSuccess: () => { onDone(); toast.success("Snapshot captured"); }, onError: (e) => toast.error(e.message) });
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => snap.mutate({} as never)} disabled={snap.isPending}>
        <RefreshCcw className="h-4 w-4" /> Snapshot
      </Button>
      <Button size="sm" onClick={() => gen.mutate({} as never)} disabled={gen.isPending}>
        <Sparkles className="h-4 w-4" /> {gen.isPending ? "Thinking…" : "Regenerate actions"}
      </Button>
    </div>
  );
}

function ScoreGrid({ scores }: { scores: { health: number; visibility: number; review: number; localSeo: number; photo: number; posting: number } }) {
  const items = [
    { label: "Business Health", value: scores.health, tint: true },
    { label: "Visibility", value: scores.visibility },
    { label: "Review Score", value: scores.review },
    { label: "Local SEO", value: scores.localSeo },
    { label: "Photo Score", value: scores.photo },
    { label: "Posting", value: scores.posting },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {items.map((it) => (
        <div key={it.label} className={`rounded-xl border p-4 ${it.tint ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</div>
          <div className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${it.tint ? "text-primary" : ""}`}>{it.value}<span className="text-muted-foreground text-sm font-medium">/100</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${it.tint ? "bg-primary" : "bg-foreground/70"}`} style={{ width: `${it.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof gbpDashboard>> }) {
  const briefFn = useServerFn(gbpCoachBrief);
  const brief = useQuery({ queryKey: ["gbp", "coach"], queryFn: () => briefFn({ data: undefined as never }) });
  const sentFn = useServerFn(reviewSentimentSummary);
  const sentiment = useQuery({ queryKey: ["gbp", "sentiment"], queryFn: () => sentFn({ data: undefined as never }) });

  const rating = data.reviews.total > 0 ? data.reviews.avg.toFixed(2) : "—";
  const stars = "★".repeat(Math.round(data.reviews.avg)) + "☆".repeat(5 - Math.round(data.reviews.avg));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-primary">Health Score</div>
              <div className="font-display text-5xl font-bold text-primary tabular-nums">{data.scores.health}<span className="text-xl text-muted-foreground">/100</span></div>
              <div className="mt-1 text-lg text-primary">{stars}</div>
              <div className="mt-1 text-xs text-muted-foreground">{data.scores.health >= 85 ? "Excellent" : data.scores.health >= 65 ? "Good — room to grow" : "Needs attention"}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg rating</div>
              <div className="font-display text-3xl font-bold tabular-nums">{rating} ★</div>
              <div className="text-xs text-muted-foreground">{data.reviews.total} reviews</div>
            </div>
          </div>
        </div>

        <ChecklistCard checklist={data.checklist} />

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">AI Coach</h3>
          </div>
          {brief.isLoading && <p className="text-sm text-muted-foreground">Analyzing your profile…</p>}
          {brief.data && (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Observations</div>
                <ul className="space-y-1.5 text-sm">
                  {brief.data.observations.map((o, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{o}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommendations</div>
                <ul className="space-y-1.5 text-sm">
                  {brief.data.recommendations.map((o, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{o}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <KpiTile icon={<MessageSquare className="h-4 w-4" />} label="Unanswered" value={data.reviews.unanswered.toString()} sub={`${data.reviews.replied}/${data.reviews.total} replied`} />
        <KpiTile icon={<TrendingUp className="h-4 w-4" />} label="Review growth (30d)" value={`${data.reviews.growth >= 0 ? "+" : ""}${data.reviews.growth.toFixed(0)}%`} sub={`${data.reviews.last30} in last 30 days`} />
        <KpiTile icon={<Camera className="h-4 w-4" />} label="Photos" value={(data.profile?.photo_count ?? 0).toString()} sub={`${data.profile?.video_count ?? 0} videos`} />
        <KpiTile icon={<Megaphone className="h-4 w-4" />} label="Posts" value={(data.profile?.post_count ?? 0).toString()} sub="Aim for 4+/mo" />

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Keyword cloud</div>
          {data.reviews.keywordCloud.length === 0 ? (
            <p className="text-sm text-muted-foreground">Import reviews to build a keyword cloud.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.reviews.keywordCloud.map((k) => (
                <span key={k.word} className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs" style={{ fontSize: `${Math.min(16, 10 + k.count)}px` }}>{k.word}</span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Sentiment summary</div>
          {sentiment.isLoading && <p className="text-sm text-muted-foreground">Reading reviews…</p>}
          {sentiment.data && (
            <>
              <p className="text-sm">{sentiment.data.summary}</p>
              {sentiment.data.themes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sentiment.data.themes.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistCard({ checklist }: { checklist: Array<{ key: string; label: string; ok: boolean }> }) {
  const done = checklist.filter((c) => c.ok).length;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Optimization Checklist</h3>
        <Badge variant="outline">{done}/{checklist.length}</Badge>
      </div>
      <div className="grid gap-1.5 md:grid-cols-2">
        {checklist.map((c) => (
          <div key={c.key} className={`flex items-center gap-2 text-sm ${c.ok ? "" : "text-muted-foreground"}`}>
            {c.ok ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------- Profile Tab ----------
function ProfileTab({ profile, onSaved }: { profile: Awaited<ReturnType<typeof gbpDashboard>>["profile"]; onSaved: () => void }) {
  const upsertFn = useServerFn(upsertGbpProfile);
  const [form, setForm] = useState({
    business_name: profile?.business_name ?? "",
    primary_category: profile?.primary_category ?? "",
    phone: profile?.phone ?? "",
    website: profile?.website ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    description: profile?.description ?? "",
    appointment_link: profile?.appointment_link ?? "",
    keywords: (profile?.keywords ?? []).join(", "),
    photo_count: profile?.photo_count ?? 0,
    video_count: profile?.video_count ?? 0,
    post_count: profile?.post_count ?? 0,
    qna_count: profile?.qna_count ?? 0,
  });
  const save = useMutation({
    mutationFn: (v: typeof form) => upsertFn({ data: {
      ...v,
      keywords: v.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      photo_count: Number(v.photo_count) || 0,
      video_count: Number(v.video_count) || 0,
      post_count: Number(v.post_count) || 0,
      qna_count: Number(v.qna_count) || 0,
    } }),
    onSuccess: () => { toast.success("Profile saved"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v as never }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Business Profile</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name"><Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} /></Field>
        <Field label="Primary category"><Input value={form.primary_category} onChange={(e) => set("primary_category", e.target.value)} placeholder="Music school" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Website"><Input value={form.website} onChange={(e) => set("website", e.target.value)} /></Field>
        <Field label="Address"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field label="Appointment / booking link"><Input value={form.appointment_link} onChange={(e) => set("appointment_link", e.target.value)} /></Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Rich, keyword-friendly description (aim for 400+ chars)." />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Keywords (comma separated)">
            <Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="piano classes, guitar lessons, trinity grade" />
          </Field>
        </div>
        <Field label="Photo count"><Input type="number" value={form.photo_count} onChange={(e) => set("photo_count", e.target.value)} /></Field>
        <Field label="Video count"><Input type="number" value={form.video_count} onChange={(e) => set("video_count", e.target.value)} /></Field>
        <Field label="Post count"><Input type="number" value={form.post_count} onChange={(e) => set("post_count", e.target.value)} /></Field>
        <Field label="Q&A count"><Input type="number" value={form.qna_count} onChange={(e) => set("qna_count", e.target.value)} /></Field>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ---------- Reviews Tab ----------
type Review = Awaited<ReturnType<typeof gbpDashboard>>["reviews"]["list"][number];
function ReviewsTab({ data, onChanged }: { data: Awaited<ReturnType<typeof gbpDashboard>>; onChanged: () => void }) {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
          <MiniStat label="Total" value={data.reviews.total} />
          <MiniStat label="Avg rating" value={data.reviews.avg > 0 ? data.reviews.avg.toFixed(2) : "—"} />
          <MiniStat label="Positive" value={data.reviews.positive} />
          <MiniStat label="Negative" value={data.reviews.negative} />
          <MiniStat label="Unanswered" value={data.reviews.unanswered} />
        </div>
        <Button size="sm" onClick={() => setImportOpen(true)}><Plus className="h-4 w-4" /> Import review</Button>
      </div>

      <div className="space-y-3">
        {data.reviews.list.length === 0 ? (
          <EmptyState message="No reviews yet. Import your first review to start." />
        ) : data.reviews.list.map((r) => (
          <ReviewCard key={r.id} review={r} onChanged={onChanged} />
        ))}
      </div>

      <ImportReviewDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); onChanged(); }} />
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ReviewCard({ review, onChanged }: { review: Review; onChanged: () => void }) {
  const [tone, setTone] = useState<"professional" | "friendly" | "premium" | "empathetic">("premium");
  const [reply, setReply] = useState(review.reply_text ?? "");
  const genFn = useServerFn(generateReviewReply);
  const saveFn = useServerFn(saveReviewReply);
  const gen = useMutation({
    mutationFn: () => genFn({ data: { id: review.id, tone } }),
    onSuccess: (r) => setReply(r.reply),
    onError: (e) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () => saveFn({ data: { id: review.id, reply_text: reply } }),
    onSuccess: () => { toast.success("Reply saved"); onChanged(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
          {(review.reviewer_name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{review.reviewer_name ?? "Anonymous"}</span>
            <span className="text-primary text-sm">{"★".repeat(review.rating)}<span className="text-muted-foreground">{"★".repeat(5 - review.rating)}</span></span>
            {review.sentiment && <Badge variant="outline" className="text-[10px] capitalize">{review.sentiment}</Badge>}
            {review.replied ? <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Replied</Badge> : <Badge variant="destructive" className="text-[10px]">Unanswered</Badge>}
            {review.reviewed_at && <span className="text-[10px] text-muted-foreground ml-auto">{new Date(review.reviewed_at).toLocaleDateString()}</span>}
          </div>
          {review.content && <p className="mt-1.5 text-sm text-muted-foreground">{review.content}</p>}

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="premium">Premium</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="empathetic">Empathetic</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => gen.mutate()} disabled={gen.isPending}>
                <Wand2 className="h-3.5 w-3.5" /> {gen.isPending ? "Drafting…" : "AI draft"}
              </Button>
            </div>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Write or generate a reply…" />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !reply.trim()}>{save.isPending ? "Saving…" : "Save reply"}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportReviewDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const importFn = useServerFn(importGbpReview);
  const [f, setF] = useState({ reviewer_name: "", rating: 5, content: "", reviewed_at: "" });
  const m = useMutation({
    mutationFn: () => importFn({ data: {
      reviewer_name: f.reviewer_name || null,
      rating: f.rating,
      content: f.content || null,
      reviewed_at: f.reviewed_at || null,
    } }),
    onSuccess: () => { toast.success("Review imported"); onDone(); setF({ reviewer_name: "", rating: 5, content: "", reviewed_at: "" }); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Import review</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Reviewer name"><Input value={f.reviewer_name} onChange={(e) => setF({ ...f, reviewer_name: e.target.value })} /></Field>
          <Field label="Rating">
            <select value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </Field>
          <Field label="Content"><Textarea rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>
          <Field label="Reviewed at (optional)"><Input type="date" value={f.reviewed_at} onChange={(e) => setF({ ...f, reviewed_at: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>{m.isPending ? "Saving…" : "Import"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Posts Tab ----------
function PostsTab({ posts, onChanged }: { posts: Awaited<ReturnType<typeof gbpDashboard>>["posts"]; onChanged: () => void }) {
  const genFn = useServerFn(generatePostIdeas);
  const createFn = useServerFn(createGbpPost);
  const [theme, setTheme] = useState("");
  const ideas = useMutation({ mutationFn: () => genFn({ data: { theme } }), onError: (e) => toast.error(e.message) });
  const create = useMutation({
    mutationFn: (v: { post_type: string; title: string; body: string }) => createFn({ data: { post_type: v.post_type, title: v.title, body: v.body, status: "draft" } }),
    onSuccess: () => { toast.success("Saved to drafts"); onChanged(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Post Planner</h3>
        </div>
        <div className="flex gap-2">
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme (e.g. Trinity results, festival, weekly tip)…" />
          <Button onClick={() => ideas.mutate()} disabled={ideas.isPending}>
            <Sparkles className="h-4 w-4" /> {ideas.isPending ? "Generating…" : "Generate ideas"}
          </Button>
        </div>
        {ideas.data && ideas.data.posts.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ideas.data.posts.map((p, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <Badge variant="outline" className="text-[10px] mb-1.5 capitalize">{p.post_type}</Badge>
                <div className="font-semibold text-sm">{p.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{p.body}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => create.mutate(p)}>Save draft</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Drafts & scheduled</h3>
        {posts.length === 0 ? <EmptyState message="No posts yet — generate ideas above." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {posts.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{p.post_type}</Badge>
                  <Badge className="text-[10px] capitalize" variant="secondary">{p.status}</Badge>
                </div>
                <div className="font-semibold text-sm">{p.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{p.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Competitors ----------
function CompetitorsTab({ data, onChanged }: { data: Awaited<ReturnType<typeof gbpDashboard>>; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const upsertFn = useServerFn(upsertCompetitor);
  const delFn = useServerFn(deleteCompetitor);
  const [f, setF] = useState({ name: "", url: "", review_count: 0, avg_rating: 0, photo_count: 0, post_count: 0, strengths: "", weaknesses: "" });
  const save = useMutation({
    mutationFn: () => upsertFn({ data: {
      name: f.name, url: f.url || null,
      review_count: Number(f.review_count), avg_rating: Number(f.avg_rating),
      photo_count: Number(f.photo_count), post_count: Number(f.post_count),
      strengths: f.strengths.split(",").map((s) => s.trim()).filter(Boolean),
      weaknesses: f.weaknesses.split(",").map((s) => s.trim()).filter(Boolean),
    } }),
    onSuccess: () => { toast.success("Competitor saved"); onChanged(); setOpen(false); setF({ name: "", url: "", review_count: 0, avg_rating: 0, photo_count: 0, post_count: 0, strengths: "", weaknesses: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => onChanged() });

  const you = {
    name: data.profile?.business_name ?? "You",
    review_count: data.reviews.total,
    avg_rating: data.reviews.avg,
    photo_count: data.profile?.photo_count ?? 0,
    post_count: data.profile?.post_count ?? 0,
    visibility_score: data.scores.visibility,
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Competitor Intelligence</h3>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add competitor</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="p-3">Business</th>
              <th className="p-3">Reviews</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Photos</th>
              <th className="p-3">Posts</th>
              <th className="p-3">Visibility</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-primary/5">
              <td className="p-3 font-semibold">{you.name} <Badge className="text-[10px] ml-1">You</Badge></td>
              <td className="p-3 tabular-nums">{you.review_count}</td>
              <td className="p-3 tabular-nums">{you.avg_rating.toFixed(2)} ★</td>
              <td className="p-3 tabular-nums">{you.photo_count}</td>
              <td className="p-3 tabular-nums">{you.post_count}</td>
              <td className="p-3 tabular-nums font-bold text-primary">{you.visibility_score}</td>
              <td />
            </tr>
            {data.competitors.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="p-3">{c.name}</td>
                <td className="p-3 tabular-nums">{c.review_count}</td>
                <td className="p-3 tabular-nums">{Number(c.avg_rating).toFixed(2)} ★</td>
                <td className="p-3 tabular-nums">{c.photo_count}</td>
                <td className="p-3 tabular-nums">{c.post_count}</td>
                <td className="p-3 tabular-nums">{c.visibility_score}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
            {data.competitors.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No competitors yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add competitor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Business name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="GBP URL"><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reviews"><Input type="number" value={f.review_count} onChange={(e) => setF({ ...f, review_count: Number(e.target.value) })} /></Field>
              <Field label="Avg rating"><Input type="number" step="0.1" value={f.avg_rating} onChange={(e) => setF({ ...f, avg_rating: Number(e.target.value) })} /></Field>
              <Field label="Photos"><Input type="number" value={f.photo_count} onChange={(e) => setF({ ...f, photo_count: Number(e.target.value) })} /></Field>
              <Field label="Posts"><Input type="number" value={f.post_count} onChange={(e) => setF({ ...f, post_count: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Strengths (comma separated)"><Input value={f.strengths} onChange={(e) => setF({ ...f, strengths: e.target.value })} /></Field>
            <Field label="Weaknesses (comma separated)"><Input value={f.weaknesses} onChange={(e) => setF({ ...f, weaknesses: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !f.name}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------- Actions ----------
function ActionsTab({ data, onChanged }: { data: Awaited<ReturnType<typeof gbpDashboard>>; onChanged: () => void }) {
  const updFn = useServerFn(updateActionStatus);
  const upd = useMutation({ mutationFn: (v: { id: string; status: "pending" | "in_progress" | "done" | "dismissed" }) => updFn({ data: v }), onSuccess: () => onChanged() });

  const pri: Record<string, string> = {
    high: "border-red-500/60 bg-red-500/5",
    normal: "border-border bg-card",
    low: "border-border bg-card",
  };

  const pending = data.actions.filter((a) => a.status === "pending");
  const inProgress = data.actions.filter((a) => a.status === "in_progress");
  const done = data.actions.filter((a) => a.status === "done");

  return (
    <>
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Daily Action Center</h3>
      </div>

      {data.actions.length === 0 ? (
        <EmptyState message="No actions yet. Click 'Regenerate actions' at the top." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[["To do", pending], ["In progress", inProgress], ["Done", done]].map(([label, list]) => (
            <div key={label as string}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{label as string} · {(list as typeof pending).length}</div>
              <div className="space-y-2">
                {(list as typeof pending).map((a) => (
                  <div key={a.id} className={`rounded-lg border p-3 ${pri[a.priority] ?? "border-border bg-card"}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{a.title}</div>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{a.category}</Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">{a.priority}</Badge>
                          {a.expected_impact && <Badge variant="outline" className="text-[10px]">{a.expected_impact}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {a.status !== "in_progress" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => upd.mutate({ id: a.id, status: "in_progress" })}>Start</Button>}
                      {a.status !== "done" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => upd.mutate({ id: a.id, status: "done" })}>Done</Button>}
                      {a.status !== "dismissed" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => upd.mutate({ id: a.id, status: "dismissed" })}>Dismiss</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- Timeline ----------
function TimelineTab({ snapshots }: { snapshots: Awaited<ReturnType<typeof gbpDashboard>>["snapshots"] }) {
  if (snapshots.length === 0) return <EmptyState message="No snapshots yet. Capture a snapshot to start your reputation timeline." />;
  const max = Math.max(...snapshots.map((s) => s.total_reviews ?? 0), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Reputation Timeline</h3>
      </div>
      <div className="space-y-2">
        {snapshots.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <div className="w-24 text-xs text-muted-foreground tabular-nums">{new Date(s.snapshot_date).toLocaleDateString()}</div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${((s.total_reviews ?? 0) / max) * 100}%` }} />
            </div>
            <div className="w-32 text-xs tabular-nums text-right">
              {s.total_reviews ?? 0} reviews · {Number(s.avg_rating ?? 0).toFixed(2)}★ · H{s.health_score ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{message}</div>;
}
