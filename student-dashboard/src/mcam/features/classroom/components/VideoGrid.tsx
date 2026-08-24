/**
 * Renders whatever video tracks useRoomVideoTracks finds — a responsive
 * grid for however many participants have their camera/screen-share on.
 * Attaches LiveKit tracks to real <video> elements via track.attach(),
 * which is the actual step that was missing (permissions + publishing
 * were already working; nothing was ever rendering the result).
 */
import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { color, font } from "../../../design-system/tokens";
import type { VideoTileInfo } from "../hooks/useRoomVideoTracks";

export function VideoGrid({ tiles }: { tiles: VideoTileInfo[] }) {
  if (tiles.length === 0) return null;

  const cols = tiles.length <= 1 ? 1 : tiles.length <= 4 ? 2 : 3;

  return (
    <div
      style={{
        position: "absolute", inset: 0, display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, padding: 8,
      }}
    >
      {tiles.map((tile) => (
        <VideoTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function VideoTile({ tile }: { tile: VideoTileInfo }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    tile.track.attach(el);
    return () => {
      tile.track.detach(el);
    };
  }, [tile.track]);

  const isScreenShare = tile.source === Track.Source.ScreenShare;

  return (
    <div
      style={{
        position: "relative", borderRadius: 12, overflow: "hidden",
        background: "#000", border: `1px solid ${color.hairline}`,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={tile.isLocal}
        style={{
          width: "100%", height: "100%", objectFit: isScreenShare ? "contain" : "cover",
          // Mirror your own camera (standard self-view convention) — never
          // mirror a screen share, that would make text unreadable.
          transform: tile.isLocal && !isScreenShare ? "scaleX(-1)" : "none",
        }}
      />
      <div
        style={{
          position: "absolute", left: 8, bottom: 8, fontFamily: font.body, fontSize: 12,
          color: color.score, background: "rgba(14,17,22,0.7)", padding: "3px 9px", borderRadius: 999,
        }}
      >
        {tile.name}{isScreenShare ? " · sharing screen" : ""}
      </div>
    </div>
  );
}
