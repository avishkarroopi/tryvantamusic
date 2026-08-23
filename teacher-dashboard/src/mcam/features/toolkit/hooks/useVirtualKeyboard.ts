/** Virtual M-Key: piano keyboard with a percussive plucked-tine synth voice,
 *  chord/scale overlays (shared theory), and a lightweight auto-accompaniment
 *  arranger (Basic / Arpeggio / Waltz backing patterns). */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nameToPc, pcToName } from "../../../lib/theory/notes";
import { CHORD_QUALITIES, chordNotes } from "../../../lib/theory/chords";
import { SCALES, scaleNotes } from "../../../lib/theory/scales";
import { playKeyNote } from "../../../lib/audio/keySynth";

export const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11]; // pitch classes that are white keys
export type ArrangerStyle = "off" | "basic" | "arpeggio" | "waltz";

export function useVirtualKeyboard() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [octave, setOctave] = useState(4);
  const [octaveSpan, setOctaveSpan] = useState(2);
  const [overlay, setOverlay] = useState<"none" | "chord" | "scale">("none");
  const [root, setRoot] = useState("C");
  const [quality, setQuality] = useState("maj");
  const [scaleId, setScaleId] = useState("major");
  const [arranger, setArranger] = useState<ArrangerStyle>("off");
  const [bpm, setBpm] = useState(96);
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const arrangerTimer = useRef<number | null>(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playNote = useCallback((midi: number, velocity = 0.7, duration = 1.1) => {
    const ctx = ensureCtx();
    playKeyNote(ctx, midi, velocity, duration);
    setActiveKeys((s) => new Set(s).add(midi));
    window.setTimeout(() => setActiveKeys((s) => { const n = new Set(s); n.delete(midi); return n; }), 220);
  }, [ensureCtx]);

  const keys = useMemo(() => {
    const start = (octave) * 12; // C{octave} as MIDI-ish base (C4 = 60 -> octave*12=48, offset below)
    const totalWhite = 7 * octaveSpan + 1;
    const out: { midi: number; isWhite: boolean; whiteIndex?: number }[] = [];
    let midi = start + 12; // align so octave=4 gives C4=60
    let whiteIndex = 0;
    while (out.filter((k) => k.isWhite).length < totalWhite) {
      const pc = ((midi % 12) + 12) % 12;
      const isWhite = WHITE_STEPS.includes(pc);
      out.push({ midi, isWhite, whiteIndex: isWhite ? whiteIndex : undefined });
      if (isWhite) whiteIndex++;
      midi++;
    }
    return out;
  }, [octave, octaveSpan]);

  const overlayPcs = useMemo(() => {
    if (overlay === "chord") return new Set(chordNotes(root, quality).map(nameToPc));
    if (overlay === "scale") return new Set(scaleNotes(root, scaleId).map(nameToPc));
    return new Set<number>();
  }, [overlay, root, quality, scaleId]);

  const isRootPc = useCallback((midi: number) => ((midi % 12) + 12) % 12 === nameToPc(root), [root]);
  const noteName = useCallback((midi: number) => pcToName(((midi % 12) + 12) % 12), []);

  const chordMidiNotes = useCallback((rootName: string, qualityId: string, baseOctave: number) => {
    const notes = chordNotes(rootName, qualityId);
    const baseMidi = (baseOctave + 1) * 12;
    return notes.map((n, i) => baseMidi + nameToPc(n) + (nameToPc(n) < nameToPc(notes[0]) && i > 0 ? 12 : 0));
  }, []);

  // --- Arranger: simple backing patterns driven by the current chord overlay ---
  useEffect(() => {
    if (arrangerTimer.current) { window.clearTimeout(arrangerTimer.current); arrangerTimer.current = null; }
    if (arranger === "off") return;

    const notes = chordMidiNotes(root, quality, 3);
    const beatMs = 60000 / bpm;
    let step = 0;

    const tick = () => {
      if (arranger === "basic") {
        if (step % 4 === 0) notes.forEach((n) => playNote(n, 0.35, 0.9));
      } else if (arranger === "arpeggio") {
        const n = notes[step % notes.length];
        playNote(n, 0.4, 0.5);
      } else if (arranger === "waltz") {
        if (step % 3 === 0) playNote(notes[0] - 12, 0.4, 0.8); // bass on beat 1
        else notes.slice(1).forEach((n) => playNote(n, 0.25, 0.5)); // chord on 2 & 3
      }
      step++;
      arrangerTimer.current = window.setTimeout(tick, arranger === "waltz" ? beatMs : beatMs);
    };
    arrangerTimer.current = window.setTimeout(tick, 10);
    return () => { if (arrangerTimer.current) window.clearTimeout(arrangerTimer.current); };
  }, [arranger, root, quality, bpm, chordMidiNotes, playNote]);

  useEffect(() => () => { if (arrangerTimer.current) window.clearTimeout(arrangerTimer.current); }, []);

  return {
    keys, octave, setOctave, octaveSpan, setOctaveSpan, playNote, activeKeys,
    overlay, setOverlay, root, setRoot, quality, setQuality, scaleId, setScaleId,
    overlayPcs, isRootPc, noteName, arranger, setArranger, bpm, setBpm,
    chordQualities: CHORD_QUALITIES, scales: SCALES,
  };
}
