/**
 * useAudioEngine — the Phase 3 control surface. Wraps an AnalyserNode (from the
 * Phase 1 musicAudioEngine or any audio track), measures real metrics each
 * frame, periodically scores them via the server engine, and exposes the
 * instrument mode, DSP toggles, manual gain and mic/speaker tests.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioAnalyzer, type AudioMetrics, detectHeadphones, readNetworkStats,
} from "../../../lib/audio/audioDiagnostics";

export interface Assessment { score: number; level: string; recommendations: string[]; }
export interface Toggles { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean; }

export function useAudioEngine(opts: {
  apiBase: string; token: string; analyser: AnalyserNode | null;
  gainNode?: GainNode | null; instrument: string;
  outputLabel?: string; getStats?: () => Promise<RTCStatsReport | undefined>;
}) {
  const [level, setLevel] = useState({ peak_dbfs: -100, rms_dbfs: -100, noise_floor_dbfs: -60, clipping_pct: 0 });
  const [net, setNet] = useState({ loss_pct: 0, rtt_ms: 0 });
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [toggles, setToggles] = useState<Toggles>({ echoCancellation: false, noiseSuppression: false, autoGainControl: false });
  const [gain, setGainState] = useState(1);
  const [headphones, setHeadphones] = useState(detectHeadphones(opts.outputLabel));

  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const rafRef = useRef<number>(undefined);
  const latestMetrics = useRef<AudioMetrics | null>(null);

  useEffect(() => {
    setHeadphones(detectHeadphones(opts.outputLabel));
  }, [opts.outputLabel]);

  // measurement loop (real-time meter)
  useEffect(() => {
    if (!opts.analyser) return;
    analyzerRef.current = new AudioAnalyzer(opts.analyser);
    const loop = () => {
      const s = analyzerRef.current!.sample();
      setLevel(s);
      latestMetrics.current = {
        ...s, ...net, noise_suppression_on: toggles.noiseSuppression,
        using_headphones: headphones, instrument: opts.instrument,
        is_music_profile: opts.instrument !== "theory",
      };
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [opts.analyser, net, toggles.noiseSuppression, headphones, opts.instrument]);

  // network stats + server scoring every 3s (reuses backend engine, no logic dup)
  useEffect(() => {
    const id = window.setInterval(async () => {
      const n = await readNetworkStats(opts.getStats);
      setNet(n);
      const m = latestMetrics.current;
      if (!m) return;
      try {
        const res = await fetch(`${opts.apiBase}/v1/audio/assess`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.token}` },
          body: JSON.stringify({ ...m, ...n }),
        });
        if (res.ok) setAssessment(await res.json());
      } catch { /* offline: keep last assessment */ }
    }, 3000);
    return () => window.clearInterval(id);
  }, [opts.apiBase, opts.token, opts.getStats]);

  const setGain = useCallback((v: number) => {
    setGainState(v);
    if (opts.gainNode) opts.gainNode.gain.value = v;
  }, [opts.gainNode]);

  const toggle = useCallback((key: keyof Toggles) =>
    setToggles((t) => ({ ...t, [key]: !t[key] })), []);

  // Mic test: measure 2s and report the peak seen. Speaker test: play a tone.
  const micTest = useCallback(async (): Promise<number> => {
    let peak = -100;
    const started = performance.now();
    return new Promise((resolve) => {
      const tick = () => {
        if (analyzerRef.current) peak = Math.max(peak, analyzerRef.current.sample().peak_dbfs);
        if (performance.now() - started < 2000) requestAnimationFrame(tick);
        else resolve(+peak.toFixed(1));
      };
      tick();
    });
  }, []);

  const speakerTest = useCallback(async (_sinkId?: string) => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.frequency.value = 440; g.gain.value = 0.15;
    osc.connect(g); g.connect(ctx.destination);
    // route to a specific speaker if the browser supports setSinkId on an element
    osc.start(); osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 800);
  }, []);

  return {
    level, net, assessment, toggles, gain, headphones,
    setGain, toggle, setHeadphones, micTest, speakerTest,
  };
}
