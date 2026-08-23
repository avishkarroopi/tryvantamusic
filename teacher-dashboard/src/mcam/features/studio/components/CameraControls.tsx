/** Per-source image controls: brightness / contrast / saturation / exposure /
 *  zoom / rotation, plus flip / mirror / crop / blur / green-screen toggles. */
import { color, font } from "../../../design-system/tokens";
import type { CameraSettings } from "../model";

export function CameraControls(p: {
  settings: CameraSettings; onChange: (patch: Partial<CameraSettings>) => void;
}) {
  const s = p.settings;
  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 16, display: "grid", gap: 12 }}>
      <Slider label="Brightness" v={s.brightness} min={0.3} max={2} step={0.01} on={(v) => p.onChange({ brightness: v })} />
      <Slider label="Contrast" v={s.contrast} min={0.3} max={2} step={0.01} on={(v) => p.onChange({ contrast: v })} />
      <Slider label="Saturation" v={s.saturation} min={0} max={2} step={0.01} on={(v) => p.onChange({ saturation: v })} />
      <Slider label="Exposure" v={s.exposure} min={0.3} max={2} step={0.01} on={(v) => p.onChange({ exposure: v })} />
      <Slider label="Zoom" v={s.zoom} min={1} max={3} step={0.01} on={(v) => p.onChange({ zoom: v })} />
      <Slider label="Rotation" v={s.rotation} min={-180} max={180} step={1} on={(v) => p.onChange({ rotation: v })} suffix="°" />
      <Slider label="Background blur" v={s.blur} min={0} max={20} step={1} on={(v) => p.onChange({ blur: v })} suffix="px" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Toggle label="Mirror" on={s.mirror} onClick={() => p.onChange({ mirror: !s.mirror })} />
        <Toggle label="Flip" on={s.flip} onClick={() => p.onChange({ flip: !s.flip })} />
        <Toggle label="Green screen" on={s.greenScreen} onClick={() => p.onChange({ greenScreen: !s.greenScreen })} />
      </div>
      {s.greenScreen && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: color.scoreMuted }}>
          Chroma color
          <input type="color" value={s.chromaColor} onChange={(e) => p.onChange({ chromaColor: e.target.value })} />
        </label>
      )}
      {s.blur > 0 && (
        <div style={{ fontSize: 12, color: color.peak }}>
          Blur/virtual-background needs the segmentation model enabled in settings.
        </div>
      )}
    </div>
  );
}

function Slider(p: { label: string; v: number; min: number; max: number; step: number; on: (v: number) => void; suffix?: string }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 12, color: color.scoreMuted }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{p.label}</span><span style={{ fontFamily: font.mono }}>{p.v.toFixed(p.step < 1 ? 2 : 0)}{p.suffix ?? ""}</span>
      </span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.v}
        onChange={(e) => p.on(parseFloat(e.target.value))} style={{ accentColor: color.signal }} />
    </label>
  );
}
function Toggle(p: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={p.onClick} style={{
      padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13,
      color: p.on ? color.stage : color.score, background: p.on ? color.signal : color.surfaceRaised,
      border: `1px solid ${p.on ? color.signal : color.hairline}`,
    }}>{p.label}</button>
  );
}
