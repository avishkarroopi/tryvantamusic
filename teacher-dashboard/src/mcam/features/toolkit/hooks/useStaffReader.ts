/** M-STAFF (ported from the recovered "Celffly" sight-reading module): read a
 *  note off a real musical staff (treble/bass/grand) and identify it on the
 *  keyboard before the timer runs out. 7 progressive levels. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playKeyNote } from "../../../lib/audio/keySynth";

export interface StaffLevel {
  id: number; title: string; description: string;
  clef: "treble" | "bass" | "grand";
  range: [number, number]; // MIDI
  accidentals: boolean;
  timer: number | null; // seconds, null = untimed
  sequenceLength: number;
}

export const LEVELS: StaffLevel[] = [
  { id: 1, title: "First Steps", description: "Learn the notes on the Treble Clef. No timer, just explore.", clef: "treble", range: [60, 72], accidentals: false, timer: null, sequenceLength: 1 },
  { id: 2, title: "Speed Reader", description: "Treble Clef with a 5-second timer per note.", clef: "treble", range: [60, 77], accidentals: false, timer: 5, sequenceLength: 1 },
  { id: 3, title: "Into the Deep", description: "Introduction to the Bass Clef.", clef: "bass", range: [48, 60], accidentals: false, timer: 5, sequenceLength: 1 },
  { id: 4, title: "Melody Maker", description: "Play back short sequences of notes.", clef: "treble", range: [60, 72], accidentals: false, timer: 15, sequenceLength: 3 },
  { id: 5, title: "Black Keys", description: "Accidentals (sharps and flats) introduced.", clef: "treble", range: [60, 72], accidentals: true, timer: 6, sequenceLength: 1 },
  { id: 6, title: "Grand Staff", description: "Treble and bass together, wide range.", clef: "grand", range: [48, 72], accidentals: false, timer: 6, sequenceLength: 1 },
  { id: 7, title: "Maestro", description: "Grand Staff, large range, accidentals, fast timer.", clef: "grand", range: [48, 84], accidentals: true, timer: 4, sequenceLength: 2 },
];

export interface StaffNote { midi: number }

function randomNote(level: StaffLevel): number {
  const [lo, hi] = level.range;
  let midi: number;
  do { midi = lo + Math.floor(Math.random() * (hi - lo + 1)); }
  while (!level.accidentals && [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12));
  return midi;
}

export function useStaffReader() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [target, setTarget] = useState<StaffNote[]>([]);
  const [playedIdx, setPlayedIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0, best: 0 });
  const [running, setRunning] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const level = LEVELS[levelIdx];

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const nextRound = useCallback(() => {
    const notes = Array.from({ length: level.sequenceLength }, () => ({ midi: randomNote(level) }));
    setTarget(notes);
    setPlayedIdx(0);
    setFeedback("idle");
    setTimeLeft(level.timer);
    setRunning(true);
  }, [level]);

  useEffect(() => { nextRound(); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // countdown timer
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!running || level.timer === null || timeLeft === null) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return t;
        if (t <= 0.1) {
          window.clearInterval(timerRef.current!);
          setFeedback("wrong");
          setRunning(false);
          setScore((s) => ({ ...s, total: s.total + 1, streak: 0 }));
          window.setTimeout(nextRound, 1200);
          return 0;
        }
        return +(t - 0.1).toFixed(1);
      });
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [running, level.timer, nextRound]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback((midi: number) => {
    if (!running || target.length === 0) return;
    const ctx = ensureCtx();
    playKeyNote(ctx, midi, 0.5, 0.5);
    if (midi === target[playedIdx].midi) {
      if (playedIdx + 1 < target.length) {
        setPlayedIdx((i) => i + 1);
        return;
      }
      setFeedback("correct");
      setRunning(false);
      setScore((s) => { const streak = s.streak + 1; return { correct: s.correct + 1, total: s.total + 1, streak, best: Math.max(s.best, streak) }; });
      window.setTimeout(nextRound, 900);
    } else {
      setFeedback("wrong");
      setRunning(false);
      setScore((s) => ({ ...s, total: s.total + 1, streak: 0 }));
      window.setTimeout(nextRound, 1200);
    }
  }, [running, target, playedIdx, ensureCtx, nextRound]);

  const playTarget = useCallback(() => {
    const ctx = ensureCtx();
    target.forEach((n, i) => window.setTimeout(() => playKeyNote(ctx, n.midi, 0.5, 0.5), i * 550));
  }, [ensureCtx, target]);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); void ctxRef.current?.close(); }, []);

  const accuracy = useMemo(() => (score.total === 0 ? 100 : Math.round((score.correct / score.total) * 100)), [score]);

  return { level, levelIdx, setLevelIdx, target, playedIdx, timeLeft, feedback, score, accuracy, answer, playTarget, levels: LEVELS };
}
