/** Virtual Guitar engine: standard-tuned fretboard model, Karplus-Strong
 *  plucking, chord-shape overlays and scale-tone highlighting reusing the
 *  shared chord/scale theory. */
import { useCallback, useMemo, useRef, useState } from "react";
import { TUNINGS } from "../../../lib/theory/tunings";
import { midiToFreq, nameToPc, noteToMidi, pcToName } from "../../../lib/theory/notes";
import { CHORD_QUALITIES, GUITAR_SHAPES, guitarShape } from "../../../lib/theory/chords";
import { SCALES, scaleNotes } from "../../../lib/theory/scales";
import { playPluck } from "../../../lib/audio/pluckSynth";

export const FRET_COUNT = 15;
export const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type GuitarMode = "free" | "chords" | "scales";

const STRINGS = TUNINGS.find((t) => t.id === "guitar")!.strings; // low -> high: E2 A2 D3 G3 B3 E4

export function useVirtualGuitar() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<GuitarMode>("free");
  const [root, setRoot] = useState("C");
  const [chordQuality, setChordQuality] = useState("maj");
  const [scaleId, setScaleId] = useState("major");
  const [ringing, setRinging] = useState<string | null>(null); // "stringIdx-fret" for a brief highlight

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /** MIDI note for a given string (0 = low E) at a given fret. */
  const midiAt = useCallback((stringIdx: number, fret: number) => {
    const open = STRINGS[stringIdx];
    return noteToMidi(open.note, open.octave) + fret;
  }, []);

  const pluck = useCallback((stringIdx: number, fret: number) => {
    const ctx = ensureCtx();
    const freq = midiToFreq(midiAt(stringIdx, fret));
    playPluck(ctx, freq, { gain: 0.5 });
    const key = `${stringIdx}-${fret}`;
    setRinging(key);
    window.setTimeout(() => setRinging((k) => (k === key ? null : k)), 220);
  }, [ensureCtx, midiAt]);

  const shape = useMemo(() => guitarShape(root, chordQuality), [root, chordQuality]);
  const availableChordRoots = useMemo(
    () => [...new Set(Object.keys(GUITAR_SHAPES).map((k) => k.split("_")[0]))],
    [],
  );

  const strumShape = useCallback((s = shape) => {
    if (!s) return;
    const ctx = ensureCtx();
    s.frets.forEach((fret, stringIdx) => {
      if (fret < 0) return; // muted
      const freq = midiToFreq(midiAt(stringIdx, fret));
      window.setTimeout(() => playPluck(ctx, freq, { gain: 0.5 }), stringIdx * 18);
    });
  }, [ensureCtx, midiAt, shape]);

  const scaleNoteSet = useMemo(() => {
    const notes = scaleNotes(root, scaleId).map(nameToPc);
    return new Set(notes);
  }, [root, scaleId]);

  const isScaleTone = useCallback((stringIdx: number, fret: number) => {
    const pc = ((midiAt(stringIdx, fret) % 12) + 12) % 12;
    return scaleNoteSet.has(pc);
  }, [midiAt, scaleNoteSet]);

  const isRootTone = useCallback((stringIdx: number, fret: number) => {
    const pc = ((midiAt(stringIdx, fret) % 12) + 12) % 12;
    return pc === nameToPc(root);
  }, [midiAt, root]);

  const noteNameAt = useCallback((stringIdx: number, fret: number) => {
    const pc = ((midiAt(stringIdx, fret) % 12) + 12) % 12;
    return pcToName(pc);
  }, [midiAt]);

  return {
    strings: STRINGS, fretCount: FRET_COUNT, mode, setMode,
    root, setRoot, chordQuality, setChordQuality, scaleId, setScaleId,
    ringing, pluck, shape, availableChordRoots, strumShape,
    isScaleTone, isRootTone, noteNameAt, chordQualities: CHORD_QUALITIES, scales: SCALES,
  };
}
