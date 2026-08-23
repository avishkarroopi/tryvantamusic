/**
 * useMedia — video, screen share and device switching for the classroom.
 *
 * Complements Phase 1's useMusicRoom (which owns the HiFi *audio* pipeline).
 * This hook takes the same LiveKit Room and handles the video side:
 * camera on/off, camera/mic device switching, speaker (sink) selection, and
 * screen sharing (entire screen / window / tab, with a presenter indicator).
 */
import { useCallback, useState } from "react";
import {
  Room, Track, LocalVideoTrack, createLocalScreenTracks, VideoPresets,
} from "livekit-client";

interface Devices { cameraId?: string; micId?: string; speakerId?: string; }

export function useMedia(room: Room | null) {
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  const toggleCam = useCallback(async () => {
    if (!room) return;
    const next = !camOn;
    await room.localParticipant.setCameraEnabled(next, {
      resolution: VideoPresets.h720.resolution, // HD; adaptiveStream steps it down under load
    });
    setCamOn(next);
  }, [room, camOn]);

  const switchCamera = useCallback(async (deviceId: string) => {
    if (!room) return;
    await room.switchActiveDevice("videoinput", deviceId);
  }, [room]);

  const switchMic = useCallback(async (deviceId: string) => {
    if (!room) return;
    await room.switchActiveDevice("audioinput", deviceId);
  }, [room]);

  const switchSpeaker = useCallback(async (deviceId: string) => {
    if (!room) return;
    await room.switchActiveDevice("audiooutput", deviceId); // setSinkId under the hood
  }, [room]);

  const applyDevices = useCallback(async (d: Devices) => {
    if (d.cameraId) await switchCamera(d.cameraId);
    if (d.micId) await switchMic(d.micId);
    if (d.speakerId) await switchSpeaker(d.speakerId);
  }, [switchCamera, switchMic, switchSpeaker]);

  const startShare = useCallback(async () => {
    if (!room) return;
    // The browser picker offers entire screen / window / browser tab.
    const tracks = await createLocalScreenTracks({ audio: true, resolution: VideoPresets.h1080.resolution });
    for (const t of tracks) {
      await room.localParticipant.publishTrack(t, { source: Track.Source.ScreenShare });
    }
    setSharing(true);
  }, [room]);

  const stopShare = useCallback(async () => {
    if (!room) return;
    room.localParticipant.getTrackPublications().forEach((pub) => {
      if (pub.source === Track.Source.ScreenShare && pub.track) {
        room.localParticipant.unpublishTrack(pub.track as LocalVideoTrack);
      }
    });
    setSharing(false);
  }, [room]);

  const toggleShare = useCallback(() => (sharing ? stopShare() : startShare()), [sharing, startShare, stopShare]);

  return { camOn, sharing, toggleCam, toggleShare, applyDevices, switchCamera, switchMic, switchSpeaker };
}
