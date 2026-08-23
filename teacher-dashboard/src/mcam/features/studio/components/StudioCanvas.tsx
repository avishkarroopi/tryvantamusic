/** The stage: composites the active scene's visible sources (in their rects)
 *  with the overlay layer on top. 16:9, GPU-composited transforms/filters. */
import { color } from "../../../design-system/tokens";
import type { Scene } from "../model";
import { CameraWindow } from "./CameraWindow";
import { OverlayLayer } from "./OverlayLayer";

export function StudioCanvas(p: {
  scene: Scene | null; streams: Map<string, MediaStream>; editable: boolean;
  selectedSourceId: string | null; onSelectSource: (id: string) => void;
  onMoveSource: (id: string, rect: any) => void;
}) {
  if (!p.scene) {
    return <div style={emptyStage}>Create a scene to begin</div>;
  }
  const sources = [...p.scene.config.sources].filter((s) => s.visible).sort((a, b) => a.z - b.z);
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 16, overflow: "hidden",
      background: "#000", border: `1px solid ${color.hairline}`,
    }}>
      {sources.map((src) => (
        <CameraWindow key={src.id} source={src} stream={p.streams.get(src.deviceId ?? src.id)}
          editable={p.editable} showLabel selected={p.selectedSourceId === src.id}
          onSelect={() => p.onSelectSource(src.id)}
          onChange={(rect) => p.onMoveSource(src.id, rect)} />
      ))}
      <OverlayLayer overlays={p.scene.config.overlays} />
    </div>
  );
}

const emptyStage: React.CSSProperties = {
  width: "100%", aspectRatio: "16 / 9", borderRadius: 16, display: "grid", placeItems: "center",
  background: "#0E1116", border: "1px dashed #232833", color: "#A7ADBA",
};
