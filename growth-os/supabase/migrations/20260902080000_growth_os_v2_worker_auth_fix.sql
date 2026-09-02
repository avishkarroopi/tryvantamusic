-- Growth OS v2 — fix a real regression I introduced myself.
--
-- 20260902070000's "least-privilege cleanup" revoked INSERT/UPDATE on
-- worker_heartbeats from `authenticated`, reasoning that only service_role
-- (the worker) would ever write it. That was correct under the ORIGINAL
-- plan -- but Lovable Cloud turned out to never expose a service_role key
-- at all (confirmed directly with Lovable, 2026-09-02), so the worker was
-- redesigned to authenticate as a real dedicated `authenticated` user
-- instead (growth-os-worker@<project>.internal, see growth-os-worker/db.ts).
-- That user genuinely needs to write this table now, and the revoke +
-- missing write policy silently broke its heartbeat sync the moment it
-- first ran for real (confirmed live: /health showed "healthy" with real
-- tick data, but worker_heartbeats was empty -- RLS was blocking the write).
GRANT INSERT, UPDATE ON public.worker_heartbeats TO authenticated;

CREATE POLICY "team write worker_heartbeats" ON public.worker_heartbeats FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update worker_heartbeats" ON public.worker_heartbeats FOR UPDATE TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
