/**
 * Virtual Light control panel — click/drag on the preview to place the
 * glow, tune its size/warmth/intensity, and (when a camera track is
 * actively published to the room) broadcast it live to the class via
 * LiveKit's TrackProcessor pipeline.
 *
 * Two modes, same visual result:
 *  - No live camera track yet (not connected, or camera off): a standalone
 *    local preview using its own getUserMedia capture, so the tool is fully
 *    usable/testable without needing to already be live in a session.
 *  - A camera track IS actively published: the SAME processor is attached
 *    to that real track via `.setProcessor()`, so what's shown here in the
 *    preview is exactly what the rest of the class sees.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Sun } from "lucide-react";
import type { Room } from "livekit-client";
import { color, font } from "../../../design-system/tokens";
import {
  VirtualLightProcessor,
  DEFAULT_VIRTUAL_LIGHT_OPTIONS,
  type VirtualLightOptions,
} from "../video/virtualLightProcessor";

const PRESET_COLORS: { label: string; value: [number, number, number] }[] = [
  { label: "Warm", value: [1, 0.86, 0.66] },
  { label: "Daylight", value: [1, 1, 1] },
  { label: "Cool", value: [0.75, 0.88, 1] },
  { label: "Rose", value: [1, 0.75, 0.82] },
  { label: "Amber", value: [1, 0.72, 0.35] },
];

export function VirtualLightControl({ room }: { room?: Room | null }) {
  const [enabled, setEnabled] = useState(false);
  const [live, setLive] = useState(false); // true once actually attached to a real published track
  const [error, setError] = useState<string | null>(null);
  const [opts, setOpts] = useState<VirtualLightOptions>(DEFAULT_VIRTUAL_LIGHT_OPTIONS);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<VirtualLightProcessor | null>(null);
  const standaloneStreamRef = useRef<MediaStream | null>(null);
  const attachedToRoomRef = useRef(false);

  const applyOptions = useCallback((partial: Partial<VirtualLightOptions>) => {
    setOpts((prev) => {
      const next = { ...prev, ...partial };
      processorRef.current?.updateTransformerOptions(next);
      return next;
    });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const camPub = room?.localParticipant?.getTrackPublication?.("camera" as never);
      const liveTrack = (camPub as { videoTrack?: { mediaStreamTrack?: MediaStreamTrack; setProcessor?: (p: unknown) => Promise<void> } } | undefined)?.videoTrack;

      const processor = new VirtualLightProcessor(opts);
      processorRef.current = processor;

      if (liveTrack?.setProcessor && liveTrack.mediaStreamTrack) {
        // Real mode: LiveKit calls processor.init() itself and republishes
        // processor.processedTrack as the outgoing camera feed.
        await liveTrack.setProcessor(processor);
        attachedToRoomRef.current = true;
        setLive(true);
      } else {
        // Standalone preview mode — own camera, own render loop, nothing
        // published anywhere.
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        standaloneStreamRef.current = stream;
        await processor.init({ track: stream.getVideoTracks()[0] });
        attachedToRoomRef.current = false;
        setLive(false);
      }

      if (videoRef.current && processor.processedTrack) {
        videoRef.current.srcObject = new MediaStream([processor.processedTrack]);
        await videoRef.current.play();
      }
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the virtual light.");
      setEnabled(false);
    }
  }, [room, opts]);

  const stop = useCallback(async () => {
    const processor = processorRef.current;
    if (attachedToRoomRef.current && room) {
      const camPub = room.localParticipant?.getTrackPublication?.("camera" as never);
      const liveTrack = (camPub as { videoTrack?: { stopProcessor?: () => Promise<void> } } | undefined)?.videoTrack;
      await liveTrack?.stopProcessor?.();
    } else {
      await processor?.destroy();
    }
    standaloneStreamRef.current?.getTracks().forEach((t) => t.stop());
    standaloneStreamRef.current = null;
    processorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setEnabled(false);
    setLive(false);
  }, [room]);

  useEffect(() => () => { void stop(); }, [stop]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => (enabled ? void stop() : void start());

  // Click/drag directly on the preview to place the light — matches how a
  // ring light actually gets positioned, no separate X/Y sliders needed.
  const placeLightFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    applyOptions({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
  };

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 14, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sun size={16} color={color.peak} />
          <span style={{ fontFamily: font.display, fontSize: 15 }}>Virtual Light</span>
        </div>
        <button onClick={toggle} style={enabled ? toggleBtnActive : toggleBtn}>
          {enabled ? "On" : "Off"}
        </button>
      </div>

      {enabled && (
        <>
          <div
            ref={previewRef}
            onPointerDown={placeLightFromEvent}
            onPointerMove={(e) => { if (e.buttons === 1) placeLightFromEvent(e); }}
            style={{
              position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12,
              overflow: "hidden", background: color.stage, border: `1px solid ${color.hairline}`, cursor: "crosshair",
            }}
          >
            <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <div style={{
              position: "absolute", left: 6, bottom: 6, fontSize: 10.5, color: color.scoreMuted,
              background: "rgba(14,17,22,0.7)", padding: "3px 7px", borderRadius: 6,
            }}>
              Click/drag preview to place the light
            </div>
          </div>

          <p style={{ fontSize: 11.5, color: live ? color.signal : color.scoreMuted, margin: 0 }}>
            {live ? "● Live — the class sees this effect on your camera." : "Preview only — turn your camera on in the classroom to broadcast this."}
          </p>

          <div>
            <span style={{ fontSize: 11.5, color: color.scoreMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Color</span>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.label}
                  title={c.label}
                  onClick={() => applyOptions({ color: c.value })}
                  style={{
                    width: 26, height: 26, borderRadius: 999, cursor: "pointer",
                    background: `rgb(${c.value.map((v) => Math.round(v * 255)).join(",")})`,
                    border: opts.color === c.value ? `2px solid ${color.signal}` : `2px solid ${color.hairline}`,
                  }}
                />
              ))}
            </div>
          </div>

          <label style={sliderLabel}>
            Size
            <input type="range" min={0.06} max={0.35} step={0.01} value={opts.radius}
              onChange={(e) => applyOptions({ radius: Number(e.target.value) })} style={sliderInput} />
          </label>
          <label style={sliderLabel}>
            Intensity
            <input type="range" min={0.1} max={1.5} step={0.05} value={opts.intensity}
              onChange={(e) => applyOptions({ intensity: Number(e.target.value) })} style={sliderInput} />
          </label>
        </>
      )}

      {error && (
        <div style={{ display: "flex", gap: 6, fontSize: 12, color: color.redzone }}>
          <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

const toggleBtn: React.CSSProperties = {
  height: 28, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600,
  border: `1px solid ${color.hairline}`, background: "transparent", color: color.scoreMuted,
};
const toggleBtnActive: React.CSSProperties = { ...toggleBtn, background: color.signal, color: color.stage, border: `1px solid ${color.signal}` };
const sliderLabel: React.CSSProperties = { display: "grid", gap: 4, fontSize: 12, color: color.scoreMuted };
const sliderInput: React.CSSProperties = { width: "100%" };
