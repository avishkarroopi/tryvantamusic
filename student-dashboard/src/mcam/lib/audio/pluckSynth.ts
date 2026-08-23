/** Karplus-Strong plucked-string synthesis. Renders a decaying string pluck
 *  into an AudioBuffer (noise burst through a feedback delay-line + lowpass),
 *  which sounds convincingly like a real plucked string — a deliberate upgrade
 *  over a plain oscillator for the guitar/keyboard tools. */
export function renderPluck(ctx: BaseAudioContext, freq: number, seconds = 1.6, damping = 0.994): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const out = buffer.getChannelData(0);

  const period = Math.max(2, Math.round(sampleRate / freq));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1; // noise burst = the "pluck"

  let idx = 0;
  let prev = 0;
  for (let i = 0; i < length; i++) {
    const cur = ring[idx];
    // simple one-pole lowpass average (Karplus-Strong classic) for natural decay
    const next = damping * 0.5 * (cur + prev);
    ring[idx] = next;
    prev = cur;
    out[i] = cur;
    idx = (idx + 1) % period;
  }
  return buffer;
}

export function playPluck(ctx: AudioContext, freq: number, opts?: { gain?: number; destination?: AudioNode; seconds?: number }): void {
  const buffer = renderPluck(ctx, freq, opts?.seconds ?? 1.6);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = opts?.gain ?? 0.55;
  src.connect(gain).connect(opts?.destination ?? ctx.destination);
  src.start();
}
