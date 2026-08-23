/**
 * Network optimization for a music room. Audio is sacred: video degrades first,
 * audio holds. Uses LiveKit's adaptive stream + dynacast, red (audio FEC) for
 * packet-loss recovery, and a reconnect policy for network recovery.
 */
import type { RoomOptions, RoomConnectOptions } from "livekit-client";
import { VideoPresets } from "livekit-client";

export function musicRoomOptions(): RoomOptions {
  return {
    adaptiveStream: true,           // subscriber downsizes video it can't afford
    dynacast: true,                 // publisher pauses layers nobody watches
    publishDefaults: {
      red: true,                    // audio forward-error-correction: loss recovery
      dtx: false,                   // never gate a sustained note
      audioPreset: { maxBitrate: 256_000 },
      videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
      // Video yields to audio under pressure; framerate protected for hands/bowing.
      degradationPreference: "maintain-framerate",
    },
    stopLocalTrackOnUnpublish: true,
  };
}

export function connectOptions(): RoomConnectOptions {
  return {
    autoSubscribe: true,
    // Aggressive-ish reconnect so a blip doesn't end a lesson.
    maxRetries: 10,
    peerConnectionTimeout: 15_000,
  };
}

/** Prioritize audio explicitly when the connection is poor. */
export const AUDIO_PRIORITY = { audio: "high", video: "low" } as const;
