/** Collaborative canvas. Pointer draws in world space under the viewport;
 *  wheel zooms, hand-tool pans (infinite canvas). Renders via boardEngine. */
import { useEffect, useRef, useState } from "react";
import { color as tk } from "../../../design-system/tokens";
import type { RealtimeClient } from "../../../lib/realtimeClient";
import { useWhiteboard } from "../hooks/useWhiteboard";
import { render, screenToWorld } from "../lib/boardEngine";
import type { BoardOp, Point } from "../model";
import { WhiteboardToolbar } from "./WhiteboardToolbar";

export function Whiteboard({ client, isTeacher }: { client: RealtimeClient; isTeacher: boolean }) {
  const wb = useWhiteboard(client, { isTeacher });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draft = useRef<BoardOp | null>(null);
  const drawing = useRef(false);
  const [, force] = useState(0);

  // render loop
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let raf: number;
    const loop = () => {
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== cv.clientWidth * dpr) { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.scale(dpr, dpr); }
      const all = draft.current ? [...wb.ops, draft.current] : wb.ops;
      render(ctx, all, wb.vp, wb.laser);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [wb.ops, wb.vp, wb.laser]);

  const worldFromEvent = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return screenToWorld(e.clientX - rect.left, e.clientY - rect.top, wb.vp);
  };

  const onDown = (e: React.PointerEvent) => {
    const p = worldFromEvent(e);
    if (wb.tool === "laser") { wb.sendLaser(p.x, p.y); return; }
    if (wb.tool === "hand") { drawing.current = true; return; }
    if (!wb.canDraw) return;
    drawing.current = true;
    if (wb.tool === "pen" || wb.tool === "highlighter" || wb.tool === "eraser") {
      draft.current = { id: wb.newId(), kind: "stroke", points: [p], color: wb.tool === "eraser" ? "#0E1116" : wb.color,
        width: wb.tool === "eraser" ? 24 : wb.width, highlighter: wb.tool === "highlighter" };
    } else if (["rect", "ellipse", "line", "arrow"].includes(wb.tool)) {
      draft.current = { id: wb.newId(), kind: "shape", shape: wb.tool as any, from: p, to: p, color: wb.color, width: wb.width };
    } else if (wb.tool === "text") {
      const text = prompt("Text:"); if (text) wb.commit({ id: wb.newId(), kind: "text", at: p, text, size: 22, color: wb.color });
      drawing.current = false;
    } else if (wb.tool === "sticky") {
      const text = prompt("Sticky note:") || ""; wb.commit({ id: wb.newId(), kind: "sticky", at: p, text });
      drawing.current = false;
    } else if (["staff", "treble", "bass", "keyboard"].includes(wb.tool)) {
      wb.commit({ id: wb.newId(), kind: "stamp", stamp: wb.tool as any, at: p, scale: 1 });
      drawing.current = false;
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = worldFromEvent(e);
    if (wb.tool === "hand") { wb.setVp({ ...wb.vp, x: wb.vp.x + e.movementX, y: wb.vp.y + e.movementY }); return; }
    const d = draft.current as any; if (!d) return;
    if (d.kind === "stroke") d.points.push(p);
    else if (d.kind === "shape") d.to = p;
    force((n) => n + 1);
  };

  const onUp = () => {
    drawing.current = false;
    if (draft.current) { wb.commit(draft.current); draft.current = null; }
  };

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    wb.setVp({ ...wb.vp, scale: Math.max(0.2, Math.min(4, wb.vp.scale * factor)) });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: tk.stage, borderRadius: 14, overflow: "hidden" }}>
      <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        onWheel={onWheel} style={{ width: "100%", height: "100%", touchAction: "none",
          cursor: wb.tool === "hand" ? "grab" : "crosshair" }} />
      <WhiteboardToolbar wb={wb} isTeacher={isTeacher}
        onExport={() => canvasRef.current && wb.exportPng(canvasRef.current)} />
      {wb.locked && !isTeacher && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          padding: "6px 12px", borderRadius: 999, background: "rgba(244,98,46,0.15)", color: tk.redzone, fontSize: 12 }}>
          Board locked by teacher
        </div>
      )}
    </div>
  );
}
