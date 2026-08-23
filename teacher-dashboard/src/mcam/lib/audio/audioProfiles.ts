/** Instrument profile access for the client. The authoritative DSP settings
 *  live server-side (/v1/audio/profiles/{instrument}); this fetches + caches
 *  them and carries UI metadata (labels/order). No DSP values are duplicated. */
export interface InstrumentProfile {
  instrument: string;
  base_mode: "music_hifi" | "balanced" | "talk";
  getUserMedia: MediaTrackConstraints;
  opus: Record<string, unknown>;
  highpass_hz: number;
  eq_hint: string;
  guidance: string;
  headphones_required: boolean;
}

export const INSTRUMENTS: { id: string; label: string }[] = [
  { id: "piano", label: "Piano" },
  { id: "guitar", label: "Guitar" },
  { id: "violin", label: "Violin" },
  { id: "cello", label: "Cello" },
  { id: "drums", label: "Drums" },
  { id: "vocals", label: "Vocals" },
  { id: "flute", label: "Flute" },
  { id: "theory", label: "Theory / Talk" },
];

const cache = new Map<string, InstrumentProfile>();

export async function fetchProfile(
  apiBase: string, token: string, instrument: string,
): Promise<InstrumentProfile> {
  if (cache.has(instrument)) return cache.get(instrument)!;
  const res = await fetch(`${apiBase}/v1/audio/profiles/${instrument}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load instrument profile");
  const profile = (await res.json()) as InstrumentProfile;
  cache.set(instrument, profile);
  return profile;
}
