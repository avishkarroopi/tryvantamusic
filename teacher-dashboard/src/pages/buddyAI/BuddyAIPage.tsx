import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { makeId } from "@/lib/id";

interface Message {
  id: string;
  from: "me" | "buddy";
  text: string;
}

const SUGGESTIONS = [
  "Suggest a warm-up routine for a 8-year-old beginner",
  "How can I improve my trial conversion rate?",
  "Draft a practice plan for next week's batch",
];

const CANNED_REPLY =
  "This is a demo response from Muziclly Buddy AI. Once connected to the real assistant service, I'll give tailored teaching suggestions based on your students and batches.";

export function BuddyAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId("m"), from: "buddy", text: "Hi Arjun! I'm Muziclly Buddy AI. Ask me for lesson ideas, practice plans, or quick teaching tips." },
  ]);
  const [draft, setDraft] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: makeId("m"), from: "me", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, { id: makeId("m"), from: "buddy", text: CANNED_REPLY }]);
    }, 600);
  }

  return (
    <div>
      <PageHeader title="Muziclly Buddy AI" description="Your AI teaching assistant for lesson ideas and quick answers." />

      <Card className="flex h-[65vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  m.from === "buddy"
                    ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white"
                    : "bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-200"
                }`}
              >
                {m.from === "buddy" ? <Bot className="size-4" /> : <span className="text-xs font-bold">You</span>}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.from === "me"
                    ? "rounded-tr-sm bg-brand-600 text-white"
                    : "rounded-tl-sm bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-700"
              >
                <Sparkles className="size-3" /> {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-ink-100 p-3.5 dark:border-ink-800">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder="Ask Muziclly Buddy AI…"
            className="h-10 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
          />
          <Button onClick={() => send(draft)} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
