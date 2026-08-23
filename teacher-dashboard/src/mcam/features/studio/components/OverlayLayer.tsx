/** Broadcast overlays: lower-third, course/topic, countdown, watermark, logo,
 *  camera labels, practice + recording indicators. Pure presentation over the stage. */
import { useEffect, useState } from "react";
import { color, font } from "../../../design-system/tokens";
import type { Overlay } from "../model";

function Countdown({ until }: { until: number }) {
  const [left, setLeft] = useState(until - Date.now());
  useEffect(() => { const id = setInterval(() => setLeft(until - Date.now()), 250); return () => clearInterval(id); }, [until]);
  const s = Math.max(0, Math.floor(left / 1000));
  const mm = `${Math.floor(s / 60)}`.padStart(2, "0"), ss = `${s % 60}`.padStart(2, "0");
  return <span style={{ fontFamily: font.mono, fontSize: 28, color: s < 30 ? color.peak : color.score }}>{mm}:{ss}</span>;
}

export function OverlayLayer({ overlays }: { overlays: Overlay[] }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {overlays.filter((o) => o.visible).map((o) => {
        const pos: React.CSSProperties = {
          position: "absolute", left: `${o.rect.x * 100}%`, top: `${o.rect.y * 100}%`,
          width: `${o.rect.w * 100}%`, height: `${o.rect.h * 100}%`,
          display: "flex", alignItems: "center",
        };
        switch (o.kind) {
          case "lower_third":
            return (
              <div key={o.id} style={{ ...pos }}>
                <div style={{
                  padding: "10px 18px", borderRadius: 10, color: color.score, fontFamily: font.display,
                  fontSize: 22, background: "rgba(14,17,22,0.55)", backdropFilter: "blur(14px)",
                  borderLeft: `3px solid ${color.signal}`,
                }}>{o.text}</div>
              </div>
            );
          case "course":
          case "topic":
            return <div key={o.id} style={{ ...pos, fontFamily: font.body, fontSize: 15, color: color.scoreMuted }}>{o.text}</div>;
          case "countdown":
            return <div key={o.id} style={{ ...pos, justifyContent: "center" }}><Countdown until={o.until ?? Date.now()} /></div>;
          case "watermark":
          case "logo":
            return <img key={o.id} src={o.imageUrl} alt="" style={{ ...pos, objectFit: "contain", opacity: o.kind === "watermark" ? 0.5 : 1 }} />;
          case "practice":
            return <Badge key={o.id} pos={pos} tone={color.peak} label="PRACTICE" pulse />;
          case "recording":
            return <Badge key={o.id} pos={pos} tone={color.redzone} label="REC" pulse />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function Badge({ pos, tone, label, pulse }: { pos: React.CSSProperties; tone: string; label: string; pulse?: boolean }) {
  return (
    <div style={{ ...pos, gap: 6 }}>
      <span style={{
        width: 9, height: 9, borderRadius: 999, background: tone,
        animation: pulse ? "mcamPulse 1.2s ease-in-out infinite" : undefined,
      }} />
      <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: 1, color: tone }}>{label}</span>
      <style>{`@keyframes mcamPulse{0%,100%{opacity:1}50%{opacity:0.25}}`}</style>
    </div>
  );
}
