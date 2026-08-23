/** Chord formulas (semitones from root) + curated guitar shapes & piano voicings. */
import { spell } from "./notes";

export interface ChordQuality { id: string; label: string; intervals: number[]; }

export const CHORD_QUALITIES: ChordQuality[] = [
  { id: "maj", label: "Major", intervals: [0, 4, 7] },
  { id: "min", label: "Minor", intervals: [0, 3, 7] },
  { id: "dim", label: "Diminished", intervals: [0, 3, 6] },
  { id: "aug", label: "Augmented", intervals: [0, 4, 8] },
  { id: "sus2", label: "Sus2", intervals: [0, 2, 7] },
  { id: "sus4", label: "Sus4", intervals: [0, 5, 7] },
  { id: "6", label: "Sixth", intervals: [0, 4, 7, 9] },
  { id: "min6", label: "Minor 6", intervals: [0, 3, 7, 9] },
  { id: "7", label: "Dominant 7", intervals: [0, 4, 7, 10] },
  { id: "maj7", label: "Major 7", intervals: [0, 4, 7, 11] },
  { id: "min7", label: "Minor 7", intervals: [0, 3, 7, 10] },
  { id: "min7b5", label: "Half-diminished", intervals: [0, 3, 6, 10] },
  { id: "dim7", label: "Diminished 7", intervals: [0, 3, 6, 9] },
  { id: "9", label: "Dominant 9", intervals: [0, 4, 7, 10, 14] },
  { id: "maj9", label: "Major 9", intervals: [0, 4, 7, 11, 14] },
  { id: "add9", label: "Add 9", intervals: [0, 4, 7, 14] },
];

/** A guitar shape: fret per string low->high E; -1 = muted, 0 = open. Fingers parallel. */
export interface GuitarShape { frets: number[]; fingers: number[]; baseFret?: number; }

// Curated open-position shapes for the most-taught chords.
export const GUITAR_SHAPES: Record<string, GuitarShape> = {
  "C_maj": { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "A_maj": { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  "G_maj": { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "E_maj": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "D_maj": { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "A_min": { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "E_min": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "D_min": { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  "G_7":   { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  "C_maj7":{ frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  "A_min7":{ frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  "E_min7":{ frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
};

export function chordNotes(root: string, qualityId: string): string[] {
  const q = CHORD_QUALITIES.find((c) => c.id === qualityId) ?? CHORD_QUALITIES[0];
  const flats = /b/.test(root) || ["F", "Bb", "Eb", "Ab", "Db"].includes(root);
  return spell(root, q.intervals, flats);
}

/** Piano voicing = MIDI-ordered notes in a comfortable octave (root position + one inversion). */
export function pianoVoicings(root: string, qualityId: string): { root_position: string[]; first_inversion: string[] } {
  const notes = chordNotes(root, qualityId);
  const inv = [...notes.slice(1), notes[0]];
  return { root_position: notes, first_inversion: inv };
}

export function guitarShape(root: string, qualityId: string): GuitarShape | null {
  return GUITAR_SHAPES[`${root}_${qualityId}`] ?? null;
}
