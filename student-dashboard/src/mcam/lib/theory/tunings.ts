/** Instrument tunings for the tuner (low -> high), as note+octave with target Hz. */
import { midiToFreq, noteToMidi } from "./notes";

export interface TuningString { note: string; octave: number; hz: number; }
export interface Tuning { id: string; label: string; strings: TuningString[]; }

function s(note: string, octave: number): TuningString {
  return { note, octave, hz: +midiToFreq(noteToMidi(note, octave)).toFixed(2) };
}

export const TUNINGS: Tuning[] = [
  { id: "guitar", label: "Guitar", strings: [s("E", 2), s("A", 2), s("D", 3), s("G", 3), s("B", 3), s("E", 4)] },
  { id: "bass", label: "Bass", strings: [s("E", 1), s("A", 1), s("D", 2), s("G", 2)] },
  { id: "violin", label: "Violin", strings: [s("G", 3), s("D", 4), s("A", 4), s("E", 5)] },
  { id: "ukulele", label: "Ukulele", strings: [s("G", 4), s("C", 4), s("E", 4), s("A", 4)] },
  { id: "piano", label: "Piano", strings: [s("A", 4)] }, // reference A440
  { id: "chromatic", label: "Chromatic", strings: [] }, // any note
];

export function nearestString(tuningId: string, hz: number): TuningString | null {
  const t = TUNINGS.find((x) => x.id === tuningId);
  if (!t || !t.strings.length) return null;
  return t.strings.reduce((best, st) =>
    Math.abs(st.hz - hz) < Math.abs(best.hz - hz) ? st : best);
}
