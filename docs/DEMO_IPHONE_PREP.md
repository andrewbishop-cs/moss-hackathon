# iPhone Prep — Demo Day Checklist

Complete before the joint PSTN dry run. ~10 minutes.

## Verified in database

| Lead | Phone | Status |
|------|-------|--------|
| Michael Truell (whale) | `+19145598426` | pending |
| Alex Rivera (SMB) | `+19145598426` | pending |

Confirm this is your **Twilio-verified** E.164 number.

## Contacts + Favorites

- [ ] Add Twilio outbound caller ID to **Contacts** (name it "Pump Demo" or similar)
- [ ] Add that contact to **Favorites**

## Do Not Disturb (recommended for demo)

- [ ] **Turn DND OFF** for the 2-minute demo window (safest — don't rely on Favorites bypass under judge pressure)
- [ ] If keeping DND on: Focus → DND → **Allow Calls From: Favorites** + **Repeated Calls: ON**

## Hardware

- [ ] Ringer ON (not silent switch)
- [ ] Volume up
- [ ] Phone face-up on desk, unlocked or quick-unlock ready
- [ ] Speaker ready for judges to hear agent during whale call

## Test call (required before judges)

**Prerequisite:** `agent-py/.env.local` must include `SIP_OUTBOUND_TRUNK_ID` (ask Andrew if missing).

1. Run whale dry run: `./scripts/dry-run-tier-demo.sh --whale`
2. **Answer when phone rings** — confirm you hear the agent
3. Hang up after one exchange
4. Reset: `uv --directory backend run python -m src.reset`

## Demo window

- [ ] DND off before walking on stage
- [ ] Re-enable DND after demo if desired

## If phone doesn't ring

Use fallback lines from [DEMO_SCRIPT.md](DEMO_SCRIPT.md):

> "Call dispatched — you can see the live transcript and Moss context on the dashboard. PSTN is the same path; we're showing the agent side."
