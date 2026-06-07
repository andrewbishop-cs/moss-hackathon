# Demo Bookmarks — Quick Click Path

Bookmark these in your browser before rehearsing [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Primary tabs (keep open on projector)

| Tab | URL | Purpose |
|-----|-----|---------|
| **Dashboard** | http://localhost:3000/dashboard | Queue intro + live status updates |
| **Whale estimate** | http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001 | Hero call trigger (Michael Truell) |
| **SMB estimate** | http://localhost:3000/pump/estimate?lead_id=b1000000-0016-0000-0000-000000000016 | Call 1 (Alex Rivera · optional) |
| **Analytics** | http://localhost:3000/dashboard/analytics | Optional: show `booked` after whale call |

## Live call views (open after trigger)

| Lead | URL |
|------|-----|
| Alex (SMB) | http://localhost:3000/dashboard/calls/b1000000-0016-0000-0000-000000000016 |
| Michael (Whale) | http://localhost:3000/dashboard/calls/b1000000-0001-0000-0000-000000000001 |

## UC1 (optional gesture)

| Tab | URL |
|-----|-----|
| Pump signup | http://localhost:3000/pump |

## Rehearsal script (read aloud while clicking)

### Full version (~2 min)

1. **Dashboard** — Problem + tier queue (Sam / Alex / Michael)
2. **SMB estimate** → Get my plan → **Dashboard** (Alex → `calling`) → **Alex live view**
3. Reset if needed: `uv --directory backend run python -m src.reset`
4. **Whale estimate** → Get my plan → **Dashboard** (Michael → `calling`) → **Michael live view** → answer phone
5. **Dashboard** — UC1 gesture at Sam's row (no live call)
6. Why voice AI + sponsor callouts

### Tight-time variant (~1:15)

1. **Dashboard** — tier queue in one breath
2. Skip SMB live — narrate Alex from queue
3. **Whale estimate** → Get my plan → **Michael live view** → answer phone
4. Combined why + sponsors line

## Reset between dry runs

```bash
uv --directory backend run python -m src.reset
```

Or in Supabase: `backend/seed/reset_demo_leads.sql`

## Emergency re-trigger (whale only)

```bash
./scripts/dry-run-tier-demo.sh --whale
```
