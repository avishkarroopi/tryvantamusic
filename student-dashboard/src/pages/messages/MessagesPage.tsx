import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquareText, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { notifyAttentionChanged } from "@/hooks/useAttentionCounts";
import { messageService } from "@/services";
import { relativeFromNow } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/domain/types";

export function MessagesPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const channelsState = useAsync(() => messageService.listChannels(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");

  const activeChannel = useMemo(
    () => (channelsState.data ?? []).find((c) => c.id === channelId) ?? (channelsState.data ?? [])[0],
    [channelsState.data, channelId],
  );

  useEffect(() => {
    if (!activeChannel) return;
    setMessagesLoading(true);
    messageService.listMessages(activeChannel.id).then((msgs) => {
      setMessages(msgs);
      setMessagesLoading(false);
    });
    if (activeChannel.unreadCount > 0) {
      messageService.markChannelRead(activeChannel.id).then(() => {
        notifyAttentionChanged();
        channelsState.refetch();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  async function handleSend() {
    if (!draft.trim() || !activeChannel) return;
    const text = draft;
    setDraft("");
    const message = await messageService.sendMessage(activeChannel.id, text);
    setMessages((prev) => [...prev, message]);
  }

  return (
    <div>
      <PageHeader title="Messages" description="Chat with your teachers about upcoming classes." />

      <div
        className="grid grid-cols-1 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900 md:grid-cols-[18rem_1fr]"
        style={{ height: "70vh" }}
      >
        <div className={cn("flex-col border-r border-ink-100 dark:border-ink-800 md:flex", activeChannel && channelId ? "hidden md:flex" : "flex")}>
          <div className="overflow-y-auto">
            {channelsState.loading ? (
              <CardSkeleton rows={3} />
            ) : (channelsState.data ?? []).length === 0 ? (
              <EmptyState icon={<MessageSquareText className="size-6" />} title="No conversations yet" />
            ) : (
              (channelsState.data ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/dashboard/messages/${c.id}`)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-ink-50 p-3.5 text-left hover:bg-ink-50 dark:border-ink-800/60 dark:hover:bg-ink-800/40",
                    activeChannel?.id === c.id && "bg-brand-50/60 dark:bg-brand-500/10",
                  )}
                >
                  <Avatar name={c.teacherName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{c.teacherName}</p>
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ink-400 dark:text-ink-500">{c.lastMessage ?? "No messages yet"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={cn("flex-col md:flex", activeChannel && channelId ? "flex" : "hidden md:flex")}>
          {!activeChannel ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<MessageSquareText className="size-6" />} title="Select a conversation" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-ink-100 p-3.5 dark:border-ink-800">
                <button
                  onClick={() => navigate("/dashboard/messages")}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <Avatar name={activeChannel.teacherName} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{activeChannel.teacherName}</p>
                  {activeChannel.batchName && <p className="text-xs text-ink-400 dark:text-ink-500">{activeChannel.batchName}</p>}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messagesLoading ? (
                  <CardSkeleton rows={3} />
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex flex-col", m.sender === "student" ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          m.sender === "student"
                            ? "rounded-br-sm bg-brand-600 text-white"
                            : "rounded-bl-sm bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
                        )}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">{relativeFromNow(m.sentAt)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-ink-800">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="h-10 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  aria-label="Send message"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
