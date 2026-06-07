-- Reset stuck demo leads before a dry run (status left on `calling` from failed SIP tests).
-- Run in Supabase SQL editor, then set hero phone via set_demo_phone.sql.

UPDATE leads
SET
  status = 'pending',
  room_name = NULL,
  called_at = NULL,
  outcome_notes = NULL
WHERE status IN ('calling', 'called')
  AND id LIKE 'b1000000-%';
