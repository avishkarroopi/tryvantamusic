/** M-STAFF: sight-reading trainer (ported from the recovered "Celffly" module).
 *  Real SVG staff notation — notes are positioned by actual staff-step math,
 *  not decoration. */
import { color, font } from "../../../design-system/tokens";
import { useStaffReader } from "../hooks/useStaffReader";
import { Volume2 } from "lucide-react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LINE_H = 10; // px between staff lines
const STAFF_W = 260;

function noteDetails(midi: number) {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { name, octave, accidental: name.includes("#") };
}

/** Staff-step position (0 = C4/middle-C reference) — matches the recovered
 *  algorithm: diatonic steps only, so sharps sit on the same line as their
 *  natural with an accidental mark. */
function stepsFromC4(midi: number) {
  const semitones = midi - 60;
  const octave = Math.floor(semitones / 12);
  const noteInOctave = ((semitones % 12) + 12) % 12;
  const scaleSteps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  return octave * 7 + scaleSteps[noteInOctave];
}

function noteY(midi: number, clef: "treble" | "bass", topOfStaff: number) {
  const c4Y = clef === "treble" ? topOfStaff + LINE_H * 6.5 : topOfStaff - LINE_H * 1.5;
  return c4Y - stepsFromC4(midi) * (LINE_H / 2);
}

function StaffLines({ y }: { y: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i} x1={20} y1={y + i * LINE_H} x2={STAFF_W} y2={y + i * LINE_H} stroke={color.hairline} strokeWidth={1} />
      ))}
    </>
  );
}

function NoteHead({ midi, clef, topOfStaff, active }: { midi: number; clef: "treble" | "bass"; topOfStaff: number; active: boolean }) {
  const y = noteY(midi, clef, topOfStaff);
  const { accidental } = noteDetails(midi);
  const staffBottom = topOfStaff + LINE_H * 4;
  const ledgerLines: number[] = [];
  if (y < topOfStaff) for (let ly = topOfStaff - LINE_H; ly >= y - 1; ly -= LINE_H) ledgerLines.push(ly);
  if (y > staffBottom) for (let ly = topOfStaff + LINE_H * 5; ly <= y + 1; ly += LINE_H) ledgerLines.push(ly);

  return (
    <g>
      {ledgerLines.map((ly) => <line key={ly} x1={130} y1={ly} x2={150} y2={ly} stroke={color.scoreMuted} strokeWidth={1} />)}
      {accidental && <text x={112} y={y + 5} fontSize={16} fill={color.signal} fontFamily={font.mono}>♯</text>}
      <ellipse cx={140} cy={y} rx={7} ry={5.5} fill={active ? color.signal : color.score} transform={`rotate(-15 140 ${y})`} />
    </g>
  );
}

export function StaffReader() {
  const s = useStaffReader();
  const staffTop = s.level.clef === "grand" ? 20 : 40;
  const bassStaffTop = 90;

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <select value={s.levelIdx} onChange={(e) => s.setLevelIdx(Number(e.target.value))} style={select}>
          {s.levels.map((l, i) => <option key={l.id} value={i}>{l.id}. {l.title}</option>)}
        </select>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: color.scoreMuted }}>
          <span>Streak {s.score.streak}</span>
          <span>Best {s.score.best}</span>
          <span>Accuracy {s.accuracy}%</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: color.scoreMuted, margin: 0 }}>{s.level.description}</p>

      {s.level.timer !== null && (
        <div style={{ height: 4, borderRadius: 2, background: color.surfaceRaised, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${((s.timeLeft ?? 0) / s.level.timer) * 100}%`,
            background: (s.timeLeft ?? 0) < s.level.timer * 0.3 ? color.redzone : color.signal,
            transition: "width 100ms linear",
          }} />
        </div>
      )}

      <div style={{
        borderRadius: 14, border: `1px solid ${color.hairline}`, background: "#F5F2EC", padding: "16px 8px",
        display: "flex", justifyContent: "center", position: "relative",
      }}>
        <svg width={STAFF_W} height={s.level.clef === "grand" ? 180 : 120} viewBox={`0 0 ${STAFF_W} ${s.level.clef === "grand" ? 180 : 120}`}>
          {(s.level.clef === "treble" || s.level.clef === "grand") && <StaffLines y={staffTop} />}
          {(s.level.clef === "bass" || s.level.clef === "grand") && <StaffLines y={s.level.clef === "grand" ? bassStaffTop + 30 : staffTop} />}
          {s.target.map((n, i) => {
            const isBass = s.level.clef === "bass" || (s.level.clef === "grand" && n.midi < 60);
            const top = isBass ? (s.level.clef === "grand" ? bassStaffTop + 30 : staffTop) : staffTop;
            return (
              <g key={i} transform={`translate(${i * 40}, 0)`}>
                <NoteHead midi={n.midi} clef={isBass ? "bass" : "treble"} topOfStaff={top} active={i === s.playedIdx} />
              </g>
            );
          })}
        </svg>
        {s.feedback !== "idle" && (
          <div style={{
            position: "absolute", top: 8, right: 12, fontSize: 13, fontWeight: 700,
            color: s.feedback === "correct" ? "#166534" : "#b91c1c",
          }}>{s.feedback === "correct" ? "Correct!" : "Try again"}</div>
        )}
      </div>

      <button onClick={s.playTarget} style={ghostBtn}><Volume2 size={15} /> Hear it</button>

      <MiniKeyboard range={s.level.range} onPress={s.answer} />
    </div>
  );
}

function MiniKeyboard({ range, onPress }: { range: [number, number]; onPress: (midi: number) => void }) {
  const WHITE_STEPS = new Set([0, 2, 4, 5, 7, 9, 11]);
  const isWhite = (m: number) => WHITE_STEPS.has(((m % 12) + 12) % 12);
  const keys: number[] = [];
  for (let m = range[0] - 2; m <= range[1] + 2; m++) keys.push(m);
  const whites = keys.filter(isWhite);
  const KEY_W = 24;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ position: "relative", height: 60, width: whites.length * KEY_W, margin: "0 auto" }}>
        {whites.map((m, i) => (
          <button key={m} onClick={() => onPress(m)} style={{
            position: "absolute", left: i * KEY_W, top: 0, width: KEY_W - 1, height: 60,
            background: "#F5F2EC", border: `1px solid ${color.hairline}`, borderRadius: "0 0 4px 4px", cursor: "pointer",
          }} />
        ))}
        {keys.filter((m) => !isWhite(m)).map((m) => {
          const pc = ((m % 12) + 12) % 12;
          const whiteBefore = whites.filter((w) => w < m).length - 1;
          const offset = [1, 3, 6, 8, 10].includes(pc) ? KEY_W * 0.68 : 0;
          return (
            <button key={m} onClick={() => onPress(m)} style={{
              position: "absolute", left: whiteBefore * KEY_W + offset, top: 0, width: KEY_W * 0.6, height: 38, zIndex: 2,
              background: "#15181e", border: "none", borderRadius: "0 0 3px 3px", cursor: "pointer",
            }} />
          );
        })}
      </div>
    </div>
  );
}

const select: React.CSSProperties = {
  height: 34, borderRadius: 8, padding: "0 10px", background: color.surfaceRaised, color: color.score,
  border: `1px solid ${color.hairline}`, fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  display: "flex", gap: 6, alignItems: "center", justifyContent: "center", height: 34, padding: "0 14px",
  borderRadius: 8, border: `1px solid ${color.hairline}`, cursor: "pointer", background: "transparent", color: color.score, fontSize: 13,
};
