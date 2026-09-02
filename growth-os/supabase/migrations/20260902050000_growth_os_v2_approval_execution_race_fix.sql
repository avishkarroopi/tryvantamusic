-- Growth OS v2 — fix: approval execution had a real race condition (found
-- during the Phase 22 security pass on my own Phase 6/7 code, before
-- either client had been used for anything real).
--
-- runApprovedMetaAction/runApprovedGoogleAdsAction read approval_requests,
-- checked status='approved', then later updated it to 'executed' -- with
-- nothing atomic in between. Two concurrent calls for the same approvalId
-- (a double-click on "Execute," or a UI action racing a worker retry)
-- could both pass the status check and both perform the real mutation --
-- exactly the "approval bypass/replay/race condition" class Phase 22 asks
-- to check for, and for a real-money action (ad spend/budget change) this
-- is a genuine, not theoretical, risk.
--
-- Fix: add an 'executing' status so claiming becomes a single atomic
-- UPDATE ... WHERE status='approved' (CAS, same pattern as the worker
-- scheduler's next_run_at claim) -- only the caller whose CAS actually
-- flips the row can proceed to call the real API.
ALTER TABLE public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_status_check;
ALTER TABLE public.approval_requests ADD CONSTRAINT approval_requests_status_check
  CHECK (status IN ('pending','approved','rejected','expired','executing','executed','execution_failed'));
