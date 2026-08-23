/** M-Studio Master: a genuinely functional multi-track mixer — upload real
 *  audio per track, real per-track gain/pan, real master limiter + live
 *  loudness meter. Lite/Advanced toggle controls how much control surface
 *  is shown, matching the recovered prototype's UX intent. */
import { Play, Square, Upload, Trash2, Volume2 } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useStudioMixer } from "../hooks/useStudioMixer";

export function StudioMixer() {
  const m = useStudioMixer();

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["lite", "advanced"] as const).map((mo) => (
            <button key={mo} onClick={() => m.setMode(mo)} style={pill(m.mode === mo)}>{mo}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <label style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <Upload size={15} /> {m.loading ? "Loading…" : "Add track"}
            <input type="file" accept="audio/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void m.addTrack(f); e.target.value = ""; }} />
          </label>
          <button onClick={m.playing ? m.stop : m.play} style={primaryBtn} disabled={m.tracks.length === 0}>
            {m.playing ? <><Square size={15} /> Stop</> : <><Play size={15} /> Play mix</>}
          </button>
        </div>
      </div>

      {m.tracks.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center", color: color.scoreMuted, fontSize: 13, border: `1.5px dashed ${color.hairline}`, borderRadius: 12 }}>
          Add audio files to start mixing — each becomes its own track with real volume/pan control.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {m.tracks.map((t) => (
            <div key={t.id} style={{
              display: "grid", gridTemplateColumns: m.mode === "advanced" ? "1fr auto auto 90px 90px auto" : "1fr auto 90px auto",
              alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${t.id === m.selectedId ? color.signal : color.hairline}`, background: color.surfaceRaised,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>

              {m.mode === "advanced" && (
                <button onClick={() => m.updateTrack(t.id, { muted: !t.muted })}
                  style={miniBtn(t.muted)}>M</button>
              )}
              {m.mode === "advanced" && (
                <button onClick={() => m.updateTrack(t.id, { soloed: !t.soloed })}
                  style={miniBtn(t.soloed, color.peak)}>S</button>
              )}

              <input type="range" min={0} max={100} value={t.volume}
                onChange={(e) => m.updateTrack(t.id, { volume: Number(e.target.value) })} style={{ width: 90 }} />

              {m.mode === "advanced" && (
                <input type="range" min={-50} max={50} value={t.pan}
                  onChange={(e) => m.updateTrack(t.id, { pan: Number(e.target.value) })} style={{ width: 90 }} title="Pan" />
              )}

              <button onClick={() => m.removeTrack(t.id)} style={{ background: "transparent", border: "none", color: color.scoreMuted, cursor: "pointer" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Volume2 size={14} />
          <span style={{ fontSize: 12, color: color.scoreMuted, flex: 1 }}>Master</span>
          <input type="range" min={0} max={100} value={m.masterVolume} onChange={(e) => m.setMasterVolume(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <div style={{ height: 8, borderRadius: 4, background: color.stage, overflow: "hidden", border: `1px solid ${color.hairline}` }}>
          <div style={{
            height: "100%", width: `${Math.min(100, m.meterLevel * 140)}%`,
            background: m.meterLevel > 0.9 ? color.redzone : m.meterLevel > 0.7 ? color.peak : color.signal,
            transition: "width 60ms linear",
          }} />
        </div>
        <p style={{ fontSize: 11, color: color.scoreMuted, marginTop: 4 }}>Real-time output level through a mastering limiter (fast attack, 20:1 ratio near ceiling).</p>
      </div>
    </div>
  );
}

const pill = (on: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12, textTransform: "capitalize",
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}`,
});
const primaryBtn: React.CSSProperties = {
  display: "flex", gap: 6, alignItems: "center", height: 34, padding: "0 14px", borderRadius: 8, border: "none",
  cursor: "pointer", background: color.signal, color: color.stage, fontWeight: 600, fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${color.hairline}`, cursor: "pointer",
  background: "transparent", color: color.score, fontSize: 13,
};
const miniBtn = (active: boolean, activeColor: string = color.signal): React.CSSProperties => ({
  width: 22, height: 22, borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer",
  border: `1px solid ${active ? activeColor : color.hairline}`,
  background: active ? activeColor : "transparent", color: active ? color.stage : color.scoreMuted,
});
