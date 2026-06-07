-- Create the `calls` table: one row per call attempt (a fresh "Call Now" or a
-- use-case trigger, plus any auto-retry it spawns). This is the source of truth
-- for call history and transcripts; the `leads` row only keeps a denormalized
-- snapshot of the LATEST call (status, room_name, outcome_notes) for the table view.
--
-- Run migrate_companies.sql + migrate_leads.sql first (this references leads.id).
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS calls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES leads(id),
  -- LiveKit room for this attempt ("call-<id>-<ts>"); unique per dispatch, so the
  -- agent's outcome + transcript writes correlate back to this row by room_name.
  room_name     text NOT NULL,
  use_case      text,
  is_retry      boolean NOT NULL DEFAULT false,
  -- Disposition of THIS attempt. Starts 'calling'; set when the agent reports out.
  status        text NOT NULL DEFAULT 'calling',
  outcome_notes text,
  -- Full LiveKit session.history.to_dict() payload, written at call end.
  transcript    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  ended_at      timestamptz
);

CREATE INDEX IF NOT EXISTS calls_lead_id_idx   ON calls (lead_id);
CREATE INDEX IF NOT EXISTS calls_room_name_idx ON calls (room_name);
