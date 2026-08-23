import { useState } from "react";
import { LifeBuoy, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Native "Chat With Support" affordance — a self-contained replacement for
 * the third-party support-chat widget observed in the reference capture.
 * No external script is loaded; this is fully local UI.
 */
export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: "me" | "support"; text: string }[]>([
    { from: "support", text: "Hi! I'm the Muziclly support bot. Ask me anything about batches, trials, payouts or the app." },
  ]);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "me", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "support",
          text: "Thanks for the note — this is a demo widget backed by mock data. A real support agent will follow up once connected to the Muziclly Help Center API.",
        },
      ]);
    }, 700);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-pop hover:bg-brand-700 sm:bottom-6 sm:right-6"
      >
        <LifeBuoy className="size-[18px]" />
        <span className="hidden sm:inline">Chat With Support</span>
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop dark:border-ink-800 dark:bg-ink-900 sm:bottom-24">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Muziclly Support</p>
              <p className="text-xs text-brand-100">Typically replies in a few minutes</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md p-1 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "me"
                    ? "ml-auto rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-ink-100 p-2.5 dark:border-ink-800">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="h-9 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            />
            <Button size="sm" onClick={send} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
