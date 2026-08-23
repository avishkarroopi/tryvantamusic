/** Digital tuner: instrument select, animated needle, note + cents, in-tune LED. */
import { useState } from "react";
import { motion } from "framer-motion";
import { color, font } from "../../../design-system/tokens";
import { useTuner } from "../hooks/useTuner";
import { TUNINGS } from "../../../lib/theory/tunings";

export function Tuner({ analyser }: { analyser: AnalyserNode | null }) {
  const [tuningId, setTuningId] = useState("guitar");
  const r = useTuner(analyser, tuningId);
  const cents = r?.cents ?? 0;
  const angle = Math.max(-45, Math.min(45, cents * 0.9)); // ±50c -> ±45°

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {TUNINGS.map((t) => (
          <button key={t.id} onClick={() => setTuningId(t.id)}
            style={{
              padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13,
              color: tuningId === t.id ? color.stage : color.score,
              background: tuningId === t.id ? color.signal : color.surfaceRaised,
              border: `1px solid ${tuningId === t.id ? color.signal : color.hairline}`,
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ position: "relative", height: 140, display: "grid", placeItems: "end center" }}>
        <div style={{
          position: "absolute", top: 8, display: "flex", gap: 40,
          color: color.scoreMuted, fontFamily: font.mono, fontSize: 12,
        }}>
          <span>♭</span>
          <span style={{ color: r?.inTune ? color.signal : color.scoreMuted }}>●</span>
          <span>♯</span>
        </div>
        <motion.div animate={{ rotate: angle }} style={{
          width: 3, height: 110, borderRadius: 3, transformOrigin: "bottom center",
          background: r?.inTune ? color.signal : Math.abs(cents) < 15 ? color.peak : color.redzone,
        }} />
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: font.display, fontSize: 46, lineHeight: 1,
          color: r?.inTune ? color.signal : color.score,
        }}>{r ? `${r.note}${r.octave}` : "—"}</div>
        <div style={{ fontFamily: font.mono, fontSize: 13, color: color.scoreMuted }}>
          {r ? `${r.hz} Hz · ${cents > 0 ? "+" : ""}${cents}¢` : "play a note"}
          {r?.targetString && ` · target ${r.targetString}`}
        </div>
        {r?.inTune && <div style={{ marginTop: 6, color: color.signal, fontSize: 13 }}>In tune ✓</div>}
      </div>
    </div>
  );
}
