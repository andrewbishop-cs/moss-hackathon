# Demo Run-of-Show — Beep / Pump

**Target:** 2 minutes · UC2 first · Real PSTN to Paul's iPhone (DND on)

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

### Demo phone (Twilio verified)

Hero lead: **Michael Truell @ Cursor** — `b1000000-0001-0000-0000-000000000001`

Run in Supabase SQL editor (replace with your verified E.164):

```sql
UPDATE leads
SET phone = '+1YOUR_VERIFIED_NUMBER'
WHERE id = 'b1000000-0001-0000-0000-000000000001';
```

Also update [backend/seed/seed_data.json](backend/seed/seed_data.json) line 106 so re-seeds stay consistent.

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
| Problem | 20s | PLG companies lose 90% of visitors. These aren't cold leads — they just found $13K/mo in savings and walked away. Nobody calls them. |
| UC2 demo | 40s | See click path below |
| UC1 demo | 20s | Signup on Pump → phone rings → social proof hook |
| Why voice AI | 15s | Voice AI is finally good enough to do this at scale without an SDR team |
| Sponsors | 15s | **LiveKit** — SIP telephony + inference + real-time rooms. **Moss** — agent pulls playbook + lead context live. |
| Market | 10s | Every PLG company has this problem |

---

## UC2 click path (hero demo)

**Projector:** Dashboard already open at http://localhost:3000/dashboard

1. Narrate: "Lead ran an estimate on Pump but didn't convert"
2. Open http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001
3. Enter spend → **Get my plan** → "We'll call you shortly"
4. Point at dashboard — Michael Truell → status `calling`
5. Click row → `/dashboard/calls/[id]` — **live transcript + Moss panel**
6. **Phone rings** (or narrate transcript if DND silenced ring)
7. Optional: agent books meeting → status `booked` on analytics

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
