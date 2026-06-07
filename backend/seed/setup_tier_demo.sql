-- Tier demo setup: Not qualified ($4K/mo) + SMB ($12K/mo) + Whale hero phones.
-- Run once in Supabase SQL editor, then reset_demo_leads.sql before each dry run.
-- Replace +1YOUR_VERIFIED_NUMBER with your Twilio-verified E.164.

INSERT INTO companies (
  id, name, company_size, cloud_provider,
  spend_aws, spend_gcp, spend_azure, spend_openai, spend_anthropic, spend_total,
  savings_aws, savings_gcp, savings_azure, savings_openai, savings_anthropic, savings_total,
  created_at
) VALUES
  (
    'a1b2c3d4-0006-0000-0000-000000000006',
    'Beacon Labs', '11-50', 'aws',
    12000, 0, 0, 0, 0, 12000,
    2760, 0, 0, 0, 0, 2760,
    '2026-06-01T10:25:00Z'
  ),
  (
    'a1b2c3d4-0007-0000-0000-000000000007',
    'Pinewood AI', '1-10', 'aws',
    4000, 0, 0, 0, 0, 4000,
    920, 0, 0, 0, 0, 920,
    '2026-06-01T10:30:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_size = EXCLUDED.company_size,
  cloud_provider = EXCLUDED.cloud_provider,
  spend_aws = EXCLUDED.spend_aws,
  spend_total = EXCLUDED.spend_total,
  savings_aws = EXCLUDED.savings_aws,
  savings_total = EXCLUDED.savings_total;

INSERT INTO leads (
  id, company_id, first_name, last_name, email, phone, timezone,
  use_case, status, created_at
) VALUES
  (
    'b1000000-0016-0000-0000-000000000016',
    'a1b2c3d4-0006-0000-0000-000000000006',
    'Alex', 'Rivera', 'alex@beaconlabs.io', '+19145598426',
    'America/New_York', 'uc2_estimate_completed', 'pending', '2026-06-05T19:00:00Z'
  ),
  (
    'b1000000-0017-0000-0000-000000000017',
    'a1b2c3d4-0007-0000-0000-000000000007',
    'Sam', 'Okonkwo', 'sam@pinewood.ai', '+14155550117',
    'America/Chicago', 'uc1_new_signup', 'pending', '2026-06-05T19:10:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  timezone = EXCLUDED.timezone,
  use_case = EXCLUDED.use_case;

-- Hero leads — same verified phone for live PSTN calls.
UPDATE leads
SET phone = '+19145598426'
WHERE id IN (
  'b1000000-0018-0000-0000-000000000018',
  'b1000000-0001-0000-0000-000000000001',
  'b1000000-0016-0000-0000-000000000016'
);
