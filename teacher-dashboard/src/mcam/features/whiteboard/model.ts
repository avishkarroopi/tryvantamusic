/** Whiteboard op model. Ops are the unit of collaboration: created locally,
 *  broadcast over the realtime channel, and replayed from a snapshot on join. */
export type Tool =
  | "pen" | "highlighter" | "eraser" | "rect" | "ellipse" | "line" | "arrow"
  | "text" | "image" | "sticky" | "laser" | "staff" | "treble" | "bass"
  | "keyboard" | "hand";

export interface Point { x: number; y: number }

export interface BaseOp { id: string; kind: string; author?: string; color?: string; width?: number }

export interface StrokeOp extends BaseOp { kind: "stroke"; points: Point[]; highlighter?: boolean }
export interface ShapeOp extends BaseOp { kind: "shape"; shape: "rect" | "ellipse" | "line" | "arrow"; from: Point; to: Point }
export interface TextOp extends BaseOp { kind: "text"; at: Point; text: string; size: number }
export interface ImageOp extends BaseOp { kind: "image"; at: Point; w: number; h: number; src: string }
export interface StickyOp extends BaseOp { kind: "sticky"; at: Point; text: string }
export interface StampOp extends BaseOp { kind: "stamp"; stamp: "staff" | "treble" | "bass" | "keyboard"; at: Point; scale: number }
export interface LaserOp extends BaseOp { kind: "laser"; at: Point }
export interface UndoOp { kind: "undo"; target: string; author?: string }
export interface ClearOp { kind: "clear" }

export type BoardOp = StrokeOp | ShapeOp | TextOp | ImageOp | StickyOp | StampOp | LaserOp | UndoOp | ClearOp;

export interface Viewport { x: number; y: number; scale: number } // infinite canvas pan/zoom

export const PALETTE = ["#F5F2EC", "#33C9A0", "#F5A524", "#F4622E", "#6AA9FF", "#C792EA"];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
