/** Elapsed + optional countdown. Teacher can set a countdown target (e.g. 45-min
 *  lesson); everyone sees remaining time turn amber then red as it runs down. */
import { useEffect, useState } from "react";
import { color, font } from "../../../design-system/tokens";

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = `${m}`.padStart(2, "0"), ss = `${sec}`.padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function SessionTimer({ startedAt, countdownMs }: { startedAt: number; countdownMs?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = now - startedAt;
  const remaining = countdownMs !== undefined ? countdownMs - elapsed : undefined;
  const tone = remaining === undefined ? color.score
    : remaining < 60_000 ? color.redzone
    : remaining < 300_000 ? color.peak : color.signal;

  return (
    <div style={{ fontFamily: font.mono, fontSize: 13, color: color.scoreMuted, display: "flex", gap: 12 }}>
      <span>elapsed <b style={{ color: color.score }}>{fmt(elapsed)}</b></span>
      {remaining !== undefined && (
        <span>left <b style={{ color: tone }}>{fmt(remaining)}</b></span>
      )}
    </div>
  );
}
