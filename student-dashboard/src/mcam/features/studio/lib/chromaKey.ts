/**
 * Real green-screen via canvas. Samples each frame, keys out pixels near the
 * chroma color, and composites onto a transparent canvas that the studio draws
 * over a background. No ML model needed — this is true chroma keying.
 *
 * NOTE: background *blur* and *virtual background* (keying without a physical
 * green screen) require a person-segmentation model (e.g. MediaPipe Selfie
 * Segmentation). This module is the green-screen path; the segmentation path
 * plugs a mask into the same compositing step (see applyMask).
 */
function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export class ChromaKeyer {
  private ctx: CanvasRenderingContext2D;
  private raf?: number;

  constructor(
    private video: HTMLVideoElement,
    private canvas: HTMLCanvasElement,
    private color: string,
    private threshold = 120,
  ) {
    this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  }

  start() {
    const { r: kr, g: kg, b: kb } = hexToRgb(this.color);
    const draw = () => {
      const w = this.canvas.width, h = this.canvas.height;
      if (this.video.readyState >= 2) {
        this.ctx.drawImage(this.video, 0, 0, w, h);
        const frame = this.ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.abs(d[i] - kr) + Math.abs(d[i + 1] - kg) + Math.abs(d[i + 2] - kb);
          if (dist < this.threshold) d[i + 3] = 0; // transparent
        }
        this.ctx.putImageData(frame, 0, 0);
      }
      this.raf = requestAnimationFrame(draw);
    };
    draw();
  }

  stop() { if (this.raf) cancelAnimationFrame(this.raf); }
}
