/** Tiny Web Audio player for previewing chords/scales (no samples needed). */
import { midiToFreq, noteToMidi } from "./notes";

let ctx: AudioContext | null = null;
function ac() { return (ctx ??= new AudioContext()); }

function tone(freq: number, start: number, dur: number, gainVal = 0.18) {
  const c = ac();
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = "triangle"; osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gainVal, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start); osc.stop(start + dur);
}

export function playChord(notes: string[], octave = 4) {
  const c = ac(); const t = c.currentTime + 0.02;
  notes.forEach((n) => tone(midiToFreq(noteToMidi(n, octave)), t, 1.2));
}

export function playScale(notes: string[], octave = 4, bpm = 120) {
  const c = ac(); const step = 60 / bpm;
  notes.concat(notes[0]).forEach((n, i) =>
    tone(midiToFreq(noteToMidi(n, octave + (i === notes.length ? 1 : 0))), c.currentTime + 0.02 + i * step, step * 0.9));
}
