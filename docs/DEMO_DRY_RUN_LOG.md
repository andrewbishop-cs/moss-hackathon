# Tier Demo Dry-Run Log

Automated path: `./scripts/dry-run-tier-demo.sh`  
Spoken script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

---

## 2026-06-06 — Automated dispatch dry-run

### Prerequisites verified

| Check | Result |
|-------|--------|
| `./scripts/smoke-backend.sh` | 9/9 passed |
| Backend `:8000` | Up |
| Frontend `:3000` | Up |
| Tier demo leads in queue | Sam (pending), Alex (was `calling`), Michael (pending) |
| Hero phone (Michael + Alex) | `+19145598426` |

### Call 1 — SMB (Alex Rivera)

- **Trigger:** `POST /triggers/estimate-completed` · `lead_id=b1000000-0016` · `savings_total=2760`
- **Result:** `status=calling` · `room_name=call-b1000000-1780810506`
- **Live view:** http://localhost:3000/dashboard/calls/b1000000-0016-0000-0000-000000000016 (HTTP 200)
- **Expected agent offer:** $20 DoorDash credit · ~$33K/year savings hook

### Call 2 — Whale (Michael Truell) — hero

- **Trigger:** `POST /triggers/estimate-completed` · `lead_id=b1000000-0001` · `savings_total=1583000`
- **Result:** `status=calling` · `room_name=call-b1000000-1780810512`
- **Live view:** http://localhost:3000/dashboard/calls/b1000000-0001-0000-0000-000000000001 (HTTP 200)
- **Expected agent offer:** Mac Mini + senior AE · ~$19M/year savings hook
- **PSTN:** Phone `+19145598426` — agent worker must be running for ring + live transcript

### Manual steps still required before judge demo

1. Run `backend/seed/reset_demo_leads.sql` in Supabase (both leads now stuck on `calling`)
2. Confirm `pnpm dev:agent-py` is running
3. iPhone: DND off for demo window, Twilio caller ID in Favorites
4. Answer Whale call on speaker for judges

### Tight-time variant

```bash
./scripts/dry-run-tier-demo.sh --whale
```

Skips SMB live trigger; narrate Alex from dashboard queue per [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
