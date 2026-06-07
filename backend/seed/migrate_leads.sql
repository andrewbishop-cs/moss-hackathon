-- Migrate the `leads` table to match backend/src/models.py
-- Safe to run while the table is empty: adds normalized name + timezone
-- columns and drops the leftover flat columns from the old single-table design.

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

-- Resulting columns:
--   id, company_id, first_name, last_name, email, phone, timezone,
--   use_case, status, created_at, called_at, outcome_notes
