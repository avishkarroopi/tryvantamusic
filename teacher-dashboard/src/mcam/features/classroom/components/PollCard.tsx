/** Live poll: teacher creates; everyone votes; results animate as bars. */
import { useState } from "react";
import { motion } from "framer-motion";
import { color, font } from "../../../design-system/tokens";
import type { Poll } from "../hooks/useRealtime";

export function PollCard(props: {
  poll: Poll | null; isTeacher: boolean;
  onCreate: (q: string, opts: string[], anon: boolean) => void;
  onVote: (pollId: string, optionIndex: number) => void;
}) {
  const { poll, isTeacher, onCreate, onVote } = props;
  const [q, setQ] = useState(""); const [opts, setOpts] = useState(["", ""]);
  const [anon, setAnon] = useState(false); const [voted, setVoted] = useState<number | null>(null);

  const card: React.CSSProperties = {
    background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 14,
    padding: 16, fontFamily: font.body, color: color.score,
  };

  if (!poll) {
    if (!isTeacher) return null;
    return (
      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>New poll</div>
        <input placeholder="Question" value={q} onChange={(e) => setQ(e.target.value)} style={inp} />
        {opts.map((o, i) => (
          <input key={i} placeholder={`Option ${i + 1}`} value={o}
            onChange={(e) => setOpts((x) => x.map((v, j) => (j === i ? e.target.value : v)))} style={inp} />
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
          <button onClick={() => setOpts((x) => [...x, ""])} style={ghost}>+ Option</button>
          <label style={{ fontSize: 13, color: color.scoreMuted, display: "flex", gap: 6 }}>
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Anonymous
          </label>
          <button style={{ ...primary, marginLeft: "auto" }}
            onClick={() => onCreate(q.trim(), opts.map((o) => o.trim()).filter(Boolean), anon)}>
            Launch
          </button>
        </div>
      </div>
    );
  }

  const total = Math.max(1, poll.total_votes);
  return (
    <div style={card}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{poll.question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {poll.options.map((opt, i) => {
          const pct = Math.round((poll.counts[i] / total) * 100);
          return (
            <button key={i} disabled={voted !== null || poll.closed}
              onClick={() => { setVoted(i); onVote(poll.id, i); }}
              style={{
                position: "relative", textAlign: "left", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${voted === i ? color.signal : color.hairline}`,
                background: color.stage, color: color.score, cursor: voted === null ? "pointer" : "default",
                overflow: "hidden",
              }}>
              <motion.div layout initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                style={{ position: "absolute", inset: 0, background: "rgba(51,201,160,0.16)" }} />
              <span style={{ position: "relative" }}>{opt}</span>
              <span style={{ position: "relative", float: "right", color: color.scoreMuted }}>{pct}%</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: color.scoreMuted }}>
        {poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"}{poll.anonymous ? " · anonymous" : ""}
        {poll.closed ? " · closed" : ""}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px", marginBottom: 8, borderRadius: 10,
  background: "#0E1116", color: "#F5F2EC", border: "1px solid #232833", outline: "none",
};
const primary: React.CSSProperties = {
  height: 36, padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "#33C9A0", color: "#0E1116", fontWeight: 600,
};
const ghost: React.CSSProperties = {
  height: 36, padding: "0 12px", borderRadius: 10, cursor: "pointer",
  background: "transparent", color: "#A7ADBA", border: "1px solid #232833",
};
