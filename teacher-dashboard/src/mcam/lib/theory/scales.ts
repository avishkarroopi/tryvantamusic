/** Scale formulas (semitones from root) + degree labels, for the Scale Finder. */
import { spell } from "./notes";

export interface ScaleDef { id: string; label: string; group: string; intervals: number[]; }

export const SCALES: ScaleDef[] = [
  { id: "major", label: "Major (Ionian)", group: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "natural_minor", label: "Natural Minor (Aeolian)", group: "Minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "harmonic_minor", label: "Harmonic Minor", group: "Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: "melodic_minor", label: "Melodic Minor", group: "Minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: "major_pentatonic", label: "Major Pentatonic", group: "Pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minor_pentatonic", label: "Minor Pentatonic", group: "Pentatonic", intervals: [0, 3, 5, 7, 10] },
  { id: "blues", label: "Blues", group: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  // Modes
  { id: "dorian", label: "Dorian", group: "Modes", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", label: "Phrygian", group: "Modes", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", label: "Lydian", group: "Modes", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", label: "Mixolydian", group: "Modes", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "locrian", label: "Locrian", group: "Modes", intervals: [0, 1, 3, 5, 6, 8, 10] },
  // Jazz
  { id: "bebop_dominant", label: "Bebop Dominant", group: "Jazz", intervals: [0, 2, 4, 5, 7, 9, 10, 11] },
  { id: "whole_tone", label: "Whole Tone", group: "Jazz", intervals: [0, 2, 4, 6, 8, 10] },
  { id: "diminished_wh", label: "Diminished (W-H)", group: "Jazz", intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
];

const DEGREES = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function scaleNotes(root: string, scaleId: string): string[] {
  const s = SCALES.find((x) => x.id === scaleId) ?? SCALES[0];
  const flats = /b/.test(root) || ["F", "Bb", "Eb", "Ab", "Db"].includes(root);
  return spell(root, s.intervals, flats);
}

/** Scale as playable notes with degree labels (for fingering/playback). */
export function scaleDegrees(root: string, scaleId: string): { note: string; degree: string }[] {
  return scaleNotes(root, scaleId).map((note, i) => ({ note, degree: DEGREES[i] ?? `${i + 1}` }));
}

export const SCALE_GROUPS = [...new Set(SCALES.map((s) => s.group))];
