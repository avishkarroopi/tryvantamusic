/** Lesson planner: objectives, homework, assignments, remarks, templates. Autosaves. */
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { emptyPlan, useLessonPlan } from "../hooks/useLessonPlan";

export function LessonPlanner({ apiBase, token, sessionId }: { apiBase: string; token: string; sessionId: string }) {
  const { plan, load, patch } = useLessonPlan(apiBase, token);
  useEffect(() => { if (!plan) load(emptyPlan(sessionId)); }, [plan, sessionId, load]);
  if (!plan) return null;

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 14, minWidth: 280 }}>
      <input value={plan.title} onChange={(e) => patch((p) => ({ ...p, title: e.target.value }))}
        style={{ ...field, fontFamily: font.display, fontSize: 18 }} />

      <List label="Objectives" items={plan.objectives}
        onAdd={(v) => patch((p) => ({ ...p, objectives: [...p.objectives, v] }))}
        onRemove={(i) => patch((p) => ({ ...p, objectives: p.objectives.filter((_, x) => x !== i) }))} />

      <div>
        <Label>Homework</Label>
        <textarea value={plan.homework} onChange={(e) => patch((p) => ({ ...p, homework: e.target.value }))}
          rows={2} style={{ ...field, resize: "vertical" }} />
      </div>

      <List label="Assignments" items={plan.assignments}
        onAdd={(v) => patch((p) => ({ ...p, assignments: [...p.assignments, v] }))}
        onRemove={(i) => patch((p) => ({ ...p, assignments: p.assignments.filter((_, x) => x !== i) }))} />

      <div>
        <Label>Student remarks</Label>
        <textarea value={plan.remarks} onChange={(e) => patch((p) => ({ ...p, remarks: e.target.value }))}
          rows={2} style={{ ...field, resize: "vertical" }} />
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: color.scoreMuted }}>
        <input type="checkbox" checked={plan.is_template}
          onChange={(e) => patch((p) => ({ ...p, is_template: e.target.checked }))} />
        Save as reusable template
      </label>
    </div>
  );
}

function List({ label, items, onAdd, onRemove }: {
  label: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <span style={{ color: color.signal }}>•</span>
            <span style={{ flex: 1 }}>{it}</span>
            <button onClick={() => onRemove(i)} style={xbtn}><X size={13} /></button>
          </div>
        ))}
        <AddRow onAdd={onAdd} />
      </div>
    </div>
  );
}

function AddRow({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  const commit = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder="Add…" style={{ ...field, height: 34 }} />
      <button onClick={commit} style={{ ...xbtn, width: 34, height: 34, color: color.signal }}><Plus size={16} /></button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, textTransform: "uppercase", color: color.scoreMuted, marginBottom: 6 }}>{children}</div>;
}
const field: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, outline: "none",
  color: color.score, background: color.stage, border: `1px solid ${color.hairline}`, fontFamily: "inherit" };
const xbtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, cursor: "pointer", display: "grid", placeItems: "center",
  color: color.scoreMuted, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
