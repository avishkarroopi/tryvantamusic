/** Scale finder: root + scale -> notes with degrees, keyboard highlight, playback. */
import { useState } from "react";
import { Play } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { SCALES, SCALE_GROUPS, scaleDegrees, scaleNotes } from "../../../lib/theory/scales";
import { NOTE_NAMES } from "../../../lib/theory/notes";
import { playScale } from "../../../lib/theory/playback";

export function ScaleFinder() {
  const [root, setRoot] = useState("C");
  const [scaleId, setScaleId] = useState("major");
  const degrees = scaleDegrees(root, scaleId);
  const notes = scaleNotes(root, scaleId);
  const onSet = new Set(notes);

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {NOTE_NAMES.map((n) => (
          <button key={n} onClick={() => setRoot(n)} style={pill(n === root)}>{n}</button>
        ))}
      </div>

      <select value={scaleId} onChange={(e) => setScaleId(e.target.value)}
        style={{ height: 40, borderRadius: 10, padding: "0 12px", color: color.score,
          background: color.stage, border: `1px solid ${color.hairline}` }}>
        {SCALE_GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {SCALES.filter((s) => s.group === g).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </optgroup>
        ))}
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: font.mono, color: color.scoreMuted, flex: 1 }}>
          {degrees.map((d) => `${d.note}`).join(" · ")}
        </div>
        <button onClick={() => playScale(notes)} style={ico}><Play size={16} /></button>
      </div>

      <div style={{ display: "flex", gap: 1 }}>
        {["C", "D", "E", "F", "G", "A", "B"].map((w) => (
          <div key={w} style={{ flex: 1, height: 64, borderRadius: "0 0 4px 4px",
            background: onSet.has(w) ? color.signal : color.score, border: `1px solid ${color.hairline}`,
            display: "grid", alignItems: "end", justifyItems: "center", paddingBottom: 3,
            color: color.stage, fontSize: 10 }}>{onSet.has(w) ? w : ""}</div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {degrees.map((d) => (
          <span key={d.degree} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, fontFamily: font.mono,
            background: color.surfaceRaised, color: color.scoreMuted }}>{d.degree}: {d.note}</span>
        ))}
      </div>
    </div>
  );
}

const pill = (on: boolean): React.CSSProperties => ({ padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontSize: 13,
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}` });
const ico: React.CSSProperties = { width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.score, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
