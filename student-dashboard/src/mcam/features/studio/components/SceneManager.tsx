/** OBS-style scene rail: switch, add starter/custom, duplicate, rename, delete,
 *  reorder (drag). Instant switching. Glassmorphic, dark. */
import { useState } from "react";
import { Reorder } from "framer-motion";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import type { Scene, SceneKind } from "../model";
import { STARTER_SCENES } from "../model";

export function SceneManager(p: {
  scenes: Scene[]; activeId: string | null; onSwitch: (id: string) => void;
  onCreate: (name: string, kind: SceneKind) => void; onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void; onDelete: (id: string) => void;
  onReorder: (id: string, newIndex: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div style={{
      fontFamily: font.body, color: color.score, padding: 12, display: "flex", flexDirection: "column", gap: 8,
      background: "rgba(22,26,33,0.7)", backdropFilter: "blur(16px)", borderRadius: 14,
      border: `1px solid ${color.hairline}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: color.scoreMuted }}>Scenes</span>
        <button onClick={() => setAdding((a) => !a)} style={iconBtn} aria-label="Add scene"><Plus size={16} /></button>
      </div>

      {adding && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 6 }}>
          {STARTER_SCENES.map((s) => (
            <button key={s.kind} onClick={() => { p.onCreate(s.name, s.kind); setAdding(false); }} style={chip}>
              {s.name}
            </button>
          ))}
          <button onClick={() => { p.onCreate("Custom", "custom"); setAdding(false); }} style={chip}>+ Custom</button>
        </div>
      )}

      <Reorder.Group axis="y" values={p.scenes} onReorder={() => { /* order persisted per-drop below */ }}
        style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {p.scenes.map((s, idx) => (
          <Reorder.Item key={s.id} value={s}
            onDragEnd={() => p.onReorder(s.id, idx)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10,
              cursor: "grab", background: s.id === p.activeId ? "rgba(51,201,160,0.12)" : color.surface,
              border: `1px solid ${s.id === p.activeId ? color.signalDim : color.hairline}`,
            }}>
            <div onClick={() => p.onSwitch(s.id)} style={{ flex: 1, minWidth: 0 }}>
              {editing === s.id ? (
                <input autoFocus defaultValue={s.name}
                  onBlur={(e) => { p.onRename(s.id, e.target.value); setEditing(null); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  style={{ width: "100%", background: color.stage, color: color.score,
                    border: `1px solid ${color.hairline}`, borderRadius: 6, padding: "2px 6px" }} />
              ) : (
                <span style={{ fontSize: 14 }}>{s.name}</span>
              )}
            </div>
            <button onClick={() => setEditing(s.id)} style={iconBtn} aria-label="Rename"><Pencil size={14} /></button>
            <button onClick={() => p.onDuplicate(s.id)} style={iconBtn} aria-label="Duplicate"><Copy size={14} /></button>
            <button onClick={() => p.onDelete(s.id)} style={iconBtn} aria-label="Delete"><Trash2 size={14} /></button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer",
  color: color.scoreMuted, background: color.surfaceRaised, border: `1px solid ${color.hairline}`,
};
const chip: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13,
  color: color.score, background: color.surfaceRaised, border: `1px solid ${color.hairline}`,
};
