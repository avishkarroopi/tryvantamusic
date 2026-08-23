/** M-TRAINER: upload a song, get real BPM + key detection (autocorrelation +
 *  Krumhansl-Schmuckler chroma analysis — see lib/audio/musicAnalysis.ts),
 *  then jump straight into scale/chord practice in the detected key. */
import { useCallback, useState } from "react";
import { analyzeAudioFile, type AnalysisResult } from "../../../lib/audio/musicAnalysis";
import { scaleNotes } from "../../../lib/theory/scales";
import { chordNotes } from "../../../lib/theory/chords";

export function useMTrainer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setAnalyzing(true);
    setError(null);
    try {
      const r = await analyzeAudioFile(file);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze this file — try a shorter clip or a different format.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  const practiceScale = result ? scaleNotes(result.key.split(" ")[0], result.scale === "major" ? "major" : "natural_minor") : [];
  const practiceChord = result ? chordNotes(result.key.split(" ")[0], result.scale === "major" ? "maj" : "min") : [];

  return { analyzing, result, error, analyze, reset, practiceScale, practiceChord };
}
