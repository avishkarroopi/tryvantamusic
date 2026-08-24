/**
 * Reactively tracks every published video track (your own camera/screen-
 * share, plus every other participant's) in a LiveKit room, so the
 * classroom UI has something to actually attach `<video>` elements to.
 *
 * This was the missing piece behind "camera/mic permissions are granted,
 * webcam LED is on, but the classroom just shows a status message" — the
 * camera toggle (useMedia) correctly publishes the track to LiveKit, but
 * nothing was reactively listening for tracks and rendering them. This
 * hook is that listener; VideoTile (sibling component) is the renderer.
 */
import { useEffect, useState } from "react";
import {
  Room, RoomEvent, Track,
  type LocalVideoTrack, type RemoteVideoTrack,
} from "livekit-client";

export interface VideoTileInfo {
  id: string;
  identity: string;
  name: string;
  track: LocalVideoTrack | RemoteVideoTrack;
  isLocal: boolean;
  source: Track.Source;
}

export function useRoomVideoTracks(room: Room | null): VideoTileInfo[] {
  const [tiles, setTiles] = useState<VideoTileInfo[]>([]);

  useEffect(() => {
    if (!room) {
      setTiles([]);
      return;
    }

    const rebuild = () => {
      const next: VideoTileInfo[] = [];

      room.localParticipant.videoTrackPublications.forEach((pub) => {
        if (pub.track) {
          next.push({
            id: `local-${pub.trackSid}`,
            identity: room.localParticipant.identity,
            name: "You",
            track: pub.track as LocalVideoTrack,
            isLocal: true,
            source: pub.source,
          });
        }
      });

      room.remoteParticipants.forEach((participant) => {
        participant.videoTrackPublications.forEach((pub) => {
          if (pub.track && pub.isSubscribed) {
            next.push({
              id: `${participant.identity}-${pub.trackSid}`,
              identity: participant.identity,
              name: participant.name || participant.identity,
              track: pub.track as RemoteVideoTrack,
              isLocal: false,
              source: pub.source,
            });
          }
        });
      });

      setTiles(next);
    };

    rebuild();
    const events = [
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
    ] as const;
    events.forEach((e) => room.on(e, rebuild));
    return () => {
      events.forEach((e) => room.off(e, rebuild));
    };
  }, [room]);

  return tiles;
}
