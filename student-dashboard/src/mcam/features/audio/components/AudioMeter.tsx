/** Live level meter: RMS fill + peak-hold + clip LED. dBFS scale (-60..0). */
import { useEffect, useRef, useState } from "react";
import { color, font } from "../../../design-system/tokens";

const FLOOR = -60;
const pct = (db: number) => Math.max(0, Math.min(100, ((db - FLOOR) / -FLOOR) * 100));

export function AudioMeter({ rms, peak, clipping }: { rms: number; peak: number; clipping: number }) {
  const [peakHold, setPeakHold] = useState(FLOOR);
  const decay = useRef<number>(undefined);

  useEffect(() => {
    if (peak > peakHold) setPeakHold(peak);
    window.clearTimeout(decay.current);
    decay.current = window.setTimeout(() => setPeakHold((p) => Math.max(FLOOR, p - 6)), 800);
  }, [peak]); // eslint-disable-line react-hooks/exhaustive-deps

  const clipped = clipping > 1 || peak > -0.5;
  const rmsPct = pct(rms), holdPct = pct(peakHold);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font.mono }}>
      <div style={{
        position: "relative", flex: 1, height: 10, borderRadius: 999,
        background: color.stage, border: `1px solid ${color.hairline}`, overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, width: `${rmsPct}%`,
          background: `linear-gradient(90deg, ${color.signal} 0%, ${color.signal} 70%, ${color.peak} 88%, ${color.redzone} 100%)`,
          transition: "width 60ms linear",
        }} />
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: `${holdPct}%`, width: 2,
          background: color.score, opacity: 0.8,
        }} />
      </div>
      <span title="Clipping" style={{
        width: 10, height: 10, borderRadius: 999,
        background: clipped ? color.redzone : color.surfaceRaised,
        boxShadow: clipped ? `0 0 8px ${color.redzone}` : "none",
      }} />
      <span style={{ width: 44, textAlign: "right", fontSize: 11, color: color.scoreMuted }}>
        {rms > FLOOR ? `${rms.toFixed(0)}` : "-∞"}dB
      </span>
    </div>
  );
}
