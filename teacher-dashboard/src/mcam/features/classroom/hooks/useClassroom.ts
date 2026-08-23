/** REST actions for the live classroom lifecycle (create/join/admit/lock/end).
 *  Pairs with useRealtime for the live channel. */
import { useCallback, useState } from "react";

type Role = "teacher" | "student" | "parent" | "observer";

export interface Participant {
  user_id: string; display_name: string; role: Role; admitted: boolean;
  hand_raised: boolean; mic_on: boolean; cam_on: boolean; sharing: boolean;
}
export interface Roster {
  session_id: string; state: "open" | "locked" | "ended";
  participants: Participant[]; waiting: Participant[];
}

export function useClassroom(apiBase: string, token: string, sessionId: string) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [waitingForAdmit, setWaitingForAdmit] = useState(false);

  const call = useCallback(
    async (path: string, body?: unknown) => {
      const res = await fetch(`${apiBase}/v1/classrooms/${sessionId}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json())?.title ?? res.statusText);
      return res.json();
    },
    [apiBase, sessionId, token],
  );

  const join = useCallback(
    async (displayName: string, role: Role) => {
      const r = await call("/join", { display_name: displayName, role });
      setWaitingForAdmit(!r.admitted);
      return r;
    },
    [call],
  );

  const refreshRoster = useCallback(async () => setRoster(await call("/roster")), [call]);
  const admit = useCallback(async (id: string) => setRoster(await call("/admit", { target_user_id: id })), [call]);
  const remove = useCallback(async (id: string) => setRoster(await call("/remove", { target_user_id: id })), [call]);
  const lock = useCallback(async () => setRoster(await call("/lock", {})), [call]);
  const unlock = useCallback(async () => setRoster(await call("/unlock", {})), [call]);
  const leave = useCallback(async () => setRoster(await call("/leave", {})), [call]);
  const end = useCallback(async () => setRoster(await call("/end", {})), [call]);

  return { roster, waitingForAdmit, join, refreshRoster, admit, remove, lock, unlock, leave, end };
}
