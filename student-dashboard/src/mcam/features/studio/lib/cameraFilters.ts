import type { CameraSettings } from "../model";

/** CSS filter string from camera settings (GPU-composited by the browser). */
export function filterString(s: CameraSettings): string {
  const parts = [
    `brightness(${(s.brightness * s.exposure).toFixed(3)})`,
    `contrast(${s.contrast.toFixed(3)})`,
    `saturate(${s.saturation.toFixed(3)})`,
  ];
  return parts.join(" ");
}

/** CSS transform from zoom / rotation / mirror / flip. */
export function transformString(s: CameraSettings): string {
  const sx = (s.mirror ? -1 : 1) * s.zoom;
  const sy = (s.flip ? -1 : 1) * s.zoom;
  return `scale(${sx}, ${sy}) rotate(${s.rotation}deg)`;
}

/** object-view crop via clip-path inset (normalized rect). */
export function clipPath(s: CameraSettings): string | undefined {
  if (!s.crop) return undefined;
  const { x, y, w, h } = s.crop;
  return `inset(${(y * 100).toFixed(1)}% ${((1 - x - w) * 100).toFixed(1)}% ${((1 - y - h) * 100).toFixed(1)}% ${(x * 100).toFixed(1)}%)`;
}
