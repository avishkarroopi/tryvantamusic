import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/app-shell";
import { getCopilotHistory, askCopilot, clearCopilotHistory, generateBrief, listBriefs } from "@/lib/copilot.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, RotateCcw, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/copilot")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(historyOpts()),
      context.queryClient.ensureQueryData(briefsOpts()),
    ]);
  },
  component: CopilotPage,
});

const historyOpts = () => queryOptions({ queryKey: ["copilot", "history"], queryFn: () => getCopilotHistory() });
const briefsOpts = () => queryOptions({ queryKey: ["copilot", "briefs"], queryFn: () => listBriefs({ data: { limit: 6 } }) });

const SUGGESTIONS = [
  "How many hot leads arrived this week?",
  "Which campaign is performing best?",
  "Which city generated highest revenue?",
  "Which leads need follow-up today?",
  "What is our enrollment conversion rate?",
  "What is our best performing instrument?",
];

function CopilotPage() {
  const { data: history } = useSuspenseQuery(historyOpts());
  const { data: briefs } = useSuspenseQuery(briefsOpts());
  const qc = useQueryClient();
  const askFn = useServerFn(askCopilot);
  const clearFn = useServerFn(clearCopilotHistory);
  const briefFn = useServerFn(generateBrief);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const askMut = useMutation({
    mutationFn: askFn,
    onMutate: () => setInput(""),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["copilot", "history"] }),
    onError: (e) => toast.error(e.message),
    onSettled: () => taRef.current?.focus(),
  });
  const clearMut = useMutation({
    mutationFn: clearFn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["copilot", "history"] }); toast.success("History cleared"); },
  });
  const briefMut = useMutation({
    mutationFn: briefFn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["copilot", "briefs"] }); toast.success("Brief generated"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history.length, askMut.isPending]);

  useEffect(() => { taRef.current?.focus(); }, []);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || askMut.isPending) return;
    askMut.mutate({ data: { message: t } });
  };

  return (
    <>
      <PageHeader
        eyebrow="V4 · Founder Copilot"
        title="Founder Copilot"
        description="Ask anything about your business. Copilot reads live lead, revenue, and review data."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={briefMut.isPending} onClick={() => briefMut.mutate({ data: { period: "daily" } })}>
              <FileText className="h-4 w-4" /> Daily brief
            </Button>
            <Button variant="outline" size="sm" disabled={briefMut.isPending} onClick={() => briefMut.mutate({ data: { period: "weekly" } })}>Weekly</Button>
            <Button variant="outline" size="sm" disabled={briefMut.isPending} onClick={() => briefMut.mutate({ data: { period: "monthly" } })}>Monthly</Button>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => clearMut.mutate({})}>
                <RotateCcw className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6 md:p-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-14rem)] rounded-xl border border-border bg-card overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {history.length === 0 && !askMut.isPending && (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">How can I help?</h3>
                  <p className="text-sm text-muted-foreground mt-1">I have live access to leads, qualification, revenue, and reviews.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {history.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {askMut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 bg-muted flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:120ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border p-3 flex gap-2 items-end"
          >
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about leads, revenue, campaigns…"
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
            />
            <Button type="submit" disabled={!input.trim() || askMut.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Recent briefs</div>
            {briefs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No briefs generated yet.</div>
            ) : (
              <div className="space-y-3">
                {briefs.map((b) => (
                  <div key={b.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary">
                      <FileText className="h-3 w-3" /> {b.period}
                      <span className="text-muted-foreground ml-auto">{new Date(b.generated_at).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed">{b.summary}</p>
                    {Array.isArray(b.highlights) && b.highlights.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                        {(b.highlights as string[]).slice(0, 4).map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
