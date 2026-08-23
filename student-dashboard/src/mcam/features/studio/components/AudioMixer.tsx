/** OBS-style audio mixer: channel strips (Microphone / Instrument / Desktop /
 *  System). Fader, mute, solo, live monitor, and a real meter per channel. */
import { Volume2, VolumeX, Headphones, Radio } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import type { MixerChannel } from "../model";

export function AudioMixer(p: {
  channels: MixerChannel[]; levels: Record<string, number>;
  onChange: (id: string, patch: Partial<MixerChannel>) => void;
}) {
  return (
    <div style={{
      fontFamily: font.body, color: color.score, padding: 14, display: "flex", gap: 14,
      background: "rgba(22,26,33,0.7)", backdropFilter: "blur(16px)", borderRadius: 14,
      border: `1px solid ${color.hairline}`, overflowX: "auto",
    }}>
      {p.channels.map((ch) => {
        const lvl = Math.min(1, (p.levels[ch.id] ?? 0) * 3); // visual scale
        return (
          <div key={ch.id} style={{
            width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            padding: 10, borderRadius: 12, background: color.surface, border: `1px solid ${color.hairline}`,
          }}>
            <span style={{ fontSize: 11, color: color.scoreMuted, textAlign: "center", height: 28 }}>{ch.label}</span>

            <div style={{ display: "flex", gap: 6, height: 120 }}>
              <div style={{ position: "relative", width: 8, background: color.stage, borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: `${lvl * 100}%`,
                  background: lvl > 0.85 ? color.redzone : lvl > 0.6 ? color.peak : color.signal,
                  transition: "height 60ms linear",
                }} />
              </div>
              <input type="range" min={0} max={1.5} step={0.01} value={ch.gain}
                onChange={(e) => p.onChange(ch.id, { gain: parseFloat(e.target.value) })}
                // vertical fader
                style={{ writingMode: "vertical-lr" as any, direction: "rtl", accentColor: color.signal, height: 120 }} />
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <Btn on={ch.muted} tone={color.redzone} label="Mute"
                onClick={() => p.onChange(ch.id, { muted: !ch.muted })}>
                {ch.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</Btn>
              <Btn on={ch.solo} tone={color.peak} label="Solo"
                onClick={() => p.onChange(ch.id, { solo: !ch.solo })}><Radio size={14} /></Btn>
              <Btn on={ch.monitor} tone={color.signal} label="Monitor"
                onClick={() => p.onChange(ch.id, { monitor: !ch.monitor })}><Headphones size={14} /></Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Btn(p: { children: React.ReactNode; on: boolean; tone: string; label: string; onClick: () => void }) {
  return (
    <button onClick={p.onClick} title={p.label} aria-label={p.label} style={{
      width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center", cursor: "pointer",
      color: p.on ? color.stage : color.scoreMuted, background: p.on ? p.tone : color.surfaceRaised,
      border: `1px solid ${p.on ? p.tone : color.hairline}`,
    }}>{p.children}</button>
  );
}
