/** Live tuner: reads an AnalyserNode, detects pitch, maps to nearest note (or
 *  nearest string for the selected instrument) and reports cents + in-tune. */
import { useEffect, useRef, useState } from "react";
import { detectPitchHz } from "../../../lib/theory/pitch";
import { freqToNote } from "../../../lib/theory/notes";
import { nearestString } from "../../../lib/theory/tunings";

export interface TunerReading {
  hz: number; note: string; octave: number; cents: number;
  targetString: string | null; inTune: boolean;
}

export function useTuner(analyser: AnalyserNode | null, tuningId: string) {
  const [reading, setReading] = useState<TunerReading | null>(null);
  const raf = useRef<number>(undefined);
  const buf = useRef<Float32Array<ArrayBuffer>>(undefined);

  useEffect(() => {
    if (!analyser) return;
    buf.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
    const loop = () => {
      analyser.getFloatTimeDomainData(buf.current!);
      const hz = detectPitchHz(buf.current!, analyser.context.sampleRate);
      if (hz > 0) {
        const n = freqToNote(hz);
        const near = nearestString(tuningId, hz);
        setReading({
          hz: +hz.toFixed(1), note: n.note, octave: n.octave, cents: n.cents,
          targetString: near ? `${near.note}${near.octave}` : null,
          inTune: Math.abs(n.cents) <= 5,
        });
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [analyser, tuningId]);

  return reading;
}
