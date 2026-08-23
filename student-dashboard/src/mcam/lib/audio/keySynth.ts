/** Shared fast-attack, exponentially-decaying two-oscillator "mallet/EP" voice
 *  used by the Virtual Keyboard and M-FALL note highway — one voice, not a
 *  copy per tool, so they sound and feel identical. */
export function playKeyNote(ctx: AudioContext, midi: number, velocity = 0.7, duration = 1.1): void {
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(velocity, ctx.currentTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration);
  gain.connect(ctx.destination);

  const fundamental = ctx.createOscillator();
  fundamental.type = "triangle";
  fundamental.frequency.value = freq;
  const partial = ctx.createOscillator();
  partial.type = "sine";
  partial.frequency.value = freq * 2.01;
  const partialGain = ctx.createGain();
  partialGain.gain.value = 0.18;

  fundamental.connect(gain);
  partial.connect(partialGain).connect(gain);
  fundamental.start(); partial.start();
  fundamental.stop(ctx.currentTime + duration + 0.05);
  partial.stop(ctx.currentTime + duration + 0.05);
}
