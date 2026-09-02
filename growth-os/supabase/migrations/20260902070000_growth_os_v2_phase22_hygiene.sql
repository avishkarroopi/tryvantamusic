-- Growth OS v2 — Phase 22 security pass: least-privilege cleanup.
-- worker_heartbeats was granted INSERT/UPDATE to `authenticated` in
-- 20260902060000, but only ever got a SELECT RLS policy -- so those grants
-- were dead (RLS blocked them) rather than a real hole, but leaving unused
-- write permissions in place is still worth removing: only service_role
-- (the worker) ever writes this row.
REVOKE INSERT, UPDATE ON public.worker_heartbeats FROM authenticated;
