/** Metronome control on top of the Phase 1 sample-accurate Metronome scheduler.
 *  Adds tap tempo, time signature, accent pattern and a visual pulse beat. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Metronome } from "../../audio/musicAudioEngine";

export function useMetronome() {
  const ctxRef = useRef<AudioContext>(undefined);
  const metroRef = useRef<Metronome>(undefined);
  const [bpm, setBpm] = useState(90);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const tapTimes = useRef<number[]>([]);
  const beatTimer = useRef<number>(undefined);

  useEffect(() => () => { metroRef.current?.stop(); ctxRef.current?.close(); }, []);

  const start = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const m = new Metronome(ctxRef.current, bpm, beatsPerBar);
    metroRef.current = m;
    m.start();
    setRunning(true);
    // drive a visual pulse aligned to BPM (audio stays sample-accurate in the engine)
    let b = 0;
    const pulse = () => {
      setBeat(b % beatsPerBar); b++;
      beatTimer.current = window.setTimeout(pulse, (60 / bpm) * 1000);
    };
    pulse();
  }, [bpm, beatsPerBar]);

  const stop = useCallback(() => {
    metroRef.current?.stop();
    window.clearTimeout(beatTimer.current);
    setRunning(false); setBeat(-1);
  }, []);

  // keep a live metronome in sync when BPM changes
  useEffect(() => { if (metroRef.current) metroRef.current.bpm = bpm; }, [bpm]);
  useEffect(() => { if (metroRef.current) metroRef.current.beatsPerBar = beatsPerBar; }, [beatsPerBar]);

  const tap = useCallback(() => {
    const now = performance.now();
    tapTimes.current = [...tapTimes.current, now].slice(-5);
    if (tapTimes.current.length >= 2) {
      const gaps = tapTimes.current.slice(1).map((t, i) => t - tapTimes.current[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const next = Math.round(60000 / avg);
      if (next >= 30 && next <= 300) setBpm(next);
    }
  }, []);

  return { bpm, setBpm, beatsPerBar, setBeatsPerBar, running, beat, start, stop, tap };
}
