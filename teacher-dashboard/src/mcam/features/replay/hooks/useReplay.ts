/** Loads a session's recording metadata (chapters/moments/summary/homework/
 *  bookmarks) and supports keyword search + adding bookmarks. */
import { useCallback, useEffect, useState } from "react";

export interface Chapter { title: string; start: number }
export interface Moment { at: number; kind: string; note: string }
export interface Bookmark { id: string; label: string; at_s: number; favorite: boolean; author_id: string }
export interface Recording {
  id: string; session_id: string; output_key: string; duration_s: number;
  chapters: Chapter[]; moments: Moment[]; summary: string[]; homework: string[]; bookmarks: Bookmark[];
}

export function useReplay(apiBase: string, token: string, sessionId: string) {
  const [rec, setRec] = useState<Recording | null>(null);

  const api = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const res = await fetch(`${apiBase}/v1/replay${path}`, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error("replay request failed");
    return res.json();
  }, [apiBase, token]);

  useEffect(() => { api(`/sessions/${sessionId}`).then(setRec).catch(() => setRec(null)); }, [api, sessionId]);

  const addBookmark = useCallback(async (label: string, at_s: number) => {
    if (!rec) return;
    const bm = await api(`/${rec.id}/bookmarks`, "POST", { label, at_s, favorite: false });
    setRec((r) => (r ? { ...r, bookmarks: [...r.bookmarks, bm] } : r));
  }, [api, rec]);

  return { rec, addBookmark };
}
