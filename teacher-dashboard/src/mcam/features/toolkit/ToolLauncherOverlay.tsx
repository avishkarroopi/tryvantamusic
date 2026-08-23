/** Fullscreen overlay that launches any tool from the shared registry —
 *  used by both dashboards' standalone Music Tools pages (no classroom
 *  analyser available, so mic-hungry tools open their own input). */
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, font } from "../../design-system/tokens";
import { getTool } from "./toolRegistry";

export function ToolLauncherOverlay({ toolId, onClose }: { toolId: string | null; onClose: () => void }) {
  if (!toolId) return null;
  const tool = getTool(toolId);
  if (!tool) return null;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,10,14,0.94)", backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column", fontFamily: font.body,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${color.hairline}` }}>
        <div>
          <div style={{ fontFamily: font.display, fontSize: 20, color: color.score }}>{tool.name}</div>
          <div style={{ fontSize: 12, color: color.scoreMuted }}>{tool.tagline}</div>
        </div>
        <button onClick={onClose} aria-label="Close tool" style={{
          width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center",
          color: color.scoreMuted, background: color.surfaceRaised, border: `1px solid ${color.hairline}`,
        }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: tool.size === "large" ? 1100 : 420, background: color.surface,
          border: `1px solid ${color.hairline}`, borderRadius: 16, alignSelf: "flex-start" }}>
          {tool.render(null)}
        </div>
      </div>
    </div>,
    document.body,
  );
}
