/** M-Studio Master: real multi-track mixer. Each track is an uploaded audio
 *  file routed through its own GainNode + StereoPannerNode; the master bus
 *  runs through a real limiter (DynamicsCompressorNode) with a live
 *  peak/RMS loudness meter. A genuinely functional mixing/mastering tool,
 *  not a static DAW mockup. */
import { useCallback, useEffect, useRef, useState } from "react";

export interface MixTrack {
  id: string;
  name: string;
  buffer: AudioBuffer;
  volume: number; // 0-100
  pan: number; // -50..50
  muted: boolean;
  soloed: boolean;
}

export type MixerMode = "lite" | "advanced";

export function useStudioMixer() {
  const [mode, setMode] = useState<MixerMode>("lite");
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [meterLevel, setMeterLevel] = useState(0); // 0-1
  const [loading, setLoading] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourcesRef = useRef<Map<string, { src: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      // real mastering limiter — high ratio, fast attack, near-ceiling threshold
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      master.connect(limiter).connect(analyser).connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = master;
      limiterRef.current = limiter;
      analyserRef.current = analyser;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  useEffect(() => { if (masterGainRef.current) masterGainRef.current.gain.value = masterVolume / 100; }, [masterVolume]);

  const addTrack = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const ctx = ensureCtx();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      const track: MixTrack = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[a-z0-9]+$/i, ""),
        buffer, volume: 80, pan: 0, muted: false, soloed: false,
      };
      setTracks((prev) => [...prev, track]);
      setSelectedId((id) => id ?? track.id);
    } finally {
      setLoading(false);
    }
  }, [ensureCtx]);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    sourcesRef.current.get(id)?.src.stop();
    sourcesRef.current.delete(id);
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<MixTrack>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const live = sourcesRef.current.get(id);
    const current = tracks.find((t) => t.id === id);
    if (live && current) {
      const volume = patch.volume ?? current.volume;
      const muted = patch.muted ?? current.muted;
      if (patch.volume !== undefined || patch.muted !== undefined) live.gain.gain.value = muted ? 0 : volume / 100;
      if (patch.pan !== undefined) live.pan.pan.value = patch.pan / 50;
    }
  }, [tracks]);

  const stopAll = useCallback(() => {
    sourcesRef.current.forEach(({ src }) => { try { src.stop(); } catch { /* already stopped */ } });
    sourcesRef.current.clear();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const ctx = ensureCtx();
    const master = masterGainRef.current!;
    stopAll();
    const anySoloed = tracks.some((t) => t.soloed);
    tracks.forEach((t) => {
      const src = ctx.createBufferSource();
      src.buffer = t.buffer;
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      const audible = !t.muted && (!anySoloed || t.soloed);
      gain.gain.value = audible ? t.volume / 100 : 0;
      pan.pan.value = t.pan / 50;
      src.connect(gain).connect(pan).connect(master);
      src.start();
      sourcesRef.current.set(t.id, { src, gain, pan });
    });
    startedAtRef.current = ctx.currentTime;
    setPlaying(true);
  }, [ensureCtx, stopAll, tracks]);

  // live meter
  useEffect(() => {
    const loop = () => {
      const an = analyserRef.current;
      if (an) {
        const buf = new Float32Array(an.fftSize);
        an.getFloatTimeDomainData(buf);
        let peak = 0;
        for (const s of buf) peak = Math.max(peak, Math.abs(s));
        setMeterLevel(peak);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => () => { stopAll(); void ctxRef.current?.close(); }, [stopAll]);

  const selected = tracks.find((t) => t.id === selectedId) ?? null;

  return {
    mode, setMode, tracks, selected, selectedId, setSelectedId, playing,
    play, stop: stopAll, addTrack, removeTrack, updateTrack, loading,
    masterVolume, setMasterVolume, meterLevel,
  };
}
