/** Note + frequency math shared by tuner, chord finder and scale finder. */
export const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
export const FLAT_NAMES = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"] as const;

export type PitchClass = number; // 0..11, C = 0

export function nameToPc(name: string): PitchClass {
  const m = name.trim().match(/^([A-Ga-g])([#b]?)/);
  if (!m) return 0;
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = base[m[1].toUpperCase()];
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

export function pcToName(pc: PitchClass, flats = false): string {
  return (flats ? FLAT_NAMES : NOTE_NAMES)[((pc % 12) + 12) % 12];
}

/** Spell a set of semitone offsets from a root into note names. */
export function spell(root: string, intervals: number[], flats = false): string[] {
  const r = nameToPc(root);
  return intervals.map((i) => pcToName(r + i, flats));
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToMidi(name: string, octave: number): number {
  return (octave + 1) * 12 + nameToPc(name);
}

/** Nearest note + cents deviation for a measured frequency (tuner). */
export function freqToNote(hz: number): { note: string; octave: number; cents: number; midi: number } {
  const midi = 69 + 12 * Math.log2(hz / 440);
  const rounded = Math.round(midi);
  return {
    note: NOTE_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents: Math.round((midi - rounded) * 100),
    midi: rounded,
  };
}
