/** Simple practice timer with start/pause/reset (count-up). */
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { color, font } from "../../../design-system/tokens";

export function PracticeTimer() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const start = useRef(0);
  const raf = useRef<number>(undefined);

  useEffect(() => {
    if (!running) return;
    start.current = performance.now() - ms;
    const loop = () => { setMs(performance.now() - start.current); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = Math.floor(ms / 1000);
  const t = `${`${Math.floor(s / 60)}`.padStart(2, "0")}:${`${s % 60}`.padStart(2, "0")}`;
  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, textAlign: "center", display: "grid", gap: 14 }}>
      <div style={{ fontFamily: font.mono, fontSize: 44 }}>{t}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={() => setRunning((r) => !r)} style={btn}>{running ? <Pause size={18} /> : <Play size={18} />}</button>
        <button onClick={() => { setRunning(false); setMs(0); }} style={btn}><RotateCcw size={18} /></button>
      </div>
    </div>
  );
}
const btn: React.CSSProperties = { width: 48, height: 48, borderRadius: 999, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.score, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
