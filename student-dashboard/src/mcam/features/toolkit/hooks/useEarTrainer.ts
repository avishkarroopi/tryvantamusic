/** M-EARS ear-training engine: pitch matching (sing-back), interval ID, and
 *  chord-quality ID. Shares the classroom's live AnalyserNode when given one
 *  (inside M-CAM); otherwise opens its own mic so the tool works standalone
 *  on the dashboards' Music Tools page too. */
import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitchHz } from "../../../lib/theory/pitch";
import { freqToNote, midiToFreq, NOTE_NAMES } from "../../../lib/theory/notes";

export type EarMode = "pitch" | "interval" | "chord";

export const INTERVALS = [
  { name: "Unison", semitones: 0 },
  { name: "Minor 2nd", semitones: 1 },
  { name: "Major 2nd", semitones: 2 },
  { name: "Minor 3rd", semitones: 3 },
  { name: "Major 3rd", semitones: 4 },
  { name: "Perfect 4th", semitones: 5 },
  { name: "Tritone", semitones: 6 },
  { name: "Perfect 5th", semitones: 7 },
] as const;

export const CHORD_TYPES = [
  { name: "Major", intervals: [0, 4, 7] },
  { name: "Minor", intervals: [0, 3, 7] },
  { name: "Diminished", intervals: [0, 3, 6] },
  { name: "Augmented", intervals: [0, 4, 8] },
] as const;

export interface PitchReading { note: string; octave: number; cents: number; midi: number }
export interface EarState {
  audioReady: boolean;
  listening: boolean;
  detected: PitchReading | null;
  target: { note: string; octave: number; midi: number } | null;
  feedback: string;
  score: { correct: number; total: number };
  interval: (typeof INTERVALS)[number] | null;
  chord: (typeof CHORD_TYPES)[number] | null;
  quiz: "idle" | "playing" | "answered";
  level: number;
}

