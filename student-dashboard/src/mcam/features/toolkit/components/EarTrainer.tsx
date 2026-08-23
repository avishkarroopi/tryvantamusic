/** M-EARS: pitch matching, interval ID, and chord-quality ID ear trainer.
 *  Shares the classroom's live analyser when inside M-CAM; opens its own mic
 *  otherwise so it also works standalone from the dashboards' Music Tools page. */
import { motion } from "framer-motion";
import { Award, Play, RotateCcw, Volume2 } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { INTERVALS, CHORD_TYPES, useEarTrainer } from "../hooks/useEarTrainer";

export function EarTrainer({ analyser }: { analyser: AnalyserNode | null }) {
  const t = useEarTrainer(analyser);
  const { mode, state } = t;
  const cents = state.detected?.cents ?? 0;
  const inTune = Math.abs(cents) < 15;

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["pitch", "interval", "chord"] as const).map((m) => (
            <button key={m} onClick={() => t.changeMode(m)} style={pill(mode === m)}>{m}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: color.scoreMuted }}>
          <Award size={13} /> {state.score.correct}/{state.score.total}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 13, color: color.scoreMuted, minHeight: 18 }}>{state.feedback}</div>

      {mode === "pitch" && (
        <>
          <div style={{ position: "relative", height: 110, display: "grid", placeItems: "end center" }}>
            <div style={{
              position: "absolute", top: 4, display: "flex", gap: 36, color: color.scoreMuted,
              fontFamily: font.mono, fontSize: 12,
            }}>
              <span>♭</span><span style={{ color: inTune ? color.signal : color.scoreMuted }}>●</span><span>♯</span>
            </div>
            <motion.div animate={{ rotate: Math.max(-45, Math.min(45, cents * 0.9)) }} style={{
              width: 3, height: 84, borderRadius: 3, transformOrigin: "bottom center",
              background: state.detected ? (inTune ? color.signal : Math.abs(cents) < 30 ? color.peak : color.redzone) : color.hairline,
            }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: font.display, fontSize: 40, color: inTune ? color.signal : color.score }}>
              {state.detected ? `${state.detected.note}${state.detected.octave}` : "—"}
            </div>
            {state.target && (
              <div style={{ fontFamily: font.mono, fontSize: 13, color: color.scoreMuted }}>
                target {state.target.note}{state.target.octave}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={t.startPitchExercise} style={primaryBtn}><Play size={16} /> {state.target ? "New note" : "Start"}</button>
            {state.target && (
              <button onClick={() => t.playTone(440 * Math.pow(2, (state.target!.midi - 69) / 12), 0.8)} style={ghostBtn}><Volume2 size={16} /></button>
            )}
          </div>
        </>
      )}

      {mode === "interval" && (
        <>
          <button onClick={() => t.playInterval(state.quiz === "idle" && !!state.interval)} style={primaryBtn} disabled={state.quiz === "playing"}>
            {state.quiz === "answered" || !state.interval ? <><Play size={16} /> New interval</> : <><RotateCcw size={16} /> Replay</>}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {INTERVALS.slice(0, 8).map((iv) => (
              <button key={iv.name} onClick={() => t.answerInterval(iv.name)}
                disabled={state.quiz === "playing" || !state.interval}
                style={quizBtn(state.quiz === "answered" && state.interval?.name === iv.name)}>
                {iv.name}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === "chord" && (
        <>
          <button onClick={() => t.playChord(state.quiz === "idle" && !!state.chord)} style={primaryBtn} disabled={state.quiz === "playing"}>
            {state.quiz === "answered" || !state.chord ? <><Play size={16} /> New chord</> : <><RotateCcw size={16} /> Replay</>}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {CHORD_TYPES.map((c) => (
              <button key={c.name} onClick={() => t.answerChord(c.name)}
                disabled={state.quiz === "playing" || !state.chord}
                style={quizBtn(state.quiz === "answered" && state.chord?.name === c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: color.scoreMuted }}>
        <span>Level</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => t.setLevel(n)} style={{
              width: 18, height: 18, borderRadius: 4, cursor: "pointer", fontSize: 10,
              border: `1px solid ${color.hairline}`, background: n <= state.level ? color.signal : "transparent",
              color: n <= state.level ? color.stage : color.scoreMuted,
            }}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const pill = (on: boolean): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, textTransform: "capitalize",
  color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
  border: `1px solid ${on ? color.signal : color.hairline}`,
});
const primaryBtn: React.CSSProperties = {
  display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: 12,
  borderRadius: 12, border: "none", cursor: "pointer", background: color.signal, color: color.stage, fontWeight: 600,
};
const ghostBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px",
  borderRadius: 12, border: `1px solid ${color.hairline}`, cursor: "pointer", background: "transparent", color: color.score,
};
const quizBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 8px", borderRadius: 10, fontSize: 12, cursor: "pointer",
  border: `1px solid ${active ? color.signal : color.hairline}`,
  background: active ? "rgba(51,201,160,0.15)" : color.surfaceRaised,
  color: active ? color.signal : color.score,
});
