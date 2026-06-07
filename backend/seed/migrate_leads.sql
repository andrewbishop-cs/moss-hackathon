-- Migrate the `leads` table to match backend/src/models.py
-- Safe to run while the table is empty: adds normalized name + timezone
-- columns and drops the leftover flat columns from the old single-table design.
-- Run migrate_companies.sql FIRST so the company_id foreign key can resolve.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text,
  ADD COLUMN IF NOT EXISTS timezone   text;

ALTER TABLE leads
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS company_size,
  DROP COLUMN IF EXISTS aws_spend,
  DROP COLUMN IF EXISTS savings_estimate,
  DROP COLUMN IF EXISTS similar_company,
  DROP COLUMN IF EXISTS similar_savings;

-- Reflect the Lead.company_id -> Company relationship from models.py.
-- Drop-then-add keeps this idempotent across re-runs.
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_company_id_fkey;

ALTER TABLE leads
  ADD CONSTRAINT leads_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- Resulting columns:
--   id, company_id, first_name, last_name, email, phone, timezone,
--   use_case, status, created_at, called_at, outcome_notes, room_name
-- Call history + transcripts live in the `calls` table (migrate_calls.sql).
