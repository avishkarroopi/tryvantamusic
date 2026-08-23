/** Virtual M-Key: playable piano keyboard with chord/scale overlays and a
 *  lightweight auto-accompaniment arranger. A "large" tool — render full-width. */
import { color, font } from "../../../design-system/tokens";
import { ROOTS, useVirtualKeyboard, type ArrangerStyle } from "../hooks/useVirtualKeyboard";

const WHITE_KEY_W = 42;

export function VirtualKeyboard() {
  const k = useVirtualKeyboard();
  const whiteKeys = k.keys.filter((key) => key.isWhite);
  const blackKeys = k.keys.filter((key) => !key.isWhite);
  const width = whiteKeys.length * WHITE_KEY_W;

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["none", "chord", "scale"] as const).map((o) => (
            <button key={o} onClick={() => k.setOverlay(o)} style={pill(k.overlay === o)}>{o === "none" ? "Free play" : o}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={k.root} onChange={(e) => k.setRoot(e.target.value)} style={select}>
            {ROOTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {k.overlay === "chord" && (
            <select value={k.quality} onChange={(e) => k.setQuality(e.target.value)} style={select}>
              {k.chordQualities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          )}
          {k.overlay === "scale" && (
            <select value={k.scaleId} onChange={(e) => k.setScaleId(e.target.value)} style={select}>
              {k.scales.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => k.setOctave(Math.max(1, k.octave - 1))} style={ghostBtn}>Oct −</button>
            <span style={{ display: "grid", placeItems: "center", fontSize: 12, color: color.scoreMuted, minWidth: 24, textAlign: "center" }}>{k.octave}</span>
            <button onClick={() => k.setOctave(Math.min(7, k.octave + 1))} style={ghostBtn}>Oct +</button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${color.hairline}`, background: color.surface, padding: 16 }}>
        <div style={{ position: "relative", height: 150, width, margin: "0 auto" }}>
          {whiteKeys.map((key, i) => {
            const isOverlay = k.overlayPcs.has(((key.midi % 12) + 12) % 12);
            const isRoot = k.isRootPc(key.midi);
            const active = k.activeKeys.has(key.midi);
            return (
              <button key={key.midi} onClick={() => k.playNote(key.midi)}
                style={{
                  position: "absolute", left: i * WHITE_KEY_W, top: 0, width: WHITE_KEY_W - 2, height: 150,
                  borderRadius: "0 0 6px 6px", border: `1px solid ${color.hairline}`, cursor: "pointer",
                  background: active ? "#dff5ee" : "#F5F2EC",
                  boxShadow: active ? `inset 0 0 0 2px ${color.signal}` : "0 2px 3px rgba(0,0,0,0.3)",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 8, gap: 4,
                }}>
                {isOverlay && (
                  <span style={{
                    width: 16, height: 16, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700,
                    background: isRoot ? color.signal : "rgba(51,201,160,0.5)", color: isRoot ? color.stage : "#0E1116",
                  }}>{isRoot ? "R" : ""}</span>
                )}
                <span style={{ fontSize: 9, color: "#8a8f99" }}>{k.noteName(key.midi)}</span>
              </button>
            );
          })}
          {blackKeys.map((key) => {
            // position black key between the two adjacent white keys
            const pc = ((key.midi % 12) + 12) % 12;
            const whiteBefore = whiteKeys.filter((w) => w.midi < key.midi).length - 1;
            const offset = [1, 3, 6, 8, 10].includes(pc) ? WHITE_KEY_W * 0.68 : 0;
            const isOverlay = k.overlayPcs.has(pc);
            const active = k.activeKeys.has(key.midi);
            return (
              <button key={key.midi} onClick={() => k.playNote(key.midi)}
                style={{
                  position: "absolute", left: whiteBefore * WHITE_KEY_W + offset, top: 0,
                  width: WHITE_KEY_W * 0.62, height: 92, zIndex: 2, borderRadius: "0 0 4px 4px", border: "none", cursor: "pointer",
                  background: active ? color.signalDim : "#15181e",
                  boxShadow: isOverlay ? `inset 0 0 0 2px ${color.signal}` : "0 3px 4px rgba(0,0,0,0.5)",
                }} />
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["off", "basic", "arpeggio", "waltz"] as ArrangerStyle[]).map((a) => (
            <button key={a} onClick={() => k.setArranger(a)} style={pill(k.arranger === a)}>
              {a === "off" ? "Arranger off" : a}
            </button>
          ))}
        </div>
        {k.arranger !== "off" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: color.scoreMuted }}>{k.bpm} BPM</span>
            <input type="range" min={60} max={160} value={k.bpm} onChange={(e) => k.setBpm(Number(e.target.value))} />
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: color.scoreMuted, margin: 0 }}>
        The arranger plays a live backing pattern from the current chord ({k.root} {k.chordQualities.find((c) => c.id === k.quality)?.label}) —
        switch overlay to <b>chord</b> and pick a root/quality to change what it plays.
      </p>
    </div>
  );
}

const pill = (on: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12, textTransform: "capitalize",
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}`,
});
const select: React.CSSProperties = {
  height: 34, borderRadius: 8, padding: "0 10px", background: color.surfaceRaised, color: color.score,
  border: `1px solid ${color.hairline}`, fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  height: 34, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.hairline}`, cursor: "pointer",
  background: "transparent", color: color.score, fontSize: 12,
};
