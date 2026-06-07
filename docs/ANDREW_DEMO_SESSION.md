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

**Done (Paul, hour 9):**
- Reset all leads to `pending` (`uv --directory backend run python -m src.reset` — 22 rows)
- Hero phone set: Michael + Alex → `+19145598426`
- Tier demo commits pushed to `main`

**Still need Andrew:**

1. **`pnpm moss:index`** — after latest `knowledge.json` tier edits

2. **Joint PSTN dry run** — see [PING_ANDREW_DEMO.md](PING_ANDREW_DEMO.md) for copy-paste ping

3. **Cat 5–7 statuses** (optional for demo, not blocking): see [PING_ANDREW_DISPOSITIONS.md](PING_ANDREW_DISPOSITIONS.md)

**Joint dry run (15 min):**
1. Paul runs reset SQL + set phone SQL in Supabase
2. Paul iPhone DND prep ([DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md))
3. UC2: `/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001` → Get my plan
4. Watch `/dashboard` → `calling` → click row → live transcript
5. **Phone should ring** — answer, run script, confirm outcome badge updates
6. Optional UC1 signup on `/pump`

Full click path: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md)

---
