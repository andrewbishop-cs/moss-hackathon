-- Create the `companies` table to match the Company model in backend/src/models.py.
-- Run this BEFORE migrate_leads.sql, since leads.company_id references companies(id).
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS companies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  company_size      text,           -- '1-10', '11-50', '51-200', '201-500', '500+'
  cloud_provider    text,           -- 'aws' | 'gcp' | 'azure'
  spend_aws         numeric NOT NULL DEFAULT 0,
  spend_gcp         numeric NOT NULL DEFAULT 0,
  spend_azure       numeric NOT NULL DEFAULT 0,
  spend_openai      numeric NOT NULL DEFAULT 0,
  spend_anthropic   numeric NOT NULL DEFAULT 0,
  spend_total       numeric NOT NULL DEFAULT 0,
  savings_aws       numeric NOT NULL DEFAULT 0,
  savings_gcp       numeric NOT NULL DEFAULT 0,
  savings_azure     numeric NOT NULL DEFAULT 0,
  savings_openai    numeric NOT NULL DEFAULT 0,
  savings_anthropic numeric NOT NULL DEFAULT 0,
  savings_total     numeric NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);
