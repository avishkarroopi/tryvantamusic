/** Lesson plan CRUD against /v1/lessons with debounced autosave. */
import { useCallback, useRef, useState } from "react";

export interface LessonPlan {
  id?: string; session_id: string; title: string; objectives: string[];
  homework: string; assignments: string[]; remarks: string; is_template: boolean;
}

export function emptyPlan(sessionId: string): LessonPlan {
  return { session_id: sessionId, title: "New Lesson", objectives: [], homework: "",
    assignments: [], remarks: "", is_template: false };
}

export function useLessonPlan(apiBase: string, token: string) {
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const timer = useRef<number>(undefined);

  const api = useCallback(async (path: string, method: string, body?: unknown) => {
    const res = await fetch(`${apiBase}/v1/lessons${path}`, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error("lesson request failed");
    return res.json();
  }, [apiBase, token]);

  const load = useCallback((p: LessonPlan) => setPlan(p), []);

  const patch = useCallback((updater: (p: LessonPlan) => LessonPlan) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        const saved = next.id
          ? await api(`/${next.id}`, "PUT", next)
          : await api("", "POST", next);
        setPlan((cur) => (cur ? { ...cur, id: saved.id } : cur));
      }, 700);
      return next;
    });
  }, [api]);

  return { plan, load, patch };
}
