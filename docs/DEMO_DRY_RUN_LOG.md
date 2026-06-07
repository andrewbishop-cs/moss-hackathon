# Tier Demo Dry-Run Log

Automated path: `./scripts/dry-run-tier-demo.sh`  
Spoken script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

---

## 2026-06-07 — Hour 10+ demo prep plan execution

### Completed

| Check | Result |
|-------|--------|
| SIP env restored | `SIP_OUTBOUND_TRUNK_ID=ST_RkZbHfV4vC87` added to `agent-py/.env.local` |
| Agent worker restarted | Picks up new SIP config |
| `pnpm demo:check` | 6 passed, 0 failed (3 manual iPhone warnings) |
| SMB dispatch | `status=calling` · Alex · room assigned |
| Whale dispatch | `status=calling` · Michael · room assigned |
| PSTN participant joined | Agent log: `participant=+19145598426` · Moss loaded · LLM started |
| Demo prep scripts | `demo-prep-check.sh`, `pitch-rehearsal.sh`, `fallback-video-prep.sh`, `pitch-rehearsal-batch.sh` |
| pnpm shortcuts | `demo:check`, `demo:dry-run`, `demo:fallback-prep`, `demo:pitch`, `demo:pitch:batch` |

### Manual steps still required (Paul)

| Step | Detail |
|------|--------|
| Answer phone during dry run | Confirm audio + agent script on speaker |
| iPhone prep | [DEMO_IPHONE_PREP.md](DEMO_IPHONE_PREP.md) — Contacts, Favorites, DND, ringer |
| Record fallback video | [FALLBACK_VIDEO.md](FALLBACK_VIDEO.md) — run `pnpm demo:fallback-prep` then Cmd+Shift+5 |
| Spoken pitch × 3 | [PITCH_REHEARSAL_LOG.md](PITCH_REHEARSAL_LOG.md) — use `pnpm demo:pitch` |

### Resolved blockers

| Issue | Resolution |
|-------|------------|
| SIP env missing | Trunk ID added; agent successfully dials PSTN |
| Hour-9 PSTN blocked | Fixed — participant joins room within ~15s of dispatch |

---

## 2026-06-07 — Hour 9 plan execution (automated + blocked items)

### Completed

| Check | Result |
|-------|--------|
| Reset all leads | 22 rows → `pending` via `python -m src.reset` |
| Tier commits pushed | `main` synced to origin |
| Smoke check | 9/9 passed |
| Turn detector models | Downloaded via `uv run python src/agent.py download-files` (fixes prior job crashes) |
| Whale dispatch #1 | `status=calling` · `room=call-b1000000-1780812715` · live view HTTP 200 |
| Whale dispatch #2 | `status=calling` · `room=call-b1000000-1780812945` · agent joined (no crash) |

### Blockers found (need Andrew + Paul)

| Issue | Detail |
|-------|--------|
| **SIP env missing** | `agent-py/.env.local` not present on Paul's machine. Agent log: `SIP_OUTBOUND_TRUNK_ID is unset; cannot dial`. Phone will not ring until Andrew shares/restores `.env.local`. |
| **PSTN answer** | Automated dry runs cannot confirm ring/transcript/outcome — Paul must answer phone during joint session. |
| **Outcome stuck on `calling`** | After no-answer SIP failure, `outcome_notes` set but status may remain `calling` — verify with Andrew on live answered call. |

### Next steps

1. Andrew restores `agent-py/.env.local` (SIP + LiveKit + Moss creds)
2. Restart agent worker: `pnpm dev:agent-py`
3. Paul completes [DEMO_IPHONE_PREP.md](DEMO_IPHONE_PREP.md) checklist
4. Joint dry run × 2 with phone answered — see [PING_ANDREW_DEMO.md](PING_ANDREW_DEMO.md)
5. Record fallback video per [FALLBACK_VIDEO.md](FALLBACK_VIDEO.md) after first clean run

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
