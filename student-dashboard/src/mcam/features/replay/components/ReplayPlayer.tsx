/** Recording replay: video + chapter scrubber, moment pins, bookmarks, playback
 *  speed, search-to-timestamp, and AI summary + homework panels. */
import { useMemo, useRef, useState } from "react";
import { Bookmark as BmIcon, Search, Gauge } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useReplay, type Recording } from "../hooks/useReplay";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function ReplayPlayer({ apiBase, token, sessionId, src }: {
  apiBase: string; token: string; sessionId: string; src?: string;
}) {
  const { rec, addBookmark } = useReplay(apiBase, token, sessionId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [query, setQuery] = useState("");

  const seek = (t: number) => { if (videoRef.current) { videoRef.current.currentTime = t; videoRef.current.play(); } };
  const setRate = (r: number) => { setSpeed(r); if (videoRef.current) videoRef.current.playbackRate = r; };

  const hits = useMemo(() => {
    if (!rec || !query.trim()) return [];
    const q = query.toLowerCase();
    return rec.moments.filter((m) => m.note.toLowerCase().includes(q));
  }, [rec, query]);

  if (!rec) return <div style={{ color: color.scoreMuted, padding: 20, fontFamily: font.body }}>No recording yet for this lesson.</div>;

  const dur = rec.duration_s || 1;
  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 14 }}>
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000" }}>
        <video ref={videoRef} src={src} controls style={{ width: "100%", display: "block", aspectRatio: "16/9" }} />
      </div>

      {/* chapter + moment scrubber */}
      <div style={{ position: "relative", height: 30 }}>
        <div style={{ position: "absolute", top: 13, left: 0, right: 0, height: 4, borderRadius: 999, background: color.surfaceRaised }} />
        {rec.chapters.map((c, i) => (
          <button key={i} title={c.title} onClick={() => seek(c.start)}
            style={{ position: "absolute", left: `${(c.start / dur) * 100}%`, top: 8, width: 3, height: 14,
              background: color.signal, border: "none", cursor: "pointer", borderRadius: 2 }} />
        ))}
        {rec.moments.map((m, i) => (
          <button key={`m${i}`} title={`${m.kind}: ${m.note}`} onClick={() => seek(m.at)}
            style={{ position: "absolute", left: `${(m.at / dur) * 100}%`, top: 4, width: 9, height: 9, borderRadius: 999,
              transform: "translateX(-50%)", cursor: "pointer", border: "none",
              background: m.kind === "correction" ? color.redzone : m.kind === "question" ? color.peak : color.signal }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => addBookmark("Bookmark", videoRef.current?.currentTime ?? 0)} style={pillBtn}>
          <BmIcon size={15} /> Bookmark here
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, ...pillBtn as any, cursor: "default" }}>
          <Gauge size={15} />
          {SPEEDS.map((r) => (
            <button key={r} onClick={() => setRate(r)} style={{ background: "none", border: "none", cursor: "pointer",
              color: speed === r ? color.signal : color.scoreMuted, fontFamily: font.mono, fontSize: 12 }}>{r}×</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 180,
          background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 10, padding: "6px 10px" }}>
          <Search size={15} color={color.scoreMuted} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search moments…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: color.score }} />
        </div>
      </div>

      {hits.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          {hits.map((m, i) => (
            <button key={i} onClick={() => seek(m.at)} style={{ ...rowBtn, textAlign: "left" }}>
              <span style={{ fontFamily: font.mono, color: color.signal }}>{fmt(m.at)}</span> · {m.note}
            </button>
          ))}
        </div>
      )}

      <Panels rec={rec} onSeek={seek} />
    </div>
  );
}

function Panels({ rec, onSeek }: { rec: Recording; onSeek: (t: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Card title="Chapters">
        {rec.chapters.map((c, i) => (
          <button key={i} onClick={() => onSeek(c.start)} style={rowBtn}>
            <span style={{ fontFamily: font.mono, color: color.signal }}>{fmt(c.start)}</span> · {c.title}
          </button>
        ))}
      </Card>
      <Card title="Bookmarks">
        {rec.bookmarks.length === 0 && <Empty />}
        {rec.bookmarks.map((b) => (
          <button key={b.id} onClick={() => onSeek(b.at_s)} style={rowBtn}>
            <span style={{ fontFamily: font.mono, color: color.peak }}>{fmt(b.at_s)}</span> · {b.label}
          </button>
        ))}
      </Card>
      <Card title="AI Summary">
        {rec.summary.map((s, i) => <div key={i} style={line}>• {s}</div>)}
      </Card>
      <Card title="Homework Extracted">
        {rec.homework.length === 0 && <Empty />}
        {rec.homework.map((h, i) => <div key={i} style={line}>• {h}</div>)}
      </Card>
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${`${Math.floor(s % 60)}`.padStart(2, "0")}`;
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: color.scoreMuted, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 4 }}>{children}</div>
    </div>
  );
}
function Empty() { return <div style={{ color: color.scoreMuted, fontSize: 13 }}>—</div>; }
const line: React.CSSProperties = { fontSize: 14, lineHeight: 1.4 };
const rowBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: color.score,
  fontSize: 14, padding: "4px 0", textAlign: "left" };
const pillBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10,
  background: color.surfaceRaised, color: color.score, border: `1px solid ${color.hairline}`, cursor: "pointer", fontSize: 13 };
