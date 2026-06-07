# Hackathon Execution Plan

## Time Budget: ~24 hours (June 6–7)
## Two Demo Targets: UC1 (new signup) + UC2 (estimate completed)
## Calls: real PSTN outbound via LiveKit SIP (Moss-provided number). Triggered both by the fake website AND a manual "Call Now" backend endpoint.

---

## How It Fits Together (read first)

The **FastAPI backend is the hub**. The fake Pump website and the dashboard only call
FastAPI REST endpoints — never LiveKit / Moss / Supabase directly. A "call" =
the backend dispatching the agent (`create_dispatch`) with metadata
`{ phone_number, lead_id, use_case }`. The agent worker picks up the job and dials the
real phone via a LiveKit SIP outbound trunk.

Local dev = three processes:
- `pnpm dev:frontend` — Next.js on `:3000` (fake website + dashboard)
- `uvicorn` — FastAPI on `:8000` (the hub)
- `pnpm dev:agent-py` — agent worker (connects to LiveKit Cloud)

Flow: website/dashboard → FastAPI → (upsert Supabase + index Moss + dispatch LiveKit) → agent dials phone.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the diagram and the dispatch-metadata contract.

---

## Division of Labor (so we don't step on each other)

| Who | Owns | Never touches |
|---|---|---|
| **Andrew** | Backend/data/model: Supabase schema + seed, FastAPI hub, agent.py (SIP dialing + tools), Moss indexing, SIP trunk | `frontend/` website + dashboard UI |
| **Paul** | Frontend: fake Pump website (UC1/UC2 flows), dashboard (queue, live call view, analytics) | `backend/`, `agent-py/`, Supabase schema |

**The seam (agree in first 30 min, then work independently):**
1. **REST contract** = Pydantic models in `backend/src/models.py` (`TriggerNewSignup`, `TriggerEstimateCompleted`, `LogOutcome`, `Lead`, `LeadWithCompany`, `Company`). Andrew owns, Paul consumes.
2. **Supabase schema** = ARCHITECTURE.md + seed SQL. Andrew owns.
3. **Dispatch metadata** = `{ phone_number, lead_id, use_case }`. Internal to Andrew.
4. **Live call view** = backend stores `room_name` on the lead; dashboard joins that LiveKit room read-only for transcript + `moss_context` (hook `frontend/hooks/useMossContextEvents.ts` already exists).

While Andrew builds the real endpoints, Paul codes the UI against fake JSON matching `models.py` — neither blocks the other.

---

## Phase 1 — Foundation (Hours 0–3)

**Andrew:**
- [ ] Supabase project + run `backend/seed/migrate_companies.sql` then `migrate_leads.sql`
- [ ] Load `backend/seed/seed_data.json` (5 companies, 15 leads)
- [ ] Confirm agent speaks in browser (`pnpm agent:py:console` already works)

**Paul:**
- [ ] Scaffold `frontend` routes: `/pump` (fake website) and `/dashboard`
- [ ] Stub UI against fake JSON shaped like `models.py` (no backend dependency yet)

**Checkpoint**: Agent speaks in browser; dashboard renders a stubbed lead queue.

---

## Phase 2 — Backend Hub + Website Flows (Hours 3–7)

**Andrew:**
- [ ] FastAPI app (`backend/src/main.py`) + Supabase client
- [ ] `POST /triggers/new-signup` (UC1) and `POST /triggers/estimate-completed` (UC2): upsert → index lead into Moss → dispatch agent
- [ ] `GET /leads`, `GET /leads/:id`
- [ ] Prove the dispatch path **in-browser first** (no SIP yet): trigger → agent joins a room with correct `lead_id`/`use_case`

**Paul:**
- [ ] UC1 signup form → `POST /triggers/new-signup`
- [ ] UC2 estimate calculator → shows savings → `POST /triggers/estimate-completed`
- [ ] Style the fake site to look like a real SaaS product

**Checkpoint**: Submit website form → lead appears in Supabase `pending` → agent dispatched.

---

## Phase 3 — Real Phone Calls + Dashboard (Hours 7–12)

**Andrew:**
- [ ] Create outbound SIP trunk from Moss number (`lk sip outbound create` → get `ST_xxxx` via `lk sip outbound list`); add to `agent-py/.env.local`
- [ ] Modify `agent-py/src/agent.py`: read `phone_number` from metadata → `ctx.api.sip.create_sip_participant(... wait_until_answered=True)` → `ctx.wait_for_participant(...)` before opening; handle `TwirpError` / `ctx.shutdown()` on no-answer
- [ ] `POST /calls/trigger` (manual "Call Now") + store `room_name` on the lead

**Paul:**
- [ ] Dashboard lead queue: name, company, UC1/UC2 badge, status, "Call Now" → `POST /calls/trigger`
- [ ] Live call view (`/dashboard/calls/[id]`): join LiveKit room read-only → render transcript + Moss context panel

**Checkpoint**: Website action OR "Call Now" → a real phone rings → agent runs correct script.

---

## Phase 4 — Outcomes + Polish (Hours 12–16)

**Andrew:**
- [ ] Wire `book_meeting` → status `booked`; `log_outcome` → status + `outcome_notes` in Supabase
- [ ] `POST /calls/outcome` if the dashboard needs to write outcomes too

**Paul:**
- [ ] Analytics (`/dashboard/analytics`): funnel triggered → called → booked
- [ ] Supabase realtime (or polling) so the dashboard updates live
- [ ] Demo polish (UC1/UC2 labels, lead context panel: spend, savings, similar company)

**Checkpoint**: Full UC2 flow end-to-end, outcome reflected on dashboard.

---

## Phase 5 — Demo Prep (Hours 16–22)

- [ ] Run full UC1 demo 3x cleanly
- [ ] Run full UC2 demo 3x cleanly
- [ ] Record fallback video of a clean run
- [ ] Make sure demo works on bad wifi
- [ ] Prep 2-min pitch (structure below)

### Pitch Structure (2 min)
1. **Problem** (20s): PLG companies lose 90% of visitors. These aren't cold leads — they just found $13K/month in savings and walked away. Nobody calls them.
2. **Demo UC2** (40s): estimate → real phone rings → live transcript → booked
3. **Demo UC1** (20s): signup → phone rings → social proof hook
4. **Why voice AI, why now** (15s): voice AI is finally good enough to do this at scale without an SDR team.
5. **Sponsor callouts** (15s): LiveKit (infra + STT/LLM/TTS Inference + SIP telephony), Moss (real-time memory), Qwen (voice, if wired)
6. **Market** (10s): every PLG company has this problem. First tool built for it.

---

## Fallback Plans

| Risk | Fallback |
|---|---|
| PSTN outbound / SIP trunk blocked | In-browser demo: a person joins the room as the lead. Dispatch path is identical minus `phone_number`. Don't burn >1 hour on SIP. |
| Dashboard room-join transcript fiddly | Agent persists transcript rows to Supabase; dashboard reads via realtime |
| Moss too slow to integrate | Pre-load lead context into the agent system prompt directly |
| Qwen voice bad / no time | Use LiveKit Inference TTS (default) |
| UC2 estimate calculator too complex | Hardcode the savings number for the demo |

---

## Winning Criteria

1. **It works live** — real phone call, real transcript, judges see it happen
2. **Two use cases** — shows product thinking, not just a hack
3. **Sponsor depth** — LiveKit (incl. SIP) + Moss deeply integrated
4. **Real problem** — every PLG company in the room has it
5. **Clean story** — problem → demo → market in 2 minutes flat
