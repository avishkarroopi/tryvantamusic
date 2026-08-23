/** M-GTR: interactive 6-string fretboard with real Karplus-Strong plucked-string
 *  tone, chord-shape overlays, and scale-tone highlighting. A "large" tool —
 *  render it full-width (fullscreen overlay in M-CAM, or its own page). */
import { color, font } from "../../../design-system/tokens";
import { ROOTS, useVirtualGuitar } from "../hooks/useVirtualGuitar";

const INLAYS = new Set([3, 5, 7, 9, 15]);
const DOUBLE_INLAY = 12;

export function VirtualGuitar() {
  const g = useVirtualGuitar();
  const cellW = 56;
  const fretNums = Array.from({ length: g.fretCount + 1 }, (_, i) => i); // 0 = open string

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["free", "chords", "scales"] as const).map((m) => (
            <button key={m} onClick={() => g.setMode(m)} style={pill(g.mode === m)}>{m}</button>
          ))}
        </div>

        {g.mode === "chords" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <RootPicker value={g.root} onChange={g.setRoot} options={g.availableChordRoots.length ? g.availableChordRoots : ROOTS} />
            <select value={g.chordQuality} onChange={(e) => g.setChordQuality(e.target.value)} style={select}>
              {g.chordQualities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={() => g.strumShape()} style={primaryBtn} disabled={!g.shape}>Strum</button>
            {!g.shape && <span style={{ fontSize: 12, color: color.scoreMuted }}>No curated open shape for this combo yet — try a common root/quality.</span>}
          </div>
        )}

        {g.mode === "scales" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <RootPicker value={g.root} onChange={g.setRoot} options={ROOTS} />
            <select value={g.scaleId} onChange={(e) => g.setScaleId(e.target.value)} style={select}>
              {g.scales.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${color.hairline}`, background: "#241a12" }}>
        <div style={{ minWidth: (g.fretCount + 1.5) * cellW, padding: "16px 20px 8px" }}>
          {/* fret numbers */}
          <div style={{ display: "flex", marginLeft: cellW * 0.75 }}>
            {fretNums.slice(1).map((f) => (
              <div key={f} style={{ width: cellW, textAlign: "center", fontSize: 11, color: "#c9a876", fontFamily: font.mono }}>
                {INLAYS.has(f) || f === DOUBLE_INLAY ? f : ""}
              </div>
            ))}
          </div>

          {/* strings, low (bottom, thick) to high (top, thin) reversed for display: high on top */}
          {[...g.strings].map((_, rowIdx) => {
            const stringIdx = g.strings.length - 1 - rowIdx; // high string on top
            const open = g.strings[stringIdx];
            const thickness = 1 + (g.strings.length - stringIdx) * 0.6;
            return (
              <div key={stringIdx} style={{ display: "flex", alignItems: "center", height: 34 }}>
                <div style={{ width: cellW * 0.75, textAlign: "right", paddingRight: 10, fontSize: 12, color: "#e8c99a", fontFamily: font.mono }}>
                  {open.note}{open.octave}
                </div>
                {fretNums.map((fret) => {
                  const key = `${stringIdx}-${fret}`;
                  const isRoot = g.isRootTone(stringIdx, fret);
                  const isScaleTone = g.mode === "scales" && g.isScaleTone(stringIdx, fret);
                  const isChordTone = g.mode === "chords" && g.shape && g.shape.frets[stringIdx] === fret && fret >= 0;
                  const isRinging = g.ringing === key;
                  return (
                    <button
                      key={fret}
                      onClick={() => g.pluck(stringIdx, fret)}
                      title={`${g.noteNameAt(stringIdx, fret)}${fret === 0 ? " (open)" : ""}`}
                      style={{
                        width: cellW, height: 34, position: "relative", cursor: "pointer", border: "none",
                        background: fret === 0 ? "transparent" : "transparent",
                        borderRight: fret === 0 ? `3px solid #b08d57` : `1px solid rgba(180,150,110,0.35)`,
                        padding: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute", left: 0, right: 0, top: "50%", height: Math.min(thickness, 3.4),
                        background: isRinging ? color.signal : "#c9a876", transform: "translateY(-50%)",
                        boxShadow: isRinging ? `0 0 10px ${color.signal}` : "none", transition: "background 120ms",
                      }} />
                      {(isRoot && (isScaleTone || isChordTone || g.mode === "free")) && (
                        <div style={{
                          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                          width: 20, height: 20, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700,
                          background: isChordTone ? color.signal : isScaleTone ? color.peak : "transparent",
                          color: isChordTone || isScaleTone ? color.stage : "transparent",
                          border: isChordTone || isScaleTone ? "none" : "1px solid transparent",
                        }}>{isChordTone || isScaleTone ? "R" : ""}</div>
                      )}
                      {!isRoot && isScaleTone && (
                        <div style={{
                          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                          width: 14, height: 14, borderRadius: 999, background: "rgba(51,201,160,0.75)",
                        }} />
                      )}
                      {!isRoot && isChordTone && (
                        <div style={{
                          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                          width: 16, height: 16, borderRadius: 999, background: color.signal,
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* single/double inlay dots row */}
          <div style={{ display: "flex", marginLeft: cellW * 0.75, marginTop: 4 }}>
            {fretNums.slice(1).map((f) => (
              <div key={f} style={{ width: cellW, textAlign: "center" }}>
                {(INLAYS.has(f) || f === DOUBLE_INLAY) && (
                  <span style={{ display: "inline-flex", gap: 3 }}>
                    <i style={dot} />{f === DOUBLE_INLAY && <i style={dot} />}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: color.scoreMuted, margin: 0 }}>
        Tap any fret to pluck it (Karplus-Strong string synthesis). Chords mode strums a curated open-position shape; Scales mode highlights every scale tone across the neck.
      </p>
    </div>
  );
}

function RootPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={select}>
      {options.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

const dot: React.CSSProperties = { width: 5, height: 5, borderRadius: 999, background: "#8a6a3f", display: "inline-block" };
const pill = (on: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12, textTransform: "capitalize",
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}`,
});
const select: React.CSSProperties = {
  height: 34, borderRadius: 8, padding: "0 10px", background: color.surfaceRaised, color: color.score,
  border: `1px solid ${color.hairline}`, fontSize: 13,
};
const primaryBtn: React.CSSProperties = {
  height: 34, padding: "0 16px", borderRadius: 8, border: "none", cursor: "pointer",
  background: color.signal, color: color.stage, fontWeight: 600, fontSize: 13,
};
