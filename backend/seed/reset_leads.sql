-- Reset all leads to a clean pre-demo state.
-- Run in the Supabase SQL editor (or it runs automatically on `pnpm dev` via
-- `python -m src.reset`, which performs the same update through supabase-py).
-- Sets every lead back to `pending` and clears the transient call fields (room,
-- timestamps, outcome) so the dashboard, queue, and analytics start fresh.
-- Use-case (UC1/UC2) and contact info are preserved.
--
-- Tip: to only un-stick leads mid-call instead of resetting everyone, add a
--      WHERE clause, e.g.  WHERE status IN ('calling', 'called');

UPDATE leads
SET status        = 'pending',
    room_name     = NULL,
    called_at     = NULL,
    outcome_notes = NULL;

-- NOTE: call history + transcripts (the `calls` table) are intentionally left
-- intact so they persist across demo runs. To wipe them, run: DELETE FROM calls;

-- Sanity check — every row should report status = pending.
SELECT status, count(*) AS leads
FROM leads
GROUP BY status
ORDER BY status;
