# Andrew Demo Session — Paul verified solo, needs you for PSTN

Paul ran everything possible alone. Copy-paste to Andrew:

---

Hey — ready for a joint PSTN dry run. Paul-side checks are green:

**Verified (Paul solo):**
- `./scripts/smoke-backend.sh` — 9/9 passed
- Backend `:8000`, frontend `:3000`, agent worker running (`agent.py dev`)
- Dashboard loads 20 real leads (Michael Truell visible)
- `/dashboard`, `/dashboard/analytics`, `/pump/estimate?lead_id=...`, live call page — all 200
- `POST /triggers/estimate-completed` dispatches agent + sets `calling` + `room_name`

**Blocked until we sync (need you + Paul in Supabase):**

1. **Reset stuck leads** — several seeds stuck on `calling` from earlier SIP tests:
   ```sql
   -- backend/seed/reset_demo_leads.sql
   ```

2. **Hero phone** — Michael Truell still on fake `+14155550101`. Paul runs:
   ```sql
   -- backend/seed/set_demo_phone.sql (replace with Paul's Twilio-verified E.164)
   UPDATE leads SET phone = '+1PAUL_VERIFIED' WHERE id = 'b1000000-0001-0000-0000-000000000001';
   ```

3. **`pnpm moss:index`** — after latest `knowledge.json` edits

4. **Cat 5–7 statuses** (optional for demo, not blocking): add `disqualified`, `bad_data`, `reengage_90d` to `models.py` + `VALID_OUTCOMES` — see [PING_ANDREW_DISPOSITIONS.md](PING_ANDREW_DISPOSITIONS.md)

**Joint dry run (15 min):**
1. Paul runs reset SQL + set phone SQL in Supabase
2. Paul iPhone DND prep ([DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md))
3. UC2: `/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001` → Get my plan
4. Watch `/dashboard` → `calling` → click row → live transcript
5. **Phone should ring** — answer, run script, confirm outcome badge updates
6. Optional UC1 signup on `/pump`

Full click path: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md)

---