export function useEarTrainer(sharedAnalyser: AnalyserNode | null) {
  const [mode, setMode] = useState<EarMode>("pitch");
  const [state, setState] = useState<EarState>({
    audioReady: false, listening: false, detected: null, target: null,
    feedback: "Press Start to begin.", score: { correct: 0, total: 0 },
    interval: null, chord: null, quiz: "idle", level: 1,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const ownAnalyserRef = useRef<AnalyserNode | null>(null);
  const ownStreamRef = useRef<MediaStream | null>(null);
  const raf = useRef<number>(undefined);
  const buf = useRef<Float32Array<ArrayBuffer>>(undefined);
  const listeningRef = useRef(false);
  const modeRef = useRef<EarMode>("pitch");
  modeRef.current = mode;

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  /** Acquire our own mic+analyser only when no shared classroom analyser exists. */
  const ensureInput = useCallback(async () => {
    if (sharedAnalyser) { setState((s) => ({ ...s, audioReady: true })); return sharedAnalyser; }
    if (ownAnalyserRef.current) return ownAnalyserRef.current;
    const ctx = ensureCtx();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    ownStreamRef.current = stream;
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    src.connect(an);
    ownAnalyserRef.current = an;
    setState((s) => ({ ...s, audioReady: true }));
    return an;
  }, [sharedAnalyser, ensureCtx]);

  const playTone = useCallback((freq: number, duration = 0.6, type: OscillatorType = "sine", delay = 0) => {
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }, [ensureCtx]);

  /* ---- Pitch listening loop (autocorrelation on whichever analyser is live) ---- */
  useEffect(() => {
    const analyser = sharedAnalyser ?? ownAnalyserRef.current;
    if (!analyser) return;
    buf.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
    const loop = () => {
      analyser.getFloatTimeDomainData(buf.current!);
      if (listeningRef.current && modeRef.current === "pitch") {
        const hz = detectPitchHz(buf.current!, analyser.context.sampleRate);
        if (hz > 0) {
          const n = freqToNote(hz);
          setState((s) => ({ ...s, detected: { note: n.note, octave: n.octave, cents: n.cents, midi: n.midi } }));
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [sharedAnalyser, state.audioReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    ownStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (!sharedAnalyser) void ctxRef.current?.close();
  }, [sharedAnalyser]);

  const startPitchExercise = useCallback(async () => {
    await ensureInput();
    listeningRef.current = false;
    const midi = 48 + Math.floor(Math.random() * (12 + state.level * 3));
    const note = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    setState((s) => ({ ...s, target: { note, octave, midi }, listening: false, feedback: `Listen: ${note}${octave}` }));
    playTone(midiToFreq(midi), 1.0);
    window.setTimeout(() => {
      listeningRef.current = true;
      setState((s) => ({ ...s, listening: true, feedback: `Now sing/play: ${note}${octave}` }));
    }, 1200);
  }, [ensureInput, playTone, state.level]);

  // auto-check pitch match while listening
  useEffect(() => {
    if (mode !== "pitch" || !state.listening || !state.detected || !state.target) return;
    const { detected, target } = state;
    if (detected.note === target.note && detected.octave === target.octave && Math.abs(detected.cents) < 15) {
      listeningRef.current = false;
      playTone(880, 0.12);
      setState((s) => ({
        ...s, listening: false, feedback: "Perfect pitch! 🎯",
        score: { correct: s.score.correct + 1, total: s.score.total + 1 },
      }));
      window.setTimeout(startPitchExercise, 1600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.detected]);

  const playInterval = useCallback(async (fresh: boolean) => {
    await ensureInput();
    setState((s) => ({ ...s, quiz: "playing", feedback: "Listen closely…" }));
    const rootMidi = 48 + Math.floor(Math.random() * 12);
    const pool = INTERVALS.slice(0, 4 + state.level);
    const chosen = fresh ? pool[Math.floor(Math.random() * pool.length)] : state.interval ?? pool[0];
    playTone(midiToFreq(rootMidi), 0.7, "triangle", 0);
    playTone(midiToFreq(rootMidi + chosen.semitones), 0.7, "triangle", 0.75);
    setState((s) => ({ ...s, interval: chosen }));
    window.setTimeout(() => setState((s) => ({ ...s, quiz: "idle", feedback: "Which interval was that?" })), 1500);
  }, [ensureInput, playTone, state.interval, state.level]);

  const answerInterval = useCallback((name: string) => {
    setState((s) => {
      if (s.quiz === "answered" || !s.interval) return s;
      const correct = name === s.interval.name;
      playTone(correct ? 880 : 196, correct ? 0.12 : 0.3, correct ? "sine" : "sawtooth");
      return {
        ...s, quiz: "answered",
        feedback: correct ? "Correct! 🎯" : `Not quite — that was ${s.interval.name}.`,
        score: { correct: s.score.correct + (correct ? 1 : 0), total: s.score.total + 1 },
      };
    });
  }, [playTone]);

  const playChord = useCallback(async (fresh: boolean) => {
    await ensureInput();
    setState((s) => ({ ...s, quiz: "playing", feedback: "Listen to the chord quality…" }));
    const rootMidi = 48 + Math.floor(Math.random() * 12);
    const pool = state.level >= 3 ? CHORD_TYPES : CHORD_TYPES.slice(0, 2);
    const chosen = fresh ? pool[Math.floor(Math.random() * pool.length)] : state.chord ?? pool[0];
    chosen.intervals.forEach((iv) => playTone(midiToFreq(rootMidi + iv), 1.4, "sine", 0));
    setState((s) => ({ ...s, chord: chosen }));
    window.setTimeout(() => setState((s) => ({ ...s, quiz: "idle", feedback: "What chord quality is that?" })), 1500);
  }, [ensureInput, playTone, state.chord, state.level]);

  const answerChord = useCallback((name: string) => {
    setState((s) => {
      if (s.quiz === "answered" || !s.chord) return s;
      const correct = name === s.chord.name;
      playTone(correct ? 880 : 196, correct ? 0.12 : 0.3, correct ? "sine" : "sawtooth");
      return {
        ...s, quiz: "answered",
        feedback: correct ? "Correct! 🎯" : `Not quite — that was ${s.chord.name}.`,
        score: { correct: s.score.correct + (correct ? 1 : 0), total: s.score.total + 1 },
      };
    });
  }, [playTone]);

  const setLevel = useCallback((n: number) => setState((s) => ({ ...s, level: Math.max(1, Math.min(5, n)) })), []);
  const changeMode = useCallback((m: EarMode) => {
    listeningRef.current = false;
    setState((s) => ({ ...s, target: null, listening: false, quiz: "idle", feedback: "Press Start to begin." }));
    setMode(m);
  }, []);

  return { mode, state, changeMode, startPitchExercise, playInterval, answerInterval, playChord, answerChord, setLevel, playTone };
}
