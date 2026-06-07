-- Beehiiv whale demo lead (Tyler Denk, CEO) — $175K/mo spend, $20K/mo savings, Mac Mini tier.
-- Run once in Supabase SQL editor. Idempotent: safe to re-run.
-- Tyler sorts first in the queue (earliest created_at among demo leads).

INSERT INTO companies (
  id, name, company_size, cloud_provider,
  spend_aws, spend_gcp, spend_azure, spend_openai, spend_anthropic, spend_total,
  savings_aws, savings_gcp, savings_azure, savings_openai, savings_anthropic, savings_total,
  created_at
) VALUES (
  'a1b2c3d4-0008-0000-0000-000000000008',
  'Beehiiv', '51-200', 'aws',
  130000, 0, 0, 30000, 15000, 175000,
  14000, 0, 0, 4000, 2000, 20000,
  '2026-06-01T10:35:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_size = EXCLUDED.company_size,
  cloud_provider = EXCLUDED.cloud_provider,
  spend_aws = EXCLUDED.spend_aws,
  spend_gcp = EXCLUDED.spend_gcp,
  spend_azure = EXCLUDED.spend_azure,
  spend_openai = EXCLUDED.spend_openai,
  spend_anthropic = EXCLUDED.spend_anthropic,
  spend_total = EXCLUDED.spend_total,
  savings_aws = EXCLUDED.savings_aws,
  savings_gcp = EXCLUDED.savings_gcp,
  savings_azure = EXCLUDED.savings_azure,
  savings_openai = EXCLUDED.savings_openai,
  savings_anthropic = EXCLUDED.savings_anthropic,
  savings_total = EXCLUDED.savings_total;

INSERT INTO leads (
  id, company_id, first_name, last_name, email, phone, timezone,
  use_case, status, created_at
) VALUES (
  'b1000000-0018-0000-0000-000000000018',
  'a1b2c3d4-0008-0000-0000-000000000008',
  'Tyler', 'Denk', 'tyler@beehiiv.com', '+19145598426',
  'America/Los_Angeles', 'uc2_estimate_completed', 'pending', '2026-06-05T13:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  timezone = EXCLUDED.timezone,
  use_case = EXCLUDED.use_case,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at;
