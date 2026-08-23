/**
 * M-CAM V5 — Music Audio Engine.
 *
 * The single subsystem that makes M-CAM not a Zoom clone. It captures the
 * instrument track with all speech DSP DISABLED, builds a musician-controlled
 * Web Audio graph (HP filter -> optional EQ -> peak-safety limiter -> analyser),
 * and provides a tuner (autocorrelation pitch detection) and a sample-accurate
 * metronome (look-ahead scheduler). No dependency on the conferencing SDK — it
 * hands a processed MediaStreamTrack to whatever publishes it.
 */

export type AudioMode = "music_hifi" | "balanced" | "talk";

const MUSIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 2,
  sampleRate: 48_000,
};

const TALK_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48_000,
};

export function constraintsFor(mode: AudioMode): MediaTrackConstraints {
  if (mode === "talk") return TALK_CONSTRAINTS;
  if (mode === "balanced") return { ...MUSIC_CONSTRAINTS, echoCancellation: true };
  return MUSIC_CONSTRAINTS;
}

export interface EqBand {
  frequency: number;
  gainDb: number;
  q: number;
  type: BiquadFilterType;
}

export class MusicAudioEngine {
  readonly ctx: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private highpass: BiquadFilterNode;
  private eqBands: BiquadFilterNode[] = [];
  private limiter: DynamicsCompressorNode;
  private analyser: AnalyserNode;
  private destination: MediaStreamAudioDestinationNode;
  private raw?: MediaStream;

  constructor() {
    // 48 kHz, minimal buffering. `interactive` biases the graph toward low latency.
    this.ctx = new AudioContext({ sampleRate: 48_000, latencyHint: "interactive" });

    this.highpass = new BiquadFilterNode(this.ctx, {
      type: "highpass",
      frequency: 30, // remove sub-audible rumble only; keep the instrument intact
    });

    // Peak-safety limiter — NOT a compressor squashing dynamics. High threshold,
    // fast release, ratio only engages near clipping so pp..ff survives.
    this.limiter = new DynamicsCompressorNode(this.ctx, {
      threshold: -1.5,
      knee: 0,
      ratio: 20,
      attack: 0.002,
      release: 0.05,
    });

    this.analyser = new AnalyserNode(this.ctx, { fftSize: 2048, smoothingTimeConstant: 0.2 });
    this.destination = new MediaStreamAudioDestinationNode(this.ctx);
  }

  /** Capture the instrument with speech DSP off and wire the graph. */
  async start(mode: AudioMode = "music_hifi", deviceId?: string): Promise<MediaStreamTrack> {
    const audio: MediaTrackConstraints = { ...constraintsFor(mode) };
    if (deviceId) audio.deviceId = { exact: deviceId };
    this.raw = await navigator.mediaDevices.getUserMedia({ audio });

    this.source = this.ctx.createMediaStreamSource(this.raw);
    this.rebuildGraph();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    return this.destination.stream.getAudioTracks()[0];
  }

  /** Rebuild source -> HP -> [EQ...] -> limiter -> analyser -> destination. */
  private rebuildGraph(): void {
    if (!this.source) return;
    this.source.disconnect();
    this.highpass.disconnect();
    this.eqBands.forEach((b) => b.disconnect());
    this.limiter.disconnect();
    this.analyser.disconnect();

    let node: AudioNode = this.source;
    node.connect(this.highpass);
    node = this.highpass;
    for (const band of this.eqBands) {
      node.connect(band);
      node = band;
    }
    node.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.destination);
  }

  /** Replace the parametric EQ (4-band typical). Empty array = flat/bypass. */
  setEq(bands: EqBand[]): void {
    this.eqBands = bands.map(
      (b) => new BiquadFilterNode(this.ctx, {
        type: b.type, frequency: b.frequency, gain: b.gainDb, Q: b.q,
      }),
    );
    this.rebuildGraph();
  }

  /** Instantaneous peak level in dBFS for VU meters / the Staff bar. */
  peakDb(): number {
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let peak = 0;
    for (const s of buf) peak = Math.max(peak, Math.abs(s));
    return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  }

  /** Detected pitch via autocorrelation. Returns null when no clear pitch. */
  detectPitch(): { hz: number; note: string; cents: number } | null {
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    const hz = autoCorrelate(buf, this.ctx.sampleRate);
    if (hz <= 0) return null;
    return { hz, ...noteFromHz(hz) };
  }

  stop(): void {
    this.raw?.getTracks().forEach((t) => t.stop());
    void this.ctx.close();
  }
}

/* ── Tuner: autocorrelation pitch detection ─────────────────────────────── */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet to be a note

  let bestOffset = -1;
  let bestCorr = 0;
  let lastCorr = 1;
  for (let offset = 8; offset < SIZE / 2; offset++) {
    let corr = 0;
    for (let i = 0; i < SIZE / 2; i++) corr += buf[i] * buf[i + offset];
    corr /= SIZE / 2;
    if (corr > 0.9 && corr > lastCorr && corr > bestCorr) {
      bestCorr = corr;
      bestOffset = offset;
    }
    lastCorr = corr;
  }
  return bestOffset > 0 ? sampleRate / bestOffset : -1;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteFromHz(hz: number): { note: string; cents: number } {
  const midi = 69 + 12 * Math.log2(hz / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { note: `${name}${octave}`, cents };
}

/* ── Metronome: sample-accurate look-ahead scheduler ────────────────────── */
export class Metronome {
  private nextTick = 0;
  private beat = 0;
  private timer?: number;
  private readonly lookahead = 0.1; // s of audio scheduled ahead of the clock
  private readonly interval = 25; // ms between scheduler wakeups

  constructor(
    private ctx: AudioContext,
    public bpm = 90,
    public beatsPerBar = 4,
  ) {}

  /** startAt lets teacher & student share a downbeat (network-synced count-in). */
  start(startAt?: number): void {
    this.beat = 0;
    this.nextTick = startAt ?? this.ctx.currentTime + 0.1;
    const tick = () => {
      while (this.nextTick < this.ctx.currentTime + this.lookahead) {
        this.click(this.nextTick, this.beat % this.beatsPerBar === 0);
        this.nextTick += 60 / this.bpm;
        this.beat++;
      }
      this.timer = window.setTimeout(tick, this.interval);
    };
    tick();
  }

  private click(time: number, accent: boolean): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000; // downbeat rings higher
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  }

  stop(): void {
    if (this.timer) window.clearTimeout(this.timer);
  }
}
