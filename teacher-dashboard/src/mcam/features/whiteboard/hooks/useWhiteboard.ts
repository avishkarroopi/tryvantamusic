/** Whiteboard collaboration on the shared realtime channel. Takes the SAME
 *  RealtimeClient the classroom already opened (one socket per lesson), so
 *  board ops travel alongside chat/reactions. Owns ops, undo/redo, lock, export. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeClient } from "../../../lib/realtimeClient";
import type { BoardOp, Tool, Viewport } from "../model";
import { uid } from "../model";

export function useWhiteboard(client: RealtimeClient, opts: { isTeacher: boolean }) {
  const [ops, setOps] = useState<BoardOp[]>([]);
  const [locked, setLocked] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#F5F2EC");
  const [width, setWidth] = useState(3);
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [laser, setLaser] = useState<{ x: number; y: number } | null>(null);
  const redo = useRef<BoardOp[]>([]);
  const laserTimer = useRef<number>(undefined);

  useEffect(() => {
    const offs = [
      client.on("board.state", (d: any) => { setOps(d.ops ?? []); setLocked(!!d.locked); }),
      client.on("board.op", (op: any) => {
        if (op.kind === "laser") {
          setLaser({ x: op.at.x, y: op.at.y });
          window.clearTimeout(laserTimer.current);
          laserTimer.current = window.setTimeout(() => setLaser(null), 900);
          return;
        }
        setOps((cur) => applyRemote(cur, op));
      }),
      client.on("board.lock", (d: any) => setLocked(!!d.locked)),
      client.on("board.clear", () => setOps([])),
    ];
    return () => offs.forEach((o) => o());
  }, [client]);

  const canDraw = opts.isTeacher || !locked;

  const commit = useCallback((op: BoardOp) => {
    if (!canDraw) return;
    setOps((cur) => [...cur, op]);
    redo.current = [];
    client.send("board.op", op as any);
  }, [client, canDraw]);

  const undo = useCallback(() => {
    setOps((cur) => {
      // undo my most recent op
      for (let i = cur.length - 1; i >= 0; i--) {
        const op = cur[i] as any;
        if (op.id) {
          redo.current.push(op);
          client.send("board.op", { kind: "undo", target: op.id });
          return cur.filter((_, x) => x !== i);
        }
      }
      return cur;
    });
  }, [client]);

  const redoLast = useCallback(() => {
    const op = redo.current.pop();
    if (op) commit(op);
  }, [commit]);

  const clear = useCallback(() => { if (opts.isTeacher) client.send("board.clear"); setOps([]); }, [client, opts.isTeacher]);
  const setLock = useCallback((v: boolean) => { if (opts.isTeacher) client.send("board.lock", { locked: v }); }, [client, opts.isTeacher]);
  const grant = useCallback((userId: string, granted: boolean) =>
    client.send("board.lock", { locked, grant_user: userId, granted }), [client, locked]);
  const sendLaser = useCallback((x: number, y: number) => client.send("board.op", { kind: "laser", at: { x, y } }), [client]);

  const exportPng = useCallback((canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `whiteboard-${Date.now()}.png`; a.click();
  }, []);

  return {
    ops, locked, tool, color, width, vp, laser, canDraw,
    setTool, setColor, setWidth, setVp,
    commit, undo, redoLast, clear, setLock, grant, sendLaser, exportPng, newId: uid,
  };
}

function applyRemote(cur: BoardOp[], op: any): BoardOp[] {
  if (op.kind === "undo") return cur.filter((o: any) => o.id !== op.target);
  if (op.kind === "clear") return [];
  return [...cur, op];
}
