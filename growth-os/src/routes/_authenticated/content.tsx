import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { listContent, upsertContent, setContentStatus, deleteContent, generateContent } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/content")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  component: ContentPage,
});
const opts = () => queryOptions({ queryKey: ["content"], queryFn: () => listContent({ data: {} }) });

const KINDS = ["post", "reel", "story", "blog", "email", "template", "video", "carousel"] as const;
const CATEGORIES = ["parent_education", "success_story", "testimonial", "music_tips", "founder", "promotion"];

function ContentPage() {
  const { data: items } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const upFn = useServerFn(upsertContent);
  const statusFn = useServerFn(setContentStatus);
  const delFn = useServerFn(deleteContent);
  const genFn = useServerFn(generateContent);

  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState({ kind: "post" as (typeof KINDS)[number], topic: "", audience: "parents of 6-12 year olds", platform: "instagram", tone: "warm, credible", variants: 3 });

  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState({ kind: "post" as (typeof KINDS)[number], title: "", body: "", category: "", platform: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["content"] });
  const upMut = useMutation({ mutationFn: upFn, onSuccess: () => { invalidate(); setNewOpen(false); setDraft({ ...draft, title: "", body: "" }); toast.success("Saved"); }, onError: (e) => toast.error(e.message) });
  const statusMut = useMutation({ mutationFn: statusFn, onSuccess: () => { invalidate(); toast.success("Updated"); } });
  const delMut = useMutation({ mutationFn: delFn, onSuccess: () => { invalidate(); toast.success("Deleted"); } });
  const genMut = useMutation({
    mutationFn: genFn,
    onSuccess: (r) => { invalidate(); setGenOpen(false); toast.success(`${r.generated} draft${r.generated === 1 ? "" : "s"} generated`); },
    onError: (e) => toast.error(e.message),
  });

  const groups = KINDS.reduce<Record<string, typeof items>>((acc, k) => { acc[k] = items.filter((i) => i.kind === k); return acc; }, {});

  return (
    <>
      <PageHeader
        eyebrow="V10 · Content & Social Intelligence"
        title="Content Studio"
        description="Plan, generate, and approve content. Nothing publishes automatically — human approval required."
        actions={
          <div className="flex gap-2">
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Sparkles className="h-4 w-4" /> AI generate</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate content drafts</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Kind">
                    <select value={gen.kind} onChange={(e) => setGen({ ...gen, kind: e.target.value as (typeof KINDS)[number] })} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
                      {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </F>
                  <F label="Platform"><Input value={gen.platform} onChange={(e) => setGen({ ...gen, platform: e.target.value })} /></F>
                  <F label="Audience"><Input value={gen.audience} onChange={(e) => setGen({ ...gen, audience: e.target.value })} /></F>
                  <F label="Tone"><Input value={gen.tone} onChange={(e) => setGen({ ...gen, tone: e.target.value })} /></F>
                  <F label="Variants"><Input type="number" min="1" max="5" value={gen.variants} onChange={(e) => setGen({ ...gen, variants: Number(e.target.value) })} /></F>
                </div>
                <div className="space-y-1"><Label className="text-xs">Topic / brief</Label><Textarea rows={3} value={gen.topic} onChange={(e) => setGen({ ...gen, topic: e.target.value })} placeholder="e.g. Diwali offer — piano beginner batch for kids 7-10" /></div>
                <div className="flex justify-end">
                  <Button disabled={!gen.topic || genMut.isPending} onClick={() => genMut.mutate({ data: gen })}>{genMut.isPending ? "Generating…" : "Generate drafts"}</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> New</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New content</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Kind">
                    <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as (typeof KINDS)[number] })} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
                      {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </F>
                  <F label="Platform"><Input value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} placeholder="instagram, youtube…" /></F>
                  <F label="Category">
                    <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
                      <option value="">—</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                    </select>
                  </F>
                </div>
                <F label="Title"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></F>
                <F label="Body"><Textarea rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></F>
                <div className="flex justify-end">
                  <Button disabled={!draft.title || upMut.isPending} onClick={() => upMut.mutate({ data: { kind: draft.kind, title: draft.title, body: draft.body || null, platform: draft.platform || null, category: draft.category || null } })}>Save draft</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["idea", "draft", "approved", "scheduled", "published"] as const).map((s) => (
            <div key={s} className="rounded-lg border border-border bg-card p-3">
              <div className="text-[10px] uppercase text-muted-foreground">{s}</div>
              <div className="font-display text-2xl font-bold tabular-nums">{items.filter((i) => i.status === s).length}</div>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">No content yet. Click "AI generate" or "New" to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {KINDS.filter((k) => groups[k].length > 0).map((k) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{k}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {groups[k].map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={item.status === "published" ? "default" : item.status === "approved" ? "secondary" : "outline"} className="text-[10px]">{item.status}</Badge>
                        {item.ai_generated && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="h-2.5 w-2.5" /> AI</Badge>}
                        {item.platform && <span className="text-[10px] text-muted-foreground">{item.platform}</span>}
                        <div className="ml-auto flex gap-1">
                          {item.status === "draft" && (
                            <Button size="sm" variant="ghost" onClick={() => statusMut.mutate({ data: { id: item.id, status: "approved" } })}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                          {item.status === "approved" && (
                            <Button size="sm" variant="ghost" onClick={() => statusMut.mutate({ data: { id: item.id, status: "published" } })}>Mark published</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => delMut.mutate({ data: { id: item.id } })}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <div className="font-semibold text-sm mb-1">{item.title}</div>
                      {item.body && <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{item.body}</p>}
                    </div>
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
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>; }
