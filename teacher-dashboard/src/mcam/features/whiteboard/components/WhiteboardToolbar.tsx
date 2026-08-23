/** Floating glass toolbar: tools, color, width, undo/redo, clear, export, lock. */
import type { JSX } from "react";
import {
  Pen, Highlighter, Eraser, Square, Circle, Minus, ArrowUpRight, Type, StickyNote,
  MousePointer2, Hand, Undo2, Redo2, Trash2, Download, Lock, Unlock, Music, Piano,
} from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import type { Tool } from "../model";
import { PALETTE } from "../model";

const TOOLS: { id: Tool; icon: JSX.Element; label: string }[] = [
  { id: "pen", icon: <Pen size={16} />, label: "Pen" },
  { id: "highlighter", icon: <Highlighter size={16} />, label: "Highlighter" },
  { id: "eraser", icon: <Eraser size={16} />, label: "Eraser" },
  { id: "rect", icon: <Square size={16} />, label: "Rectangle" },
  { id: "ellipse", icon: <Circle size={16} />, label: "Ellipse" },
  { id: "line", icon: <Minus size={16} />, label: "Line" },
  { id: "arrow", icon: <ArrowUpRight size={16} />, label: "Arrow" },
  { id: "text", icon: <Type size={16} />, label: "Text" },
  { id: "sticky", icon: <StickyNote size={16} />, label: "Sticky note" },
  { id: "laser", icon: <MousePointer2 size={16} />, label: "Laser pointer" },
  { id: "staff", icon: <Music size={16} />, label: "Staff" },
  { id: "treble", icon: <Music size={16} />, label: "Treble clef" },
  { id: "keyboard", icon: <Piano size={16} />, label: "Keyboard" },
  { id: "hand", icon: <Hand size={16} />, label: "Pan" },
];

export function WhiteboardToolbar({ wb, isTeacher, onExport }: {
  wb: {
    tool: Tool; setTool: (t: Tool) => void; color: string; setColor: (c: string) => void;
    width: number; setWidth: (w: number) => void; undo: () => void; redoLast: () => void;
    clear: () => void; locked: boolean; setLock: (v: boolean) => void;
  };
  isTeacher: boolean; onExport: () => void;
}) {
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 4, padding: 8, borderRadius: 16,
      background: "rgba(22,26,33,0.82)", backdropFilter: "blur(20px)",
      border: `1px solid ${color.hairline}`, fontFamily: font.body, maxWidth: "94%", flexWrap: "wrap",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
    }}>
      {TOOLS.map((t) => (
        <button key={t.id} title={t.label} onClick={() => wb.setTool(t.id)}
          style={btn(wb.tool === t.id)}>{t.icon}</button>
      ))}

      <span style={sep} />
      {PALETTE.map((c) => (
        <button key={c} aria-label={`color ${c}`} onClick={() => wb.setColor(c)}
          style={{ width: 20, height: 20, borderRadius: 999, background: c, cursor: "pointer",
            border: wb.color === c ? `2px solid ${color.score}` : "1px solid rgba(255,255,255,0.15)" }} />
      ))}
      <input type="range" min={1} max={16} value={wb.width} onChange={(e) => wb.setWidth(parseInt(e.target.value))}
        style={{ width: 70, accentColor: color.signal }} />

      <span style={sep} />
      <button title="Undo" onClick={wb.undo} style={btn(false)}><Undo2 size={16} /></button>
      <button title="Redo" onClick={wb.redoLast} style={btn(false)}><Redo2 size={16} /></button>
      <button title="Export PNG" onClick={onExport} style={btn(false)}><Download size={16} /></button>
      {isTeacher && (
        <>
          <button title="Clear" onClick={wb.clear} style={btn(false)}><Trash2 size={16} /></button>
          <button title={wb.locked ? "Unlock board" : "Lock board"} onClick={() => wb.setLock(!wb.locked)}
            style={btn(wb.locked)}>{wb.locked ? <Lock size={16} /> : <Unlock size={16} />}</button>
        </>
      )}
    </div>
  );
}

const btn = (on: boolean): React.CSSProperties => ({
  width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer",
  color: on ? "#0E1116" : "#F5F2EC", background: on ? "#33C9A0" : "rgba(28,34,43,0.9)",
  border: `1px solid ${on ? "#33C9A0" : "#232833"}`,
});
const sep: React.CSSProperties = { width: 1, height: 24, background: "#232833", margin: "0 4px" };
