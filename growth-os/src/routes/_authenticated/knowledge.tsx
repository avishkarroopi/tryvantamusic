import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listKnowledge, upsertKnowledge, deleteKnowledge } from "@/lib/agents.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge — AI Workforce" }] }),
  component: KnowledgePage,
});

type Entry = { id: string; category: string; title: string; content: string; tags: string[]; updated_at: string };

function KnowledgePage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listKnowledge);
  const save = useServerFn(upsertKnowledge);
  const del = useServerFn(deleteKnowledge);

  const { data, isLoading } = useQuery({ queryKey: ["knowledge"], queryFn: () => fetchList() });

  const [editing, setEditing] = useState<Partial<Entry> | null>(null);

  const saveMut = useMutation({
    mutationFn: (payload: Partial<Entry>) => save({ data: {
      id: payload.id, category: payload.category ?? "", title: payload.title ?? "",
      content: payload.content ?? "", tags: payload.tags ?? [],
    } }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  const entries = (data ?? []) as Entry[];
  const byCategory = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.category] ||= []).push(e); return acc;
  }, {});

  return (
    <div>
      <PageHeader
        eyebrow="AI Workforce"
        title="Knowledge base"
        description="SOPs, policies, pricing, FAQs, syllabus. Every agent retrieves knowledge here before acting."
        actions={
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ category: "", title: "", content: "", tags: [] })}>
                <Plus className="h-4 w-4" /> New entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit entry" : "New entry"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Category (e.g. sop, pricing, faq, syllabus)" value={editing?.category ?? ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                <Input placeholder="Title" value={editing?.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <Textarea rows={10} placeholder="Content" value={editing?.content ?? ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
                <Input placeholder="Tags (comma-separated)" value={(editing?.tags ?? []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button disabled={saveMut.isPending} onClick={() => editing && saveMut.mutate(editing)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 md:p-8 space-y-6">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No knowledge yet. Add SOPs, pricing, FAQs, syllabus to power your agents.</p>
          </Card>
        ) : (
          Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="font-display font-semibold mb-3 capitalize">{cat}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((e) => (
                  <Card key={e.id} className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{e.title}</div>
                        <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{e.content}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => delMut.mutate(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    {e.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {e.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
