# Andrew's To-Do — Backend / Data / Model

You own: Supabase, FastAPI hub, `agent-py`, Moss indexing, SIP outbound calling.
You don't touch: `frontend/`. See [HACKATHON_PLAN.md](HACKATHON_PLAN.md) + [ARCHITECTURE.md](ARCHITECTURE.md).

## Phase 1 — Foundation
- [x] ~~Supabase project + schema + seed (5 companies, 15 leads)~~ — done by Paul; get the URL + service key from him into `backend/.env`
- [ ] Confirm agent speaks in browser (`pnpm agent:py:console`) — already working
- [ ] Confirm Moss indexes exist (`pnpm moss:index`)
- [ ] Enable CORS in FastAPI for `http://localhost:3000` (the frontend calls you directly)

## Phase 2 — FastAPI hub
- [ ] `backend/src/main.py`: FastAPI app + Supabase client + Moss client
- [ ] Shared helper: `upsert lead/company → index lead doc into Moss "leads" → dispatch agent`
- [ ] `POST /triggers/new-signup` (UC1) — body = `TriggerNewSignup`
- [ ] `POST /triggers/estimate-completed` (UC2) — body = `TriggerEstimateCompleted` (set `savings_total`)
- [ ] `GET /leads` and `GET /leads/:id` (return `LeadWithCompany`)
- [ ] Dispatch via `agent_dispatch.create_dispatch(agent_name="agent-py", room=<new>, metadata=json)`; store `room_name` on the lead
- [ ] Prove the path in-browser first (no SIP): trigger → agent joins with right `lead_id`/`use_case`

## Phase 3 — Real phone calls (LiveKit SIP + Twilio)
- [ ] Twilio: create account, buy a number, create an Elastic SIP trunk; capture termination URI (`<name>.pstn.twilio.com`) + SIP creds; **verify demo phone numbers** (trial accounts only dial verified numbers)
- [ ] Register the Twilio trunk with LiveKit: `lk sip outbound create` (pass `<name>.pstn.twilio.com` address + Twilio number)
- [ ] Get trunk id: `lk sip outbound list` → `ST_xxxx`; add `SIP_OUTBOUND_TRUNK_ID` + `SIP_AUTH_USERNAME`/`SIP_AUTH_PASSWORD` to `agent-py/.env.local`
- [ ] `agent-py/src/agent.py`: read `phone_number` from `ctx.job.metadata`
- [ ] After `ctx.connect()`: `ctx.api.sip.create_sip_participant(CreateSIPParticipantRequest(room_name=ctx.room.name, sip_trunk_id=..., sip_call_to=phone_number, participant_identity=phone_number, wait_until_answered=True))`
- [ ] `await ctx.wait_for_participant(identity=phone_number)` before the opening line
- [ ] Handle `TwirpError` (busy/no-answer/trunk fail) → log `no_answer` + `ctx.shutdown()`
- [ ] `POST /calls/trigger` — manual "Call Now" by `lead_id`
- [ ] Test: website form → real phone rings → correct UC1/UC2 script
- [ ] Reference: `livekit-examples/outbound-caller-python`

## Phase 4 — Outcomes
- [ ] Wire `book_meeting` → set lead `booked` in Supabase
- [ ] Wire `log_outcome` → set `status` + `outcome_notes` in Supabase
- [ ] `POST /calls/outcome` if the dashboard also needs to write outcomes

## Stretch
- [ ] Qwen TTS custom voice (only if ahead of schedule)
- [ ] Answering-machine detection / mid-call disconnect handling

**Checkpoints**: P1 agent speaks · P2 trigger → dispatch · P3 real phone rings · P4 outcome in Supabase
