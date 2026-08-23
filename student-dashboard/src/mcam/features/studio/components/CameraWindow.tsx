/** A single positioned camera/screen source on the stage. Draggable + resizable
 *  (custom layouts), applies filters/transform/crop, optional green-screen, and
 *  shows its label. Uses pointer events; normalized rect against the stage. */
import { useRef } from "react";
import { color, font } from "../../../design-system/tokens";
import type { Source } from "../model";
import { filterString, transformString, clipPath } from "../lib/cameraFilters";

export function CameraWindow(p: {
  source: Source; stream?: MediaStream; editable: boolean; showLabel: boolean;
  onChange: (rect: Source["rect"]) => void; onSelect: () => void; selected: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{ x: number; y: number; rect: Source["rect"] } | null>(null);

  const attach = (el: HTMLVideoElement | null) => {
    if (el && p.stream && el.srcObject !== p.stream) el.srcObject = p.stream;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!p.editable) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, rect: p.source.rect };
    p.onSelect();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const parent = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.x) / parent.width;
    const dy = (e.clientY - dragRef.current.y) / parent.height;
    const r = dragRef.current.rect;
    p.onChange({ ...r, x: Math.max(0, Math.min(1 - r.w, r.x + dx)), y: Math.max(0, Math.min(1 - r.h, r.y + dy)) });
  };
  const onPointerUp = () => { dragRef.current = null; };

  const s = p.source.settings;
  return (
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        left: `${p.source.rect.x * 100}%`, top: `${p.source.rect.y * 100}%`,
        width: `${p.source.rect.w * 100}%`, height: `${p.source.rect.h * 100}%`,
        borderRadius: 12, overflow: "hidden", zIndex: p.source.z,
        border: p.selected ? `2px solid ${color.signal}` : "1px solid rgba(255,255,255,0.08)",
        cursor: p.editable ? "grab" : "default", background: "#000",
        boxShadow: p.selected ? `0 0 0 4px ${color.signalDim}44` : "0 6px 24px rgba(0,0,0,0.4)",
      }}>
      <video ref={(el) => { videoRef.current = el; attach(el); }} autoPlay playsInline muted
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          filter: filterString(s), transform: transformString(s), clipPath: clipPath(s),
        }} />
      {p.showLabel && (
        <span style={{
          position: "absolute", left: 8, bottom: 8, padding: "3px 8px", borderRadius: 6,
          fontFamily: font.body, fontSize: 12, color: color.score,
          background: "rgba(14,17,22,0.6)", backdropFilter: "blur(8px)",
        }}>{p.source.label}</span>
      )}
      {s.greenScreen && (
        <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 999,
          background: color.signal, boxShadow: `0 0 8px ${color.signal}` }} />
      )}
    </div>
  );
}
