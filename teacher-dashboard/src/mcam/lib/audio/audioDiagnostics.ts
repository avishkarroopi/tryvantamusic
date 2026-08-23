/**
 * Real audio measurement — no fakes. Reads an AnalyserNode's time-domain data
 * to compute peak/RMS/noise-floor in dBFS, clipping % and silence, and pulls
 * packet-loss / RTT from the track's WebRTC stats. Feeds the scoring engine.
 */
export interface AudioMetrics {
  peak_dbfs: number;
  rms_dbfs: number;
  noise_floor_dbfs: number;
  clipping_pct: number;
  loss_pct: number;
  rtt_ms: number;
  noise_suppression_on: boolean;
  using_headphones: boolean;
  instrument: string;
  is_music_profile: boolean;
}

const MIN_DB = -100;
const toDbfs = (amp: number) => (amp <= 0 ? MIN_DB : Math.max(MIN_DB, 20 * Math.log10(amp)));

export class AudioAnalyzer {
  private buf: Float32Array<ArrayBuffer>;
  private noiseFloor = -60; // dBFS, tracked as a slow rolling minimum

  constructor(private analyser: AnalyserNode) {
    this.buf = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
  }

  /** One measurement frame from the time-domain signal. */
  sample(): { peak_dbfs: number; rms_dbfs: number; noise_floor_dbfs: number; clipping_pct: number } {
    this.analyser.getFloatTimeDomainData(this.buf);
    let peak = 0, sumSq = 0, clipped = 0;
    for (let i = 0; i < this.buf.length; i++) {
      const s = Math.abs(this.buf[i]);
      if (s > peak) peak = s;
      sumSq += this.buf[i] * this.buf[i];
      if (s >= 0.98) clipped++;
    }
    const rms = Math.sqrt(sumSq / this.buf.length);
    const rms_dbfs = toDbfs(rms);

    // Noise floor: ease down toward quiet RMS, rise slowly so it tracks the room.
    if (rms_dbfs < this.noiseFloor) this.noiseFloor = this.noiseFloor * 0.9 + rms_dbfs * 0.1;
    else this.noiseFloor = this.noiseFloor * 0.999 + rms_dbfs * 0.001;

    return {
      peak_dbfs: +toDbfs(peak).toFixed(1),
      rms_dbfs: +rms_dbfs.toFixed(1),
      noise_floor_dbfs: +this.noiseFloor.toFixed(1),
      clipping_pct: +((clipped / this.buf.length) * 100).toFixed(2),
    };
  }
}

/** Pull loss % and RTT from a track's RTCStatsReport (best-effort, defensive). */
export async function readNetworkStats(
  getStats?: () => Promise<RTCStatsReport | undefined>,
): Promise<{ loss_pct: number; rtt_ms: number }> {
  try {
    const report = getStats ? await getStats() : undefined;
    if (!report) return { loss_pct: 0, rtt_ms: 0 };
    let lost = 0, recv = 0, rtt = 0;
    report.forEach((s: any) => {
      if (s.type === "inbound-rtp" && s.kind === "audio") {
        lost += s.packetsLost ?? 0;
        recv += s.packetsReceived ?? 0;
      }
      if (s.type === "remote-inbound-rtp" && typeof s.roundTripTime === "number") {
        rtt = s.roundTripTime * 1000;
      }
    });
    const total = lost + recv;
    return { loss_pct: total ? +((lost / total) * 100).toFixed(2) : 0, rtt_ms: Math.round(rtt) };
  } catch {
    return { loss_pct: 0, rtt_ms: 0 };
  }
}

/** Headphone heuristic: no echo-cancellation needed => speakers likely off, or
 *  the output device is a headset. We expose the flag; the UI lets the user
 *  confirm. Browsers don't reliably report headset presence, so this is a hint. */
export function detectHeadphones(outputLabel?: string): boolean {
  if (!outputLabel) return false;
  return /head(phone|set)|earbud|airpod|buds/i.test(outputLabel);
}
