# Ping Andrew — Joint PSTN Dry Run (copy-paste)

Copy everything below the line into Slack/text:

---

Hey Andrew — Paul-side demo prep is done. Ready for a **30-min joint PSTN dry run** now.

**Done (Paul, just now):**
- Reset all 22 leads to `pending` via `python -m src.reset` (Alex, Sam, Michael unstuck)
- Tier demo commits pushed to `main` (tier badges, dry-run scripts, demo script)
- Hero phone confirmed: Michael + Alex → `+19145598426`
- Backend `:8000` + agent worker running

**Need from you:**
1. **`pnpm moss:index`** — after latest `knowledge.json` tier edits (DoorDash vs Mac Mini playbook)
2. **Restore `agent-py/.env.local`** on Paul's machine — agent logs show `SIP_OUTBOUND_TRUNK_ID is unset`; PSTN cannot ring without it (trunk id `ST_RkZbHfV4vC87` per TODO_ANDREW)
3. **Joint dry run** — whale hero call, answer on speaker, confirm outcome updates in dashboard

**Dry run steps (15 min):**
1. Three terminals: `pnpm dev:backend`, `pnpm dev:agent-py`, `pnpm dev:frontend`
2. Paul resets if needed: `uv --directory backend run python -m src.reset`
3. Open http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001 → **Get my plan**
4. Dashboard → Michael → `calling` → live call view → **phone should ring**
5. Answer, let agent run Mac Mini + senior AE offer, hang up → confirm status badge updates
6. Reset + repeat once more for confidence

Full click path: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md) · Script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

---
