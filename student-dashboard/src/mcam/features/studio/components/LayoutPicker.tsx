/** Choose a layout (single / PiP / split / grid / floating / custom) and
 *  save/load layout presets. Applying a layout re-rects the visible sources. */
import type { JSX } from "react";
import { color, font } from "../../../design-system/tokens";
import type { LayoutKind } from "../model";

const LAYOUTS: { kind: LayoutKind; label: string; icon: JSX.Element }[] = [
  { kind: "single", label: "Single", icon: <Box cells={[[0, 0, 1, 1]]} /> },
  { kind: "pip", label: "Picture in Picture", icon: <Box cells={[[0, 0, 1, 1], [0.62, 0.6, 0.34, 0.36]]} /> },
  { kind: "split_v", label: "Vertical Split", icon: <Box cells={[[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]]} /> },
  { kind: "split_h", label: "Horizontal Split", icon: <Box cells={[[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]]} /> },
  { kind: "grid", label: "Grid", icon: <Box cells={[[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]} /> },
  { kind: "floating", label: "Floating Camera", icon: <Box cells={[[0, 0, 1, 1], [0.05, 0.62, 0.3, 0.32]]} /> },
];

export function LayoutPicker(p: {
  active: LayoutKind; onPick: (k: LayoutKind) => void;
  presets: { id: string; name: string }[]; onSavePreset: (name: string) => void; onLoadPreset: (id: string) => void;
}) {
  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 12, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {LAYOUTS.map((l) => {
          const on = l.kind === p.active;
          return (
            <button key={l.kind} onClick={() => p.onPick(l.kind)} title={l.label}
              style={{
                display: "grid", gap: 6, placeItems: "center", padding: 10, borderRadius: 10, cursor: "pointer",
                background: on ? "rgba(51,201,160,0.12)" : color.surface,
                border: `1px solid ${on ? color.signalDim : color.hairline}`,
              }}>
              {l.icon}
              <span style={{ fontSize: 11, color: color.scoreMuted }}>{l.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => p.onSavePreset(prompt("Preset name?") || "Preset")} style={btn}>Save layout preset</button>
        {p.presets.map((pr) => (
          <button key={pr.id} onClick={() => p.onLoadPreset(pr.id)} style={{ ...btn, background: color.surface }}>{pr.name}</button>
        ))}
      </div>
    </div>
  );
}

function Box({ cells }: { cells: [number, number, number, number][] }) {
  return (
    <svg width={44} height={26} viewBox="0 0 44 26">
      <rect x={0} y={0} width={44} height={26} rx={3} fill="#0E1116" stroke="#232833" />
      {cells.map((c, i) => (
        <rect key={i} x={c[0] * 44} y={c[1] * 26} width={c[2] * 44} height={c[3] * 26}
          rx={2} fill="none" stroke="#33C9A0" strokeWidth={1.2} />
      ))}
    </svg>
  );
}
const btn: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#F5F2EC",
  background: "#1C222B", border: "1px solid #232833",
};
