# Demo Run-of-Show — Beep / Pump

**Target:** 2 minutes · UC2 first · Real PSTN to Paul's iPhone (DND on)

**Exact spoken words:** [DEMO_SCRIPT.md](DEMO_SCRIPT.md) · **Anthropic context brief:** [ANTHROPIC_DEMO_CONTEXT.md](ANTHROPIC_DEMO_CONTEXT.md)

## Before you start (5 min)

### Three terminals

```bash
pnpm dev:backend    # :8000
pnpm dev:agent-py   # agent worker
pnpm dev:frontend   # :3000
```

### Smoke check

```bash
./scripts/smoke-backend.sh
```

### Agent model files (first run or after fresh venv)

```bash
uv --directory agent-py run python src/agent.py download-files
```

### Moss index (after knowledge.json edits)

```bash
pnpm moss:index
```

### Tier demo dry-run (automated)

```bash
./scripts/dry-run-tier-demo.sh           # SMB + Whale
./scripts/dry-run-tier-demo.sh --whale   # Whale only (tight-time)
```

Log: [DEMO_DRY_RUN_LOG.md](DEMO_DRY_RUN_LOG.md)

### Tier demo data (Supabase)

Run once in Supabase SQL editor (creates SMB + Not Qualified leads, sets hero phones):

```sql
-- backend/seed/setup_tier_demo.sql — replace +1YOUR_VERIFIED_NUMBER first
```

Before each dry run:

```sql
-- backend/seed/reset_demo_leads.sql
```

**Queue personas** (Tier column on dashboard):

| Lead | Company | Tier | Live call? |
|------|---------|------|------------|
| Sam Okonkwo `b1000000-0017-...` | Pinewood AI ($4K/mo) | Not qualified | No — narrate from queue |
| Alex Rivera `b1000000-0016-...` | Beacon Labs ($12K/mo) | SMB · DoorDash | Yes — Call 1 |
| Michael Truell `b1000000-0001-...` | Cursor ($8.5M/mo) | Whale · Mac Mini | Yes — Call 2 |

Also keep [backend/seed/seed_data.json](backend/seed/seed_data.json) in sync when you change phones.

### iPhone + Do Not Disturb

1. Add Twilio outbound caller ID to **Contacts + Favorites**
2. Focus → DND → **Allow Calls From: Favorites** · **Repeated Calls: ON**
3. Ringer on, volume up, phone face-up on desk
4. **Test one call with DND on** before judges
5. For live demo: **turn DND off for 2 minutes** (safest), re-enable after

---

## Pitch (2 min)

| Segment | Time | Script |
|---------|------|--------|
| Problem | 15s | PLG companies lose 90% of visitors. These aren't cold leads — they found savings and walked away. Nobody calls them. |
| Tier queue | 10s | Dashboard: **Not qualified** / **SMB · DoorDash** / **Whale · Mac Mini** — qualifies on $5K/mo minimum, offer scales above that |
| UC2 demo | 40s | See tier click path below (SMB + Whale calls) |
| UC1 demo | 15s | Optional: Pinewood signup row — under $5K/mo threshold |
| Why voice AI | 15s | Voice AI is finally good enough to do this at scale without an SDR team |
| Sponsors | 15s | **LiveKit** — SIP telephony + inference + real-time rooms. **Moss** — agent pulls playbook + lead context live. |
| Market | 10s | Every PLG company has this problem |

---

## Tier demo click path

**Projector:** Dashboard already open at http://localhost:3000/dashboard

### Queue beat (~10s)

1. Point at three rows: **Sam Okonkwo · Not qualified** (under $5K/mo), **Alex Rivera · SMB · DoorDash**, **Michael Truell · Whale · Mac Mini**

### Call 1 — SMB (~25s)

1. Open http://localhost:3000/pump/estimate?lead_id=b1000000-0016-0000-0000-000000000016
2. **Get my plan** → dashboard shows Alex → `calling`
3. Live view → agent offers **$20 DoorDash credit**
4. Run `reset_demo_leads.sql` if needed before call 2

### Call 2 — Whale (~35s)

1. Open http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001
2. **Get my plan** → Michael Truell → `calling`
3. Live view → agent offers **Mac Mini + senior AE**
4. Optional: agent books meeting → status `booked` on analytics

**Tight on time?** Skip Call 1 live — narrate Alex from the queue; keep Whale as the hero PSTN call.

---

## UC1 click path (secondary)

1. http://localhost:3000/pump → signup form
2. Use **verified phone number**
3. Submit → new lead in queue with **UC1 · New signup** badge (violet)
4. Call from queue or wait for auto-trigger

---

## Fallbacks

| Issue | Fix |
|-------|-----|
| No ring (DND) | Toggle DND off 60s · narrate from dashboard transcript |
| Agent worker down | `pnpm dev:agent-py` |
| Backend down | `pnpm dev:backend` |
| SIP fails | Andrew: in-browser room join (same dispatch path) |

---

## After demo prep (Andrew)

```bash
pnpm moss:index   # after knowledge.json edits
```

Ping Andrew when [agent-py/knowledge.json](../agent-py/knowledge.json) changes.

**Solo progress + joint session handoff:** [ANDREW_DEMO_SESSION.md](ANDREW_DEMO_SESSION.md)
