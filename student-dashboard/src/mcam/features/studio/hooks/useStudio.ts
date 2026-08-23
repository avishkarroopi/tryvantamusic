/** Scene state + persistence against /v1/studio. Create/switch/duplicate/rename/
 *  delete/reorder scenes and patch the active scene's config (layout, sources,
 *  overlays, mixer). Autosaves config changes with a short debounce. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene, StudioConfig } from "../model";
import { emptyConfig } from "../model";

export function useStudio(apiBase: string, token: string, sessionId: string) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const saveTimer = useRef<number>(undefined);

  const api = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const res = await fetch(`${apiBase}/v1/studio${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json())?.title ?? res.statusText);
    return res.status === 200 ? res.json() : null;
  }, [apiBase, token]);

  const load = useCallback(async () => {
    const list: Scene[] = await api(`/${sessionId}/scenes`);
    setScenes(list);
    if (list.length && !activeId) setActiveId(list[0].id);
  }, [api, sessionId, activeId]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = scenes.find((s) => s.id === activeId) ?? null;

  const createScene = useCallback(async (name: string, kind: Scene["kind"]) => {
    const scene: Scene = await api(`/${sessionId}/scenes`, "POST",
      { name, kind, config: emptyConfig() });
    setScenes((s) => [...s, scene]); setActiveId(scene.id); return scene;
  }, [api, sessionId]);

  const duplicateScene = useCallback(async (id: string) => {
    const scene: Scene = await api(`/scenes/${id}/duplicate`, "POST");
    setScenes((s) => [...s, scene]); return scene;
  }, [api]);

  const renameScene = useCallback(async (id: string, name: string) => {
    const scene: Scene = await api(`/scenes/${id}/rename?name=${encodeURIComponent(name)}`, "PUT");
    setScenes((s) => s.map((x) => (x.id === id ? scene : x)));
  }, [api]);

  const deleteScene = useCallback(async (id: string) => {
    await api(`/scenes/${id}`, "DELETE");
    setScenes((s) => s.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(scenes.find((x) => x.id !== id)?.id ?? null);
  }, [api, activeId, scenes]);

  const reorderScene = useCallback(async (id: string, newIndex: number) => {
    const list: Scene[] = await api(`/${sessionId}/scenes/reorder`, "POST",
      { scene_id: id, new_index: newIndex });
    setScenes(list);
  }, [api, sessionId]);

  // patch active scene config locally + debounce-persist
  const patchConfig = useCallback((updater: (c: StudioConfig) => StudioConfig) => {
    setScenes((all) => all.map((s) => {
      if (s.id !== activeId) return s;
      const config = updater(s.config);
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        api(`/scenes/${s.id}/config`, "PUT", config).catch(() => {});
      }, 600);
      return { ...s, config };
    }));
  }, [activeId, api]);

  return {
    scenes, active, activeId, setActiveId,
    createScene, duplicateScene, renameScene, deleteScene, reorderScene, patchConfig, reload: load,
  };
}
