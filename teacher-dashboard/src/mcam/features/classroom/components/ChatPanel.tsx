/** Real-time chat: messages, typing indicator, unread counter, pinned + announcements. */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Megaphone, Send } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import type { ChatMsg } from "../hooks/useRealtime";

interface Props {
  messages: ChatMsg[]; typing: string[]; selfId: string; canAnnounce: boolean;
  onSend: (body: string) => void; onTyping: (t: boolean) => void;
  onAnnounce: (body: string) => void; onOpen: () => void;
}

export function ChatPanel(p: Props) {
  const [text, setText] = useState("");
  const [announce, setAnnounce] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number>(undefined);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [p.messages]);
  useEffect(() => { p.onOpen(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    if (announce) p.onAnnounce(body); else p.onSend(body);
    setText(""); setAnnounce(false); p.onTyping(false);
  };

  const onChange = (v: string) => {
    setText(v);
    p.onTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => p.onTyping(false), 1200);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: color.surface, fontFamily: font.body, color: color.score,
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence initial={false}>
          {p.messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ alignSelf: m.user_id === p.selfId ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ fontSize: 11, color: color.scoreMuted, marginBottom: 2 }}>{m.display_name}</div>
              <div style={{
                padding: "8px 11px", borderRadius: 12, fontSize: 14, lineHeight: 1.35,
                background: m.user_id === p.selfId ? color.signalDim : color.surfaceRaised,
              }}>{m.body}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div style={{ height: 18, padding: "0 12px", fontSize: 12, color: color.scoreMuted }}>
        {p.typing.length > 0 && `${p.typing.join(", ")} ${p.typing.length === 1 ? "is" : "are"} typing…`}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${color.hairline}` }}>
        {p.canAnnounce && (
          <button onClick={() => setAnnounce((a) => !a)} aria-label="Announcement mode"
            title="Send as announcement"
            style={{
              width: 40, borderRadius: 10, cursor: "pointer",
              color: announce ? color.peak : color.scoreMuted,
              background: color.surfaceRaised, border: `1px solid ${color.hairline}`,
            }}><Megaphone size={16} /></button>
        )}
        <input value={text} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={announce ? "Announcement to everyone…" : "Message"}
          style={{
            flex: 1, height: 40, padding: "0 12px", borderRadius: 10, outline: "none",
            color: color.score, background: color.stage,
            border: `1px solid ${announce ? color.peak : color.hairline}`,
          }} />
        <button onClick={submit} aria-label="Send"
          style={{
            width: 40, borderRadius: 10, cursor: "pointer", color: color.stage,
            background: color.signal, border: "none",
          }}><Send size={16} /></button>
      </div>
    </div>
  );
}

export function PinnedBar({ text }: { text: string }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center", padding: "8px 12px",
      background: "rgba(245,165,36,0.1)", borderBottom: `1px solid ${color.hairline}`,
      color: color.score, fontFamily: font.body, fontSize: 13,
    }}>
      <Pin size={14} color={color.peak} /> {text}
    </div>
  );
}
