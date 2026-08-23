/**
 * Batch/Session <-> M-CAM classroom mapping.
 *
 * M-CAM's classroom registry (`ClassroomRegistry` in
 * `mcam-backend/app/features/classroom/service.py`) is keyed by an opaque
 * `session_id` string it never generates itself — the caller picks it. That
 * makes the mapping trivial and stable: we derive the M-CAM session id
 * directly from the Dashboard's own Batch id, so "Start Live Classroom" on a
 * given batch always resolves to the same classroom (create-if-missing,
 * rejoin otherwise) instead of minting a new one every time.
 */
import { MCAM_API_BASE } from "./config";

export function mcamSessionIdForBatch(batchId: string): string {
  return `batch-${batchId}`;
}

/**
 * Idempotently ensures the classroom is live: creates it if this is the
 * first teacher to open it, and treats "already live" (409 Conflict) as
 * success rather than an error — both are legitimate real-world outcomes of
 * two teacher tabs or a page refresh, not failures.
 */
export async function ensureClassroomLive(token: string, sessionId: string, requireWaitingRoom = false): Promise<void> {
  const res = await fetch(`${MCAM_API_BASE}/v1/classrooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId, require_waiting_room: requireWaitingRoom }),
  });
  if (res.ok || res.status === 409) return;
  const body = await res.json().catch(() => ({}));
  throw new Error(body?.title ?? `Could not start classroom (${res.status})`);
}
