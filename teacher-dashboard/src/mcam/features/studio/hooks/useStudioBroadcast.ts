/**
 * The actual "Studio is an in-house OBS for the classroom" piece: composites
 * the active scene's sources (position, crop, filters, zoom/rotate/mirror —
 * everything CameraWindow already renders in the DOM editor) onto a real
 * <canvas> every frame, and publishes THAT canvas as the outgoing LiveKit
 * camera track — replacing (via replaceTrack, not unpublish+republish, so
 * there's no renegotiation flicker) whatever raw camera was there. Every
 * other participant's classroom view (VideoGrid/useRoomVideoTracks) needs
 * zero changes to pick this up: it's still "the" camera publication, just
 * fed by composited frames instead of a single raw camera from here on.
 *
 * Deliberately does NOT touch blur/green-screen — CameraControls already
 * flags those as needing a segmentation model that isn't wired in yet
 * (matches the DOM editor's existing, pre-existing limitation; not a
 * regression introduced here).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Track, type LocalVideoTrack, type Room } from "livekit-client";
import type { Scene, Source } from "../model";
import { filterString } from "../lib/cameraFilters";

const CANVAS_W = 1280;
const CANVAS_H = 720;

function drawSource(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, src: Source) {
  if (video.readyState < video.HAVE_CURRENT_DATA) return;
  const dx = src.rect.x * CANVAS_W;
  const dy = src.rect.y * CANVAS_H;
  const dw = src.rect.w * CANVAS_W;
  const dh = src.rect.h * CANVAS_H;
  const s = src.settings;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip(); // matches the DOM editor's overflow:hidden per-window

  ctx.filter = filterString(s); // same CSS filter string the DOM editor uses — canvas 2D accepts it directly

  const cx = dx + dw / 2;
  const cy = dy + dh / 2;
  ctx.translate(cx, cy);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.scale((s.mirror ? -1 : 1) * s.zoom, (s.flip ? -1 : 1) * s.zoom);
  ctx.translate(-cx, -cy);

  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  let sx = 0, sy = 0, sw = vw, sh = vh;
  if (s.crop) {
    sx = s.crop.x * vw;
    sy = s.crop.y * vh;
    sw = s.crop.w * vw;
    sh = s.crop.h * vh;
  }
  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

export function useStudioBroadcast(room: Room | null) {
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const hadExistingCameraRef = useRef(false);
  const stoppedRef = useRef(true);

  /** Feed the render loop the latest scene/streams without restarting it —
   *  call this from a plain effect whenever either changes. */
  const update = useCallback((scene: Scene | null, streams: Map<string, MediaStream>) => {
    sceneRef.current = scene;
    streamsRef.current = streams;
  }, []);

  const ensureVideoEl = (deviceId: string, stream: MediaStream): HTMLVideoElement => {
    let el = videoElsRef.current.get(deviceId);
    if (!el) {
      el = document.createElement("video");
      el.muted = true;
      el.playsInline = true;
      videoElsRef.current.set(deviceId, el);
    }
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      void el.play().catch(() => {});
    }
    return el;
  };

  const renderLoop = useCallback(() => {
    if (stoppedRef.current) return;
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.filter = "none";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (scene) {
        const sources = [...scene.config.sources].filter((s) => s.visible).sort((a, b) => a.z - b.z);
        for (const src of sources) {
          const stream = src.deviceId ? streamsRef.current.get(src.deviceId) : undefined;
          if (!stream) continue;
          drawSource(ctx, ensureVideoEl(src.deviceId!, stream), src);
        }
      }
    }
    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!room) {
      setError("Not connected yet — connect audio/video first.");
      return;
    }
    try {
      if (!canvasRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        canvasRef.current = canvas;
      }
      stoppedRef.current = false;
      renderLoop();

      const canvasTrack = (
        canvasRef.current as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }
      ).captureStream(30).getVideoTracks()[0];

      const existingPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (existingPub?.videoTrack) {
        hadExistingCameraRef.current = true;
        await (existingPub.videoTrack as LocalVideoTrack).replaceTrack(canvasTrack);
      } else {
        hadExistingCameraRef.current = false;
        await room.localParticipant.publishTrack(canvasTrack, { source: Track.Source.Camera, name: "studio" });
      }
      setLive(true);
    } catch (err) {
      stoppedRef.current = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setError(err instanceof Error ? err.message : "Could not start the Studio broadcast.");
    }
  }, [room, renderLoop]);

  const stop = useCallback(async () => {
    stoppedRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (room) {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub?.videoTrack) {
        try {
          if (hadExistingCameraRef.current) {
            const fresh = await navigator.mediaDevices.getUserMedia({ video: true });
            await (pub.videoTrack as LocalVideoTrack).replaceTrack(fresh.getVideoTracks()[0]);
          } else {
            await room.localParticipant.unpublishTrack(pub.videoTrack as LocalVideoTrack);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not cleanly stop the Studio broadcast.");
        }
      }
    }
    setLive(false);
  }, [room]);

  useEffect(
    () => () => {
      stoppedRef.current = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { live, error, start, stop, update };
}
