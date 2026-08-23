/** Instrument mode + DSP toggles + manual gain. Applying a profile flips the
 *  right DSP off for that instrument; toggles let the teacher override live. */
import { motion } from "framer-motion";
import { color, font } from "../../../design-system/tokens";
import { INSTRUMENTS } from "../../../lib/audio/audioProfiles";
import type { Toggles } from "../hooks/useAudioEngine";

export function AudioControls(p: {
  instrument: string; onInstrument: (id: string) => void;
  toggles: Toggles; onToggle: (k: keyof Toggles) => void;
  gain: number; onGain: (v: number) => void;
}) {
  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, padding: 16 }}>
      <div>
        <Label>Instrument mode</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INSTRUMENTS.map((i) => {
            const active = i.id === p.instrument;
            return (
              <motion.button key={i.id} whileTap={{ scale: 0.96 }} onClick={() => p.onInstrument(i.id)}
                style={{
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13,
                  color: active ? color.stage : color.score,
                  background: active ? color.signal : color.surfaceRaised,
                  border: `1px solid ${active ? color.signal : color.hairline}`,
                }}>{i.label}</motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Signal processing</Label>
        <div style={{ display: "grid", gap: 8 }}>
          <Switch label="Echo Cancellation" hint="Off for instruments (needs headphones)"
            on={p.toggles.echoCancellation} onClick={() => p.onToggle("echoCancellation")} />
          <Switch label="Noise Suppression" hint="Off preserves musical detail"
            on={p.toggles.noiseSuppression} onClick={() => p.onToggle("noiseSuppression")} />
          <Switch label="Auto Gain Control" hint="Off stops dynamics being flattened"
            on={p.toggles.autoGainControl} onClick={() => p.onToggle("autoGainControl")} />
        </div>
      </div>

      <div>
        <Label>Manual gain · {p.gain.toFixed(2)}×</Label>
        <input type="range" min={0} max={2} step={0.01} value={p.gain}
          onChange={(e) => p.onGain(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: color.signal }} />
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase",
    color: color.scoreMuted, marginBottom: 8 }}>{children}</div>;
}
function Switch(p: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={p.onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12,
      background: color.surface, border: `1px solid ${color.hairline}`, cursor: "pointer", textAlign: "left",
    }}>
      <span style={{
        width: 38, height: 22, borderRadius: 999, padding: 2, flexShrink: 0,
        background: p.on ? color.signal : color.surfaceRaised, transition: "background 150ms",
      }}>
        <motion.span layout style={{
          display: "block", width: 18, height: 18, borderRadius: 999, background: color.score,
          marginLeft: p.on ? 16 : 0, transition: "margin 150ms",
        }} />
      </span>
      <span style={{ flex: 1 }}>
        <div style={{ color: color.score, fontSize: 14 }}>{p.label}</div>
        <div style={{ color: color.scoreMuted, fontSize: 12 }}>{p.hint}</div>
      </span>
    </button>
  );
}
