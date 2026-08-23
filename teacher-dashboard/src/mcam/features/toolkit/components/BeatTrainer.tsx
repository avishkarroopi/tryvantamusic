/** M-BEAT: tap-timing accuracy trainer — sample-accurate click track, graded taps. */
import { Award, Play, Square, Target, TrendingUp, Zap } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useBeatTrainer, type Subdivision } from "../hooks/useBeatTrainer";

const SUBDIVISIONS: { id: Subdivision; label: string }[] = [
  { id: "quarter", label: "1/4" }, { id: "eighth", label: "1/8" },
  { id: "sixteenth", label: "1/16" }, { id: "triplet", label: "1/3" },
];

const RATING_COLOR: Record<string, string> = {
  Perfect: color.signal, Great: "#34D399", Good: color.peak, Early: color.redzone, Late: color.redzone, Miss: color.scoreMuted,
};

export function BeatTrainer() {
  const t = useBeatTrainer();
  const scale = 1 + Math.max(0, 1 - t.beatPhase * 4) * 0.18;

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        <Stat icon={<Target size={13} />} label="Acc" value={`${Math.max(0, 100 - t.stats.avgOffsetMs / 5).toFixed(0)}%`} />
        <Stat icon={<Zap size={13} />} label="Streak" value={t.stats.streak} />
        <Stat icon={<Award size={13} />} label="Score" value={t.stats.score} />
        <Stat icon={<TrendingUp size={13} />} label="Avg" value={`${Math.round(t.stats.avgOffsetMs)}ms`} />
      </div>

      <div style={{ display: "grid", placeItems: "center", padding: "8px 0" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 999, display: "grid", placeItems: "center", position: "relative",
          border: `3px solid ${color.hairline}`, background: color.surface,
          transform: t.running ? `scale(${scale})` : "scale(1)", transition: "transform 60ms linear",
          boxShadow: t.lastHit ? `0 0 24px ${RATING_COLOR[t.lastHit.rating]}55` : "none",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: color.signal }} />
          {t.lastHit && (
            <div key={t.lastHit.ts} style={{
              position: "absolute", top: -30, fontSize: 12, fontWeight: 700, color: RATING_COLOR[t.lastHit.rating],
            }}>{t.lastHit.rating}</div>
          )}
        </div>
      </div>

      <button
        onMouseDown={t.tap} onTouchStart={t.tap} disabled={!t.running}
        style={{
          padding: 18, borderRadius: 14, textAlign: "center", fontWeight: 700, fontSize: 15,
          border: `1px solid ${color.hairline}`, cursor: t.running ? "pointer" : "not-allowed",
          background: t.running ? color.surfaceRaised : "transparent", color: t.running ? color.score : color.scoreMuted,
        }}>
        TAP HERE <span style={{ display: "block", fontSize: 11, fontFamily: font.mono, color: color.scoreMuted, marginTop: 2 }}>[spacebar]</span>
      </button>

      <div>
        <Row label="Tempo" value={`${t.bpm} BPM`} />
        <input type="range" min={40} max={220} value={t.bpm} onChange={(e) => t.setBpm(Number(e.target.value))}
          style={{ width: "100%" }} />
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {SUBDIVISIONS.map((s) => (
          <button key={s.id} onClick={() => t.setSubdivision(s.id)} style={pill(t.subdivision === s.id)}>{s.label}</button>
        ))}
      </div>

      <button onClick={t.running ? t.stop : t.start} style={{
        display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: 12,
        borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 600,
        background: t.running ? color.redzone : color.signal, color: t.running ? "#fff" : color.stage,
      }}>
        {t.running ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
      </button>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 2, padding: "8px 4px", borderRadius: 10, background: color.surfaceRaised, border: `1px solid ${color.hairline}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: color.scoreMuted, textTransform: "uppercase" }}>{icon}{label}</div>
      <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15 }}>{value}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: color.scoreMuted, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: color.score, fontFamily: font.mono }}>{value}</span>
    </div>
  );
}
const pill = (on: boolean): React.CSSProperties => ({
  flex: 1, padding: "6px 0", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
  color: on ? color.stage : color.scoreMuted, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}`,
});
