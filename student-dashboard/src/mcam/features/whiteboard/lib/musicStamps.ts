/** Draw music teaching primitives to a 2D context: staff, clefs, keyboard. */
type Ctx = CanvasRenderingContext2D;

export function drawStaff(ctx: Ctx, x: number, y: number, w = 320, gap = 12, stroke = "#A7ADBA") {
  ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(x, y + i * gap); ctx.lineTo(x + w, y + i * gap); ctx.stroke();
  }
  ctx.restore();
}

/** Clefs drawn as clean glyphs (unicode) sized to the staff. */
export function drawClef(ctx: Ctx, kind: "treble" | "bass", x: number, y: number, gap = 12, color = "#F5F2EC") {
  ctx.save(); ctx.fillStyle = color;
  ctx.font = `${gap * 5}px serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(kind === "treble" ? "\uD834\uDD1E" : "\uD834\uDD22", x, y + gap * 4.2);
  ctx.restore();
}

export function drawKeyboard(ctx: Ctx, x: number, y: number, octaves = 2, wKey = 22, h = 80) {
  ctx.save();
  const whites = octaves * 7;
  for (let i = 0; i < whites; i++) {
    ctx.fillStyle = "#F5F2EC"; ctx.strokeStyle = "#232833";
    ctx.fillRect(x + i * wKey, y, wKey, h); ctx.strokeRect(x + i * wKey, y, wKey, h);
  }
  const pattern = [0, 1, 3, 4, 5]; // black-key offsets within an octave (after C,D / F,G,A)
  ctx.fillStyle = "#0E1116";
  for (let o = 0; o < octaves; o++) {
    for (const p of pattern) {
      const bx = x + (o * 7 + p) * wKey + wKey * 0.68;
      ctx.fillRect(bx, y, wKey * 0.62, h * 0.62);
    }
  }
  ctx.restore();
}
