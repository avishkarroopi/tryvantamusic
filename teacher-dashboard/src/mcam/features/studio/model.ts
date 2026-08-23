/** Studio domain model — scenes, sources, layouts, camera settings, overlays,
 *  mixer. A Scene's `config` is exactly StudioConfig; it round-trips to the
 *  backend studio_scenes.config JSON column unchanged. */

export type LayoutKind =
  | "single" | "pip" | "split_v" | "split_h" | "grid" | "floating" | "custom";

export type SourceKind = "camera" | "screen" | "image";

export interface Rect { x: number; y: number; w: number; h: number } // 0..1 of stage

export interface CameraSettings {
  brightness: number; // 1 = neutral
  contrast: number;
  saturation: number;
  exposure: number;   // maps to brightness*exposure in filter
  zoom: number;       // 1..3 (scale)
  rotation: number;   // deg
  mirror: boolean;
  flip: boolean;      // vertical flip
  crop: Rect | null;
  blur: number;       // px background blur (needs segmentation model; 0 = off)
  greenScreen: boolean;
  chromaColor: string; // hex, for green screen
}

export function defaultCamera(): CameraSettings {
  return {
    brightness: 1, contrast: 1, saturation: 1, exposure: 1, zoom: 1, rotation: 0,
    mirror: false, flip: false, crop: null, blur: 0, greenScreen: false, chromaColor: "#00b140",
  };
}

export interface Source {
  id: string;
  kind: SourceKind;
  label: string;        // "Face Cam", "Instrument Cam", "Top Cam"…
  deviceId?: string;    // for camera
  imageUrl?: string;    // for image
  rect: Rect;           // position on the stage
  z: number;            // stacking order
  visible: boolean;
  settings: CameraSettings;
}

export type OverlayKind =
  | "lower_third" | "course" | "topic" | "countdown" | "watermark"
  | "logo" | "camera_label" | "practice" | "recording";

export interface Overlay {
  id: string;
  kind: OverlayKind;
  text?: string;
  imageUrl?: string;
  rect: Rect;
  visible: boolean;
  until?: number;       // epoch ms for countdown
}

export interface MixerChannel {
  id: string;
  label: string;        // Microphone, Instrument, Desktop Audio, System Audio
  gain: number;         // 0..1.5
  muted: boolean;
  solo: boolean;
  monitor: boolean;
}

export interface StudioConfig {
  layout: LayoutKind;
  sources: Source[];
  overlays: Overlay[];
  mixer: MixerChannel[];
}

export type SceneKind =
  | "piano" | "guitar" | "vocals" | "theory" | "whiteboard"
  | "performance" | "presentation" | "custom";

export interface Scene {
  id: string;
  session_id: string;
  owner_id: string;
  name: string;
  kind: SceneKind;
  order_index: number;
  config: StudioConfig;
}

export const STARTER_SCENES: { name: string; kind: SceneKind }[] = [
  { name: "Piano", kind: "piano" },
  { name: "Guitar", kind: "guitar" },
  { name: "Vocals", kind: "vocals" },
  { name: "Theory", kind: "theory" },
  { name: "Whiteboard", kind: "whiteboard" },
  { name: "Performance", kind: "performance" },
  { name: "Presentation", kind: "presentation" },
];

export function emptyConfig(layout: LayoutKind = "single"): StudioConfig {
  return {
    layout, sources: [], overlays: [],
    mixer: [
      { id: "mic", label: "Microphone", gain: 1, muted: false, solo: false, monitor: false },
      { id: "instrument", label: "Instrument", gain: 1, muted: false, solo: false, monitor: false },
      { id: "desktop", label: "Desktop Audio", gain: 0.8, muted: false, solo: false, monitor: false },
      { id: "system", label: "System Audio", gain: 0.8, muted: true, solo: false, monitor: false },
    ],
  };
}

/** Standard layouts expressed as normalized rects, applied to the first N sources. */
export function layoutRects(kind: LayoutKind, n: number): Rect[] {
  switch (kind) {
    case "pip":
      return [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.7, y: 0.68, w: 0.28, h: 0.3 }];
    case "split_v":
      return [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }];
    case "split_h":
      return [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }];
    case "floating":
      return [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.04, y: 0.6, w: 0.24, h: 0.34 }];
    case "grid": {
      const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
      return Array.from({ length: n }, (_, i) => ({
        x: (i % cols) / cols, y: Math.floor(i / cols) / rows, w: 1 / cols, h: 1 / rows,
      }));
    }
    default:
      return [{ x: 0, y: 0, w: 1, h: 1 }];
  }
}
