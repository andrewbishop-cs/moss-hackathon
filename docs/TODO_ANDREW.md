# Andrew's To-Do — Backend / Data / Model

You own: Supabase, FastAPI hub, `agent-py`, Moss indexing, SIP outbound calling.
You don't touch: `frontend/`. See [HACKATHON_PLAN.md](HACKATHON_PLAN.md) + [ARCHITECTURE.md](ARCHITECTURE.md).

## Phase 1 — Foundation  ✅ DONE
- [x] ~~Supabase project + schema + seed (5 companies, 15 leads)~~ — done by Paul; URL + service key in `backend/.env`
- [x] Confirm agent speaks in browser (`pnpm agent:py:console`) — verified
- [x] Confirm Moss indexes exist — verified live: `knowledge` (9 docs) + `leads` ready. NOTE: project has a hard **3-index cap**; deleted a stale `memory` index to free a slot. Re-running `pnpm moss:index` will 429 since `create_index` only makes *new* indexes — delete-then-recreate (or `add_docs(upsert=True)`) to refresh.
- [x] Enable CORS in FastAPI for `http://localhost:3000` — done (`CORSMiddleware` in `main.py`)

## Phase 2 — FastAPI hub  ✅ DONE
- [x] `backend/src/main.py` + `config.py`/`db.py`/`moss_index.py`/`calls.py` (FastAPI + Supabase + Moss clients)
- [x] Shared helper `calls.start_call()`: `upsert lead/company → index lead doc into Moss "leads" → dispatch agent`
- [x] `POST /triggers/new-signup` (UC1) — body = `TriggerNewSignup`
- [x] `POST /triggers/estimate-completed` (UC2) — body = `TriggerEstimateCompleted`
- [x] `POST /calls/trigger` (manual), `POST /calls/outcome`
- [x] `GET /leads` and `GET /leads/:id` (return `LeadWithCompany`) — verified against live Supabase (15 leads)
- [x] Fixed `Company` model 500 on `GET /leads`: nullable spend/savings columns now coerce `null → 0` via `field_validator` (`models.py`)
- [x] Dispatch via `agent_dispatch.create_dispatch(agent_name="agent-py", room=<new>, metadata={phone_number,lead_id,use_case})`; store `room_name` on the lead
- [x] Run: `pnpm dev:backend` (uvicorn :8000). Frontend `/dashboard` wired to it.
- [x] Verify a trigger actually lands a job on the running `agent-py` worker — **VERIFIED end-to-end** (dispatch → worker picked up job → real outbound call connected)

## Phase 3 — Real phone calls (LiveKit SIP + Twilio)  ✅ DONE
- [x] ~~Twilio Elastic SIP trunk + LiveKit outbound trunk~~ — done (`ST_RkZbHfV4vC87`, `beep-outbound.pstn.twilio.com`); test call connects via CLI
- [x] `SIP_OUTBOUND_TRUNK_ID` / `SIP_AUTH_USERNAME` / `SIP_AUTH_PASSWORD` in `agent-py/.env.local`
- [x] Twilio in TRIAL → only dials **verified** numbers; verified number used for the live demo call
- [x] `agent-py/src/agent.py`: read `phone_number` from `ctx.job.metadata`
- [x] After `ctx.connect()`: `ctx.api.sip.create_sip_participant(... wait_until_answered=True)`
- [x] `await ctx.wait_for_participant(identity=phone_number)` before the opening line
- [x] Handle `TwirpError` (busy/no-answer/trunk fail) → `ctx.shutdown()` (logs sip_status; does NOT yet write `no_answer` to Supabase — see Phase 4)
- [x] `POST /calls/trigger` — manual "Call Now" by `lead_id`
- [x] Test: real phone rings → correct UC2 script — **VERIFIED** (live call: UC2 savings hook, "is this a scam?" objection handled via knowledge, hung up → `declined` logged)
- [ ] Reference: `livekit-examples/outbound-caller-python`

## Phase 4 — Outcomes  ✅ DONE
> The agent now persists outcomes via the FastAPI hub (`post_call_outcome` → `POST /calls/outcome` → `db.set_outcome`), so it never touches Supabase directly. Best-effort: backend failures are logged + swallowed so a hiccup can't crash a live call. Skips the console/default lead (not a real row).
- [x] Wire `log_outcome` → POSTs `status` + `outcome_notes` to the hub (`agent.py`); unknown outcomes fall back to `called`
- [x] Wire `book_meeting` → POSTs `booked` to the hub
- [x] SIP dial failure (`TwirpError`) → POSTs `no_answer` before `ctx.shutdown()`
- [x] Expanded `LeadStatus` with `interested` + `callback` so agent outcomes map 1:1 (`models.py`)
- [x] `POST /calls/outcome` endpoint exists (dashboard write path) — present in `main.py`
- [x] **Heads-up for Paul:** dashboard badge styles for `interested` / `callback` — done (see [LEAD_DISPOSITIONS.md](LEAD_DISPOSITIONS.md), ping copy in [PING_ANDREW_DISPOSITIONS.md](PING_ANDREW_DISPOSITIONS.md))
- [ ] Add `disqualified`, `bad_data`, `reengage_90d` to `LeadStatus` in `models.py` + `VALID_OUTCOMES` in `agent.py` (dashboard already displays them; see Cat 5–7 in LEAD_DISPOSITIONS.md)
- [ ] Resolve AGENT_SCRIPT.md vs `models.py` drift — **resolved:** AGENT_SCRIPT now uses framework slugs; `not_qualified`/`not_eligible` → `disqualified`, `requested_human` → `interested`/`callback`
- [ ] Not yet verified end-to-end against a *live* call (code + models validated; needs a real call with backend running to confirm the row updates)

## Stretch
- [ ] Qwen TTS custom voice (only if ahead of schedule)
- [ ] Answering-machine detection / mid-call disconnect handling

**Checkpoints**: P1 agent speaks · P2 trigger → dispatch · P3 real phone rings · P4 outcome in Supabase
