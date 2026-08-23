/** M-BEAT: tap-timing accuracy trainer. Sample-accurate lookahead scheduler
 *  (same pattern as the Metronome class) generates click targets; the
 *  learner taps (mouse/touch/spacebar) and gets graded against them. */
import { useCallback, useEffect, useRef, useState } from "react";

export type Subdivision = "quarter" | "eighth" | "sixteenth" | "triplet";
export type Rating = "Perfect" | "Great" | "Good" | "Early" | "Late" | "Miss";

export interface HitResult { deltaMs: number; rating: Rating; ts: number }
export interface BeatStats { hits: number; misses: number; avgOffsetMs: number; streak: number; bestStreak: number; score: number }

const TOLERANCE = { PERFECT: 35, GREAT: 70, GOOD: 120 };
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

export function useBeatTrainer() {
  const [bpm, setBpm] = useState(100);
  const [subdivision, setSubdivision] = useState<Subdivision>("quarter");
  const [running, setRunning] = useState(false);
  const [beatPhase, setBeatPhase] = useState(0); // 0..1, drives the visual pulse
  const [lastHit, setLastHit] = useState<HitResult | null>(null);
  const [stats, setStats] = useState<BeatStats>({ hits: 0, misses: 0, avgOffsetMs: 0, streak: 0, bestStreak: 0, score: 0 });

  const ctxRef = useRef<AudioContext | null>(null);
  const nextTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const targetsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const subRef = useRef(subdivision); subRef.current = subdivision;

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const click = useCallback((time: number) => {
    const ctx = ctxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const stepFor = (sub: Subdivision, bpmVal: number) => {
    const secondsPerBeat = 60 / bpmVal;
    const mult = sub === "quarter" ? 1 : sub === "eighth" ? 0.5 : sub === "sixteenth" ? 0.25 : 1 / 3;
    return secondsPerBeat * mult;
  };

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    while (nextTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      click(nextTimeRef.current);
      targetsRef.current.push(nextTimeRef.current);
      nextTimeRef.current += stepFor(subRef.current, bpmRef.current);
    }
    const missWindow = TOLERANCE.GOOD / 1000 + 0.15;
    targetsRef.current = targetsRef.current.filter((t) => t > ctx.currentTime - missWindow);
    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  }, [click]);

  const start = useCallback(() => {
    const ctx = ensureCtx();
    targetsRef.current = [];
    nextTimeRef.current = ctx.currentTime + 0.1;
    setStats({ hits: 0, misses: 0, avgOffsetMs: 0, streak: 0, bestStreak: 0, score: 0 });
    setLastHit(null);
    setRunning(true);
    scheduler();
  }, [ensureCtx, scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    targetsRef.current = [];
    setRunning(false);
    setBeatPhase(0);
  }, []);

  useEffect(() => () => { stop(); void ctxRef.current?.close(); }, [stop]);

  // visual pulse driven by audio clock (not setInterval, so it never drifts)
  useEffect(() => {
    const animate = () => {
      const ctx = ctxRef.current;
      if (running && ctx) {
        const step = stepFor(subRef.current, bpmRef.current);
        setBeatPhase((ctx.currentTime % step) / step);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running]);

  const tap = useCallback(() => {
    const ctx = ctxRef.current;
    if (!running || !ctx) return;
    const now = ctx.currentTime;
    let bestDiff = Infinity, bestTarget = -1;
    for (const target of targetsRef.current) {
      const diff = Math.abs(target - now);
      if (diff < bestDiff) { bestDiff = diff; bestTarget = target; }
    }
    const diffMs = bestDiff * 1000;
    const early = bestTarget !== -1 && now < bestTarget;
    let rating: Rating;
    let delta = 0;
    if (diffMs <= TOLERANCE.PERFECT) { rating = "Perfect"; delta = 100; }
    else if (diffMs <= TOLERANCE.GREAT) { rating = "Great"; delta = 75; }
    else if (diffMs <= TOLERANCE.GOOD) { rating = "Good"; delta = 40; }
    else if (diffMs > 250) { rating = "Miss"; delta = -20; }
    else { rating = early ? "Early" : "Late"; delta = 10; }

    setLastHit({ deltaMs: Math.round(early ? -diffMs : diffMs), rating, ts: Date.now() });
    setStats((s) => {
      const isHit = rating !== "Miss";
      const streak = isHit ? s.streak + 1 : 0;
      return {
        hits: isHit ? s.hits + 1 : s.hits,
        misses: !isHit ? s.misses + 1 : s.misses,
        avgOffsetMs: s.hits === 0 ? diffMs : (s.avgOffsetMs * s.hits + diffMs) / (s.hits + 1),
        streak, bestStreak: Math.max(s.bestStreak, streak),
        score: Math.max(0, s.score + delta),
      };
    });
  }, [running]);

  // spacebar = tap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); tap(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  return { bpm, setBpm, subdivision, setSubdivision, running, beatPhase, lastHit, stats, start, stop, tap };
}
