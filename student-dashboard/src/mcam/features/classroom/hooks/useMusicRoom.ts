/**
 * useMusicRoom — orchestrates a live music lesson.
 *
 * 1. asks the control plane to mint a role-scoped media token + publish policy
 * 2. connects to the LiveKit media plane
 * 3. publishes the INSTRUMENT track through MusicAudioEngine (DSP off, HiFi Opus)
 *    and, separately, a normal TALK track (AEC/NS on)
 * 4. surfaces live network health for the Staff bar
 *
 * The two-track split is deliberate: the violin ships raw; "okay, try bar 12"
 * ships speech-processed. That is the whole product in one hook.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  ConnectionQuality,
  type ConnectionState,
} from "livekit-client";
import { MusicAudioEngine, type AudioMode } from "../../audio/musicAudioEngine";

type Role = "teacher" | "student" | "parent" | "observer";

interface JoinResponse {
  livekit_url: string;
  token: string;
  role: Role;
  audio_mode: AudioMode;
  publish_policy: {
    getUserMedia: MediaTrackConstraints;
    opus: { dtx: boolean; red: boolean; stereo: boolean; maxBitrate: number };
  };
}

interface Health {
  quality: ConnectionQuality;
  rttMs: number;
  lossPct: number;
}

interface UseMusicRoom {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  state: ConnectionState | "idle";
  muted: boolean;
  health: Health;
  pitch: { note: string; cents: number } | null;
  /** The live LiveKit Room instance once connected — e.g. so the toolkit
   *  (Virtual Light) can attach a TrackProcessor to the published camera
   *  track. `roomRef` (not a plain value) since it mutates outside React's
   *  render cycle; read `.current` at the point of use. */
  roomRef: RefObject<Room | null>;
}

export function useMusicRoom(opts: {
  apiBase: string;
  accessToken: string;
  sessionId: string;
  role: Role;
  audioMode?: AudioMode;
}): UseMusicRoom {
  const { apiBase, accessToken, sessionId, role, audioMode = "music_hifi" } = opts;
  const roomRef = useRef<Room | null>(null);
  const engineRef = useRef<MusicAudioEngine | null>(null);

  const [state, setState] = useState<ConnectionState | "idle">("idle");
  const [muted, setMuted] = useState(false);
  const [health, setHealth] = useState<Health>({
    quality: ConnectionQuality.Unknown,
    rttMs: 0,
    lossPct: 0,
  });
  const [pitch, setPitch] = useState<{ note: string; cents: number } | null>(null);

  const connect = useCallback(async () => {
    // 1. control plane: mint token + get the publish policy for this mode
    const res = await fetch(`${apiBase}/v1/media/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ session_id: sessionId, role, audio_mode: audioMode }),
    });
    if (!res.ok) throw new Error(`join failed: ${res.status}`);
    const join: JoinResponse = await res.json();

    // 2. media plane
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      // Music mode: protect audio continuity over video resolution (see Network Engine).
      publishDefaults: {
        audioPreset: { maxBitrate: join.publish_policy.opus.maxBitrate },
        dtx: join.publish_policy.opus.dtx,
        red: join.publish_policy.opus.red,
        forceStereo: join.publish_policy.opus.stereo,
      },
    });
    roomRef.current = room;

    room
      .on(RoomEvent.ConnectionStateChanged, (s) => setState(s))
      .on(RoomEvent.ConnectionQualityChanged, (q, p) => {
        if (p?.isLocal) setHealth((h) => ({ ...h, quality: q }));
      });

    await room.connect(join.livekit_url, join.token);

    // 3. publish tracks — only teacher/student may (policy enforced server-side too)
    if (role === "teacher" || role === "student") {
      // INSTRUMENT track: raw capture through the engine, DSP off, HiFi.
      const engine = new MusicAudioEngine();
      engineRef.current = engine;
      const instrumentTrack = await engine.start(audioMode);
      // PRODUCTION FIX (integration audit): livekit-client renamed
      // TrackPublishOptions#stereo -> #forceStereo (the file's own
      // `publishDefaults` below already used the current name — this call
      // site was the one place still on the old one, a real type error under
      // actual `tsc`).
      await room.localParticipant.publishTrack(
        new LocalAudioTrack(instrumentTrack),
        { name: "instrument", source: Track.Source.Microphone, dtx: false, red: true, forceStereo: true },
      );

      // TALK track: normal speech processing, so spoken instructions stay clear.
      const talk = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      await room.localParticipant.publishTrack(
        new LocalAudioTrack(talk.getAudioTracks()[0]),
        { name: "talk", source: Track.Source.Microphone },
      );
    }
  }, [apiBase, accessToken, sessionId, role, audioMode]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  const disconnect = useCallback(() => {
    engineRef.current?.stop();
    roomRef.current?.disconnect();
    engineRef.current = null;
    roomRef.current = null;
    setState("idle");
  }, []);

  // 4. poll health (RTT/loss) and tuner pitch for the Staff bar
  useEffect(() => {
    const id = window.setInterval(async () => {
      const room = roomRef.current;
      if (room?.engine?.pcManager) {
        const stats = await room.engine.pcManager.subscriber?.getStats?.();
        stats?.forEach((r: any) => {
          if (r.type === "candidate-pair" && r.nominated) {
            setHealth((h) => ({ ...h, rttMs: Math.round((r.currentRoundTripTime ?? 0) * 1000) }));
          }
        });
      }
      const p = engineRef.current?.detectPitch();
      setPitch(p ? { note: p.note, cents: p.cents } : null);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return { connect, disconnect, toggleMute, state, muted, health, pitch, roomRef };
}
