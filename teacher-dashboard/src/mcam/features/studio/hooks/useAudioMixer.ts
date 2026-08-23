/** Web Audio mixer: each channel gets a GainNode + AnalyserNode. Mute/solo
 *  adjust effective gain; meters read the analyser. Live monitor routes a
 *  channel to the destination (headphones). */
import { useEffect, useRef, useState } from "react";
import type { MixerChannel } from "../model";

interface Strip { gain: GainNode; analyser: AnalyserNode; buf: Float32Array<ArrayBuffer>; }

export function useAudioMixer(channels: MixerChannel[], sources: Map<string, MediaStream>) {
  const ctxRef = useRef<AudioContext>(undefined);
  const strips = useRef(new Map<string, Strip>());
  const [levels, setLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    channels.forEach((ch) => {
      const stream = sources.get(ch.id);
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
      if (stream) {
        const src = ctx.createMediaStreamSource(stream);
        src.connect(gain);
      }
      gain.connect(analyser);
      if (ch.monitor) gain.connect(ctx.destination);
      strips.current.set(ch.id, { gain, analyser, buf: new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer> });
    });

    let raf: number;
    const meter = () => {
      const next: Record<string, number> = {};
      strips.current.forEach((s, id) => {
        s.analyser.getFloatTimeDomainData(s.buf);
        let sum = 0; for (const v of s.buf) sum += v * v;
        next[id] = Math.sqrt(sum / s.buf.length);
      });
      setLevels(next);
      raf = requestAnimationFrame(meter);
    };
    raf = requestAnimationFrame(meter);
    return () => { cancelAnimationFrame(raf); ctx.close(); strips.current.clear(); };
  }, [sources]); // eslint-disable-line react-hooks/exhaustive-deps

  // apply gain/mute/solo whenever the channel config changes
  useEffect(() => {
    const anySolo = channels.some((c) => c.solo);
    channels.forEach((ch) => {
      const strip = strips.current.get(ch.id);
      if (!strip) return;
      const audible = ch.muted ? 0 : anySolo ? (ch.solo ? ch.gain : 0) : ch.gain;
      strip.gain.gain.value = audible;
    });
  }, [channels]);

  return { levels };
}
