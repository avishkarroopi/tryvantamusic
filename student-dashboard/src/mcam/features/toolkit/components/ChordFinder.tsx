/** Chord finder: root + quality -> notes, piano voicing, guitar shape, play, favorites. */
import { useState } from "react";
import { Play, Star } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { CHORD_QUALITIES, chordNotes, guitarShape, pianoVoicings } from "../../../lib/theory/chords";
import { NOTE_NAMES } from "../../../lib/theory/notes";
import { playChord } from "../../../lib/theory/playback";

export function ChordFinder() {
  const [root, setRoot] = useState("C");
  const [quality, setQuality] = useState("maj");
  const [favs, setFavs] = useState<string[]>([]);
  const notes = chordNotes(root, quality);
  const shape = guitarShape(root, quality);
  const piano = pianoVoicings(root, quality);
  const id = `${root}${quality === "maj" ? "" : quality}`;

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14 }}>
      <Row label="Root">
        {NOTE_NAMES.map((n) => <Pill key={n} on={n === root} onClick={() => setRoot(n)}>{n}</Pill>)}
      </Row>
      <Row label="Quality">
        {CHORD_QUALITIES.map((q) => <Pill key={q.id} on={q.id === quality} onClick={() => setQuality(q.id)}>{q.label}</Pill>)}
      </Row>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: font.display, fontSize: 26 }}>{id}</div>
        <div style={{ color: color.scoreMuted, fontFamily: font.mono }}>{notes.join(" · ")}</div>
        <button onClick={() => playChord(notes)} style={ico} aria-label="Play"><Play size={16} /></button>
        <button onClick={() => setFavs((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id])}
          style={{ ...ico, color: favs.includes(id) ? color.peak : color.scoreMuted }} aria-label="Favorite">
          <Star size={16} fill={favs.includes(id) ? color.peak : "none"} /></button>
      </div>

      {shape && <GuitarDiagram frets={shape.frets} fingers={shape.fingers} />}
      <PianoDiagram notes={piano.root_position} />

      {favs.length > 0 && (
        <div style={{ color: color.scoreMuted, fontSize: 13 }}>★ {favs.join(", ")}</div>
      )}
    </div>
  );
}

function GuitarDiagram({ frets, fingers }: { frets: number[]; fingers: number[] }) {
  const maxFret = Math.max(3, ...frets.filter((f) => f > 0));
  return (
    <svg width="100%" viewBox="0 0 120 90" style={{ maxWidth: 200 }}>
      {[0, 1, 2, 3, 4, 5].map((s) => (
        <line key={`s${s}`} x1={10 + s * 20} y1={12} x2={10 + s * 20} y2={82} stroke={color.hairline} />
      ))}
      {Array.from({ length: maxFret + 1 }).map((_, f) => (
        <line key={`f${f}`} x1={10} y1={12 + f * (70 / maxFret)} x2={110} y2={12 + f * (70 / maxFret)} stroke={color.hairline} />
      ))}
      {frets.map((fr, s) => {
        const x = 10 + s * 20;
        if (fr === -1) return <text key={s} x={x} y={9} fill={color.redzone} fontSize={8} textAnchor="middle">✕</text>;
        if (fr === 0) return <circle key={s} cx={x} cy={7} r={2.5} fill="none" stroke={color.scoreMuted} />;
        const y = 12 + (fr - 0.5) * (70 / maxFret);
        return <g key={s}><circle cx={x} cy={y} r={5} fill={color.signal} />
          <text x={x} y={y + 3} fontSize={7} fill={color.stage} textAnchor="middle">{fingers[s] || ""}</text></g>;
      })}
    </svg>
  );
}

function PianoDiagram({ notes }: { notes: string[] }) {
  const whites = ["C", "D", "E", "F", "G", "A", "B"];
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {whites.map((w) => (
        <div key={w} style={{ width: 26, height: 70, borderRadius: "0 0 4px 4px",
          background: notes.includes(w) ? color.signal : color.score,
          border: `1px solid ${color.hairline}`, display: "grid", alignItems: "end", justifyItems: "center",
          color: notes.includes(w) ? color.stage : color.stage, fontSize: 9, paddingBottom: 3 }}>
          {notes.includes(w) ? w : ""}
        </div>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 11, textTransform: "uppercase", color: color.scoreMuted, marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div></div>;
}
function Pill({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontSize: 13,
    color: on ? color.stage : color.score, background: on ? color.signal : color.surfaceRaised,
    border: `1px solid ${on ? color.signal : color.hairline}` }}>{children}</button>;
}
const ico: React.CSSProperties = { width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.score, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
