/** M-FALL: Synthesia-style falling-notes sight-reading trainer with a small
 *  built-in song library, canvas note highway, and a playable mini keyboard. */
import { useEffect, useRef } from "react";
import { Play, Square, RotateCcw, Upload } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { MIDI_END, MIDI_START, useNoteFall } from "../hooks/useNoteFall";

const WHITE_STEPS = new Set([0, 2, 4, 5, 7, 9, 11]);
const isWhite = (midi: number) => WHITE_STEPS.has(((midi % 12) + 12) % 12);
const WHITE_KEY_W = 26;
const HIGHWAY_H = 320;
const HIT_LINE_Y = HIGHWAY_H - 40;

function keyLayout() {
  const whites: number[] = [];
  const blacks: number[] = [];
  for (let m = MIDI_START; m <= MIDI_END; m++) (isWhite(m) ? whites : blacks).push(m);
  const whiteX = new Map<number, number>();
  whites.forEach((m, i) => whiteX.set(m, i * WHITE_KEY_W));
  return { whites, blacks, whiteX };
}

const LAYOUT = keyLayout();

function xFor(midi: number): number {
  if (isWhite(midi)) return (LAYOUT.whiteX.get(midi) ?? 0) + WHITE_KEY_W / 2;
  // black key sits between the two neighboring whites
  const left = LAYOUT.whiteX.get(midi - 1) ?? LAYOUT.whiteX.get(midi - 2) ?? 0;
  return left + WHITE_KEY_W;
}

export function NoteFall() {
  const f = useNoteFall();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = LAYOUT.whites.length * WHITE_KEY_W;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    let raf = requestAnimationFrame(function draw() {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.fillStyle = "#0E1116";
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);

      // lane separators (faint) under white keys
      LAYOUT.whites.forEach((m) => {
        ctx2d.fillStyle = "rgba(255,255,255,0.02)";
        ctx2d.fillRect(xFor(m) - WHITE_KEY_W / 2, 0, WHITE_KEY_W, HIGHWAY_H);
      });

      // hit line
      ctx2d.strokeStyle = color.signal;
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(0, HIT_LINE_Y);
      ctx2d.lineTo(canvas.width, HIT_LINE_Y);
      ctx2d.stroke();

      // notes
      f.notes.forEach((n) => {
        if (n.status === "hit") return;
        const dt = n.t - f.elapsed;
        const y = HIT_LINE_Y - dt * f.scrollSpeed;
        const h = Math.max(10, n.d * f.scrollSpeed);
        if (y + h < -20 || y > HIGHWAY_H + 20) return;
        const x = xFor(n.p) - (isWhite(n.p) ? WHITE_KEY_W * 0.42 : WHITE_KEY_W * 0.3);
        const w = isWhite(n.p) ? WHITE_KEY_W * 0.84 : WHITE_KEY_W * 0.6;
        ctx2d.fillStyle = n.status === "missed" ? "rgba(244,98,46,0.5)" : isWhite(n.p) ? color.signal : color.peak;
        const r = 5;
        ctx2d.beginPath();
        ctx2d.roundRect(x, y - h, w, h, r);
        ctx2d.fill();
      });

      raf = requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(raf);
  }, [f.notes, f.elapsed, f.scrollSpeed]);

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <select value={f.songIdx} onChange={(e) => f.setSongIdx(Number(e.target.value))} style={select}>
          {f.library.map((s, i) => <option key={s.id} value={i}>{s.title} · {s.difficulty}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: color.scoreMuted }}>Speed</span>
          <input type="range" min={80} max={280} value={f.scrollSpeed} onChange={(e) => f.setScrollSpeed(Number(e.target.value))} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <label style={{ ...ghostBtn, display: "flex", alignItems: "center", cursor: "pointer" }}>
            <Upload size={15} />
            <input type="file" accept=".mid,.midi,.json" style={{ display: "none" }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void f.uploadSong(file); e.target.value = ""; }} />
          </label>
          <button onClick={f.playing ? f.stop : f.start} style={primaryBtn}>
            {f.playing ? <><Square size={15} /> Stop</> : <><Play size={15} /> Play</>}
          </button>
          <button onClick={f.restart} style={ghostBtn}><RotateCcw size={15} /></button>
        </div>
      </div>
      {f.uploadError && <p style={{ color: color.redzone, fontSize: 12, margin: 0 }}>{f.uploadError}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        <Stat label="Accuracy" value={`${f.accuracy}%`} />
        <Stat label="Perfects" value={f.stats.perfects} />
        <Stat label="Combo" value={f.stats.combo} />
        <Stat label="Best combo" value={f.stats.bestCombo} />
      </div>

      <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${color.hairline}`, position: "relative" }}>
        <canvas ref={canvasRef} width={width} height={HIGHWAY_H} style={{ display: "block", width, height: HIGHWAY_H }} />
        {f.lastJudgement && (
          <div key={f.lastJudgement.ts} style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            fontSize: 14, fontWeight: 700, color: color.signal, pointerEvents: "none",
          }}>{f.lastJudgement.text}</div>
        )}
      </div>

      {/* mini keyboard input */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ position: "relative", height: 64, width, margin: "0 auto" }}>
          {LAYOUT.whites.map((m, i) => (
            <button key={m} onClick={() => f.pressNote(m)}
              style={{
                position: "absolute", left: i * WHITE_KEY_W, top: 0, width: WHITE_KEY_W - 1, height: 64,
                background: "#F5F2EC", border: `1px solid ${color.hairline}`, borderRadius: "0 0 4px 4px", cursor: "pointer",
              }} />
          ))}
          {LAYOUT.blacks.map((m) => (
            <button key={m} onClick={() => f.pressNote(m)}
              style={{
                position: "absolute", left: xFor(m) - WHITE_KEY_W * 0.3, top: 0, width: WHITE_KEY_W * 0.6, height: 40, zIndex: 2,
                background: "#15181e", border: "none", borderRadius: "0 0 3px 3px", cursor: "pointer",
              }} />
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: color.scoreMuted, margin: 0 }}>
        Notes fall toward the highlighted line — press the matching key on the strip below as each one crosses it.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 2, padding: "8px 4px", borderRadius: 10, background: color.surfaceRaised, border: `1px solid ${color.hairline}` }}>
      <div style={{ fontSize: 10, color: color.scoreMuted, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15 }}>{value}</div>
    </div>
  );
}
const select: React.CSSProperties = {
  height: 34, borderRadius: 8, padding: "0 10px", background: color.surfaceRaised, color: color.score,
  border: `1px solid ${color.hairline}`, fontSize: 13,
};
const primaryBtn: React.CSSProperties = {
  display: "flex", gap: 6, alignItems: "center", height: 34, padding: "0 14px", borderRadius: 8, border: "none",
  cursor: "pointer", background: color.signal, color: color.stage, fontWeight: 600, fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8,
  border: `1px solid ${color.hairline}`, cursor: "pointer", background: "transparent", color: color.score,
};
