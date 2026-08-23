import { motion } from "framer-motion";
import { Play, Square, Minus, Plus } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useMetronome } from "../hooks/useMetronome";

const SIGS = [[2, 4], [3, 4], [4, 4], [6, 8]];

export function Metronome() {
  const m = useMetronome();
  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {Array.from({ length: m.beatsPerBar }).map((_, i) => (
          <motion.span key={i} animate={{
            scale: m.beat === i ? 1.35 : 1,
            background: m.beat === i ? (i === 0 ? color.peak : color.signal) : color.surfaceRaised,
          }} style={{ width: 16, height: 16, borderRadius: 999, display: "block" }} />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: font.mono, fontSize: 52, lineHeight: 1 }}>{m.bpm}</div>
        <div style={{ fontSize: 12, color: color.scoreMuted }}>BPM</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => m.setBpm(Math.max(30, m.bpm - 1))} style={rnd}><Minus size={16} /></button>
        <input type="range" min={30} max={300} value={m.bpm}
          onChange={(e) => m.setBpm(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: color.signal }} />
        <button onClick={() => m.setBpm(Math.min(300, m.bpm + 1))} style={rnd}><Plus size={16} /></button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {SIGS.map(([n, d]) => (
          <button key={`${n}/${d}`} onClick={() => m.setBeatsPerBar(n)}
            style={{ ...chip, ...(m.beatsPerBar === n ? active : {}) }}>{n}/{d}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={m.running ? m.stop : m.start} style={{ ...primary, flex: 1 }}>
          {m.running ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
        </button>
        <button onClick={m.tap} style={{ ...primary, background: color.surfaceRaised, color: color.score }}>Tap</button>
      </div>
    </div>
  );
}

const rnd: React.CSSProperties = { width: 36, height: 36, borderRadius: 999, cursor: "pointer",
  color: color.score, background: color.surfaceRaised, border: `1px solid ${color.hairline}`, display: "grid", placeItems: "center" };
const chip: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, cursor: "pointer",
  background: color.surface, color: color.scoreMuted, border: `1px solid ${color.hairline}`, fontFamily: font.mono };
const active: React.CSSProperties = { background: color.signal, color: color.stage, borderColor: color.signal };
const primary: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center", justifyContent: "center",
  padding: "12px", borderRadius: 12, cursor: "pointer", border: "none", background: color.signal, color: color.stage, fontWeight: 600 };
