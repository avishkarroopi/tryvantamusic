/** Rhythm trainer: count-in, loop practice, gradual tempo increase, groove library. */
import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useMetronome } from "../hooks/useMetronome";

const GROOVES = [
  { id: "straight", label: "Straight 4/4", bpb: 4 },
  { id: "waltz", label: "Waltz 3/4", bpb: 3 },
  { id: "shuffle", label: "Shuffle", bpb: 4 },
  { id: "68", label: "6/8 Feel", bpb: 6 },
];

export function RhythmTrainer() {
  const m = useMetronome();
  const [loopBars, setLoopBars] = useState(4);
  const [increaseBy, setIncreaseBy] = useState(5);
  const [everyBars, setEveryBars] = useState(4);
  const [groove, setGroove] = useState("straight");
  const barCount = useRef(0);
  const lastBeat = useRef(-1);

  // count bars from the visual beat; bump tempo every N bars (tempo increase)
  useEffect(() => {
    if (m.beat === 0 && lastBeat.current !== 0 && m.running) {
      barCount.current += 1;
      if (barCount.current % everyBars === 0) m.setBpm(Math.min(300, m.bpm + increaseBy));
    }
    lastBeat.current = m.beat;
  }, [m.beat, m.running]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14 }}>
      <div>
        <Label>Groove library</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GROOVES.map((g) => (
            <button key={g.id} onClick={() => { setGroove(g.id); m.setBeatsPerBar(g.bpb); }}
              style={pill(groove === g.id)}>{g.label}</button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontFamily: font.mono, fontSize: 40 }}>{m.bpm}<span style={{ fontSize: 14, color: color.scoreMuted }}> BPM</span></div>

      <NumRow label="Loop (bars)" value={loopBars} set={setLoopBars} min={1} max={16} />
      <NumRow label="Increase BPM by" value={increaseBy} set={setIncreaseBy} min={1} max={20} />
      <NumRow label="Every (bars)" value={everyBars} set={setEveryBars} min={1} max={16} />

      <button onClick={m.running ? m.stop : () => { barCount.current = 0; m.start(); }}
        style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: 12,
          borderRadius: 12, border: "none", cursor: "pointer", background: color.signal, color: color.stage, fontWeight: 600 }}>
        {m.running ? <><Square size={16} /> Stop</> : <><Play size={16} /> Count-in & Start</>}
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, textTransform: "uppercase", color: color.scoreMuted, marginBottom: 6 }}>{children}</div>;
}
function NumRow({ label, value, set, min, max }: { label: string; value: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: color.scoreMuted }}>
      {label}
      <input type="number" min={min} max={max} value={value} onChange={(e) => set(parseInt(e.target.value) || min)}
        style={{ width: 64, height: 34, borderRadius: 8, textAlign: "center", color: color.score,
          background: color.stage, border: `1px solid ${color.hairline}` }} />
    </label>
  );
}
const pill = (on: boolean): React.CSSProperties => ({ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13,
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}` });
