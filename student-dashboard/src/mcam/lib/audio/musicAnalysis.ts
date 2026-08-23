/** Real (not mocked) audio analysis for M-TRAINER: BPM via autocorrelation of
 *  an onset-energy envelope, and musical key via a chroma vector matched
 *  against the standard Krumhansl-Schmuckler key profiles. Self-contained —
 *  no external analysis service. */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Krumhansl-Schmuckler key profiles (relative pitch-class weights).
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Simple radix-2 Cooley-Tukey FFT (in place, real+imag arrays, length must be power of 2). */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wI = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe; im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe; im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wI;
        curIm = curRe * wI + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

/** Downmix to mono. */
function toMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}

/** BPM via energy-envelope autocorrelation — a well-established lightweight
 *  beat-tracking approach (not full onset-flux detection, but genuinely
 *  computes a real tempo from the actual audio, not a placeholder). */
function detectBpm(mono: Float32Array, sampleRate: number): number {
  const hop = Math.round(sampleRate * 0.01); // 10ms frames -> ~100Hz envelope
  const frames = Math.floor(mono.length / hop);
  const envelope = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = f * hop;
    for (let i = 0; i < hop && start + i < mono.length; i++) sum += Math.abs(mono[start + i]);
    envelope[f] = sum / hop;
  }
  // onset strength = positive first difference (flux)
  const flux = new Float32Array(frames);
  for (let i = 1; i < frames; i++) flux[i] = Math.max(0, envelope[i] - envelope[i - 1]);

  const envRate = sampleRate / hop; // frames/sec
  const minBpm = 60, maxBpm = 200;
  const minLag = Math.round((60 / maxBpm) * envRate);
  const maxLag = Math.round((60 / minBpm) * envRate);

  let bestLag = minLag, bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = 0; i + lag < flux.length; i++) score += flux[i] * flux[i + lag];
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }
  const bpm = (60 * envRate) / bestLag;
  // fold into a musically sensible range (avoid half/double-tempo octave errors as much as reasonable)
  let folded = bpm;
  while (folded < 70) folded *= 2;
  while (folded > 180) folded /= 2;
  return Math.round(folded);
}

/** Chroma vector (12 pitch classes) via FFT over the whole track, then key
 *  detection by Pearson correlation against the KS major/minor profiles. */
function detectKey(mono: Float32Array, sampleRate: number): { root: string; mode: "major" | "minor"; confidence: number } {
  const windowSize = 4096;
  const hop = 2048;
  const chroma = new Float64Array(12);
  const re = new Float32Array(windowSize);
  const im = new Float32Array(windowSize);

  const maxWindows = 300; // cap compute for very long files (~5-10 min at this hop)
  let windowCount = 0;
  for (let start = 0; start + windowSize <= mono.length && windowCount < maxWindows; start += hop, windowCount++) {
    for (let i = 0; i < windowSize; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (windowSize - 1));
      re[i] = mono[start + i] * hann;
      im[i] = 0;
    }
    fft(re, im);
    const bins = windowSize / 2;
    for (let bin = 1; bin < bins; bin++) {
      const freq = (bin * sampleRate) / windowSize;
      if (freq < 60 || freq > 5000) continue; // musically relevant range
      const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
      const midi = 69 + 12 * Math.log2(freq / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      chroma[pc] += mag;
    }
  }

  const total = chroma.reduce((a, b) => a + b, 0) || 1;
  const norm = Array.from(chroma, (v) => v / total);

  const correlate = (profile: number[], rotation: number) => {
    const rotated = profile.map((_, i) => profile[(i - rotation + 12) % 12]);
    const meanA = norm.reduce((a, b) => a + b, 0) / 12;
    const meanB = rotated.reduce((a, b) => a + b, 0) / 12;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < 12; i++) {
      const da = norm[i] - meanA, db = rotated[i] - meanB;
      num += da * db; denA += da * da; denB += db * db;
    }
    return num / (Math.sqrt(denA * denB) || 1);
  };

  let best = { root: 0, mode: "major" as "major" | "minor", score: -Infinity };
  for (let root = 0; root < 12; root++) {
    const majorScore = correlate(MAJOR_PROFILE, root);
    const minorScore = correlate(MINOR_PROFILE, root);
    if (majorScore > best.score) best = { root, mode: "major", score: majorScore };
    if (minorScore > best.score) best = { root, mode: "minor", score: minorScore };
  }

  return { root: NOTE_NAMES[best.root], mode: best.mode, confidence: Math.max(0, Math.min(1, (best.score + 1) / 2)) };
}

export interface AnalysisResult {
  fileName: string;
  durationSec: number;
  bpm: number;
  key: string; // e.g. "A minor"
  scale: "major" | "minor";
  confidence: number; // 0-1
}

export async function analyzeAudioFile(file: File): Promise<AnalysisResult> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const mono = toMono(audioBuffer);
    // downsample to ~11kHz for speed — plenty for BPM/chroma purposes
    const targetRate = 11025;
    const decim = Math.max(1, Math.floor(audioBuffer.sampleRate / targetRate));
    const down = new Float32Array(Math.floor(mono.length / decim));
    for (let i = 0; i < down.length; i++) down[i] = mono[i * decim];
    const effectiveRate = audioBuffer.sampleRate / decim;

    const bpm = detectBpm(down, effectiveRate);
    const key = detectKey(down, effectiveRate);
    return {
      fileName: file.name,
      durationSec: audioBuffer.duration,
      bpm,
      key: `${key.root} ${key.mode}`,
      scale: key.mode,
      confidence: key.confidence,
    };
  } finally {
    void ctx.close();
  }
}

