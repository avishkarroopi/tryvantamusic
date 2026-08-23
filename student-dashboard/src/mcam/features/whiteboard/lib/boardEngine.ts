/** Renders board ops to a 2D canvas under a viewport transform, and owns the
 *  ordered op list. Rendering is deterministic replay of ops in order. */
import type { BoardOp, Viewport } from "../model";
import { drawStaff, drawClef, drawKeyboard } from "./musicStamps";

export function render(
  ctx: CanvasRenderingContext2D, ops: BoardOp[], vp: Viewport,
  laser?: { x: number; y: number } | null,
) {
  const { canvas } = ctx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.scale, vp.scale);

  for (const op of ops) {
    switch (op.kind) {
      case "stroke": {
        ctx.strokeStyle = op.color ?? "#F5F2EC";
        ctx.lineWidth = op.width ?? 3;
        ctx.lineJoin = ctx.lineCap = "round";
        ctx.globalAlpha = op.highlighter ? 0.35 : 1;
        ctx.beginPath();
        op.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
      case "shape": {
        ctx.strokeStyle = op.color ?? "#F5F2EC"; ctx.lineWidth = op.width ?? 3;
        const { from: a, to: b } = op;
        ctx.beginPath();
        if (op.shape === "rect") ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        else if (op.shape === "ellipse") {
          ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, 7);
          ctx.stroke();
        } else { // line / arrow
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (op.shape === "arrow") {
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - 12 * Math.cos(ang - 0.4), b.y - 12 * Math.sin(ang - 0.4));
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - 12 * Math.cos(ang + 0.4), b.y - 12 * Math.sin(ang + 0.4));
            ctx.stroke();
          }
        }
        break;
      }
      case "text":
        ctx.fillStyle = op.color ?? "#F5F2EC"; ctx.font = `${op.size}px Inter, sans-serif`;
        ctx.fillText(op.text, op.at.x, op.at.y);
        break;
      case "sticky":
        ctx.fillStyle = "#F5A524"; ctx.fillRect(op.at.x, op.at.y, 160, 120);
        ctx.fillStyle = "#0E1116"; ctx.font = "14px Inter, sans-serif";
        wrap(ctx, op.text, op.at.x + 10, op.at.y + 26, 140, 18);
        break;
      case "image": {
        const img = imgCache(op.src);
        if (img.complete) ctx.drawImage(img, op.at.x, op.at.y, op.w, op.h);
        break;
      }
      case "stamp":
        ctx.save(); ctx.translate(op.at.x, op.at.y); ctx.scale(op.scale, op.scale);
        if (op.stamp === "staff") drawStaff(ctx, 0, 0);
        else if (op.stamp === "keyboard") drawKeyboard(ctx, 0, 0);
        else { drawStaff(ctx, 30, 0); drawClef(ctx, op.stamp, 0, 0); }
        ctx.restore();
        break;
    }
  }
  ctx.restore();

  if (laser) {
    ctx.save();
    ctx.fillStyle = "rgba(244,98,46,0.9)";
    ctx.beginPath(); ctx.arc(laser.x, laser.y, 7, 0, 7); ctx.fill();
    ctx.restore();
  }
}

const _cache = new Map<string, HTMLImageElement>();
function imgCache(src: string): HTMLImageElement {
  let img = _cache.get(src);
  if (!img) { img = new Image(); img.src = src; _cache.set(src, img); }
  return img;
}
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" "); let line = "";
  for (const w of words) {
    if (ctx.measureText(`${line}${w} `).width > maxW) { ctx.fillText(line, x, y); line = `${w} `; y += lh; }
    else line += `${w} `;
  }
  ctx.fillText(line, x, y);
}

export function screenToWorld(px: number, py: number, vp: Viewport): { x: number; y: number } {
  return { x: (px - vp.x) / vp.scale, y: (py - vp.y) / vp.scale };
}
