/** Always-available floating toolbar inside class. A dock of teaching tools;
 *  clicking one opens it in a draggable glass panel — or, for tools that need
 *  real screen space (guitar fretboard, keyboard, mixer…), a fullscreen
 *  overlay. Reads the shared TOOL_REGISTRY (same list as each dashboard's
 *  Music Tools page) plus one session-scoped extra (Lesson Planner) that
 *  isn't meaningful outside a live classroom. */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench, NotebookPen, Sun } from "lucide-react";
import type { Room } from "livekit-client";
import { color, font } from "../../../design-system/tokens";
import { LessonPlanner } from "./LessonPlanner";
import { VirtualLightControl } from "./VirtualLightControl";
import { TOOL_REGISTRY, getTool } from "../toolRegistry";

type ToolId = string | "planner" | "virtuallight";

export function FloatingToolbar(props: {
  analyser: AnalyserNode | null; apiBase: string; token: string; sessionId: string;
  /** The live LiveKit room, when connected — lets Virtual Light attach to
   *  the real published camera track instead of only previewing locally.
   *  Optional: the toolbar (and Virtual Light itself) work fine without it. */
  room?: Room | null;
}) {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<ToolId | null>(null);

  const registryTool = tool && tool !== "planner" && tool !== "virtuallight" ? getTool(tool) : undefined;
  const isLarge = tool === "planner" || tool === "virtuallight" ? false : registryTool?.size === "large";
  const toolLabel = tool === "planner" ? "Planner" : tool === "virtuallight" ? "Virtual Light" : (registryTool?.name ?? tool);

  const render = () => {
    if (tool === "planner") return <LessonPlanner apiBase={props.apiBase} token={props.token} sessionId={props.sessionId} />;
    if (tool === "virtuallight") return <VirtualLightControl room={props.room} />;
    return registryTool?.render(props.analyser) ?? null;
  };

  return (
    <div style={{ position: "fixed", right: 20, bottom: 96, zIndex: 60, fontFamily: font.body }}>
      <AnimatePresence>
        {tool && !isLarge && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            style={{
              position: "absolute", right: 0, bottom: 60, width: 320, maxHeight: "70vh", overflowY: "auto",
              borderRadius: 18, background: "rgba(22,26,33,0.82)", backdropFilter: "blur(20px)",
              border: `1px solid ${color.hairline}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderBottom: `1px solid ${color.hairline}` }}>
              <span style={{ fontFamily: font.display, fontSize: 16 }}>{toolLabel}</span>
              <button onClick={() => setTool(null)} style={iconBtn}><X size={16} /></button>
            </div>
            {render()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tool && isLarge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,10,14,0.92)", backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 24px", borderBottom: `1px solid ${color.hairline}` }}>
              <span style={{ fontFamily: font.display, fontSize: 20, color: color.score }}>{toolLabel}</span>
              <button onClick={() => setTool(null)} style={iconBtn}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 1100 }}>{render()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: "60vh", overflowY: "auto" }}>
            {TOOL_REGISTRY.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.name}
                style={{ ...dockBtn, ...(tool === t.id ? { borderColor: color.signal, color: color.signal } : {}) }}>
                {t.icon}
              </button>
            ))}
            <button onClick={() => setTool("planner")} title="Lesson Planner"
              style={{ ...dockBtn, ...(tool === "planner" ? { borderColor: color.signal, color: color.signal } : {}) }}>
              <NotebookPen size={20} />
            </button>
            <button onClick={() => setTool("virtuallight")} title="Virtual Light"
              style={{ ...dockBtn, ...(tool === "virtuallight" ? { borderColor: color.signal, color: color.signal } : {}) }}>
              <Sun size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.92 }} onClick={() => setOpen((o) => !o)} aria-label="Teaching tools"
        style={{ width: 56, height: 56, borderRadius: 999, cursor: "pointer", display: "grid", placeItems: "center",
          background: color.signal, color: color.stage, border: "none", boxShadow: `0 8px 30px ${color.signalDim}` }}>
        <Wrench size={22} />
      </motion.button>
    </div>
  );
}

const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.scoreMuted, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
const dockBtn: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.score, background: "rgba(28,34,43,0.9)", backdropFilter: "blur(12px)", border: `1px solid ${color.hairline}` };
