/** Autocorrelation pitch detection for the tuner (self-contained). */
export function detectPitchHz(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / SIZE) < 0.008) return -1; // too quiet

  let bestOffset = -1, bestCorr = 0, lastCorr = 1;
  for (let offset = 8; offset < SIZE / 2; offset++) {
    let corr = 0;
    for (let i = 0; i < SIZE / 2; i++) corr += buf[i] * buf[i + offset];
    corr /= SIZE / 2;
    if (corr > 0.9 && corr > lastCorr && corr > bestCorr) { bestCorr = corr; bestOffset = offset; }
    lastCorr = corr;
  }
  return bestOffset > 0 ? sampleRate / bestOffset : -1;
}
