# Architecture

## High-Level Flow

The **FastAPI backend is the hub**. The fake website and the dashboard never talk to
LiveKit / Moss / Supabase directly — they only call FastAPI REST endpoints. A "call"
is the backend dispatching the agent with metadata; the agent itself dials the phone
over a LiveKit SIP outbound trunk.

```
[Fake Pump Website]            [Dashboard]
   │ POST /triggers/*             │ POST /calls/trigger ("Call Now")
   │ (UC1 signup / UC2 estimate)  │ GET /leads
   ▼                              ▼
[FastAPI backend] ─── upsert company + lead ──▶ [Supabase]
   │            └──── index lead document ─────▶ [Moss "leads" index]
   │
   │  create_dispatch(agent_name="agent-py",
   │     metadata={ phone_number, lead_id, use_case })
   ▼
[LiveKit Cloud] ── job ──▶ [agent-py worker]
                              │  - create_sip_participant via OUTBOUND TRUNK → real phone rings
                              │  - LiveKit Inference STT + LLM + TTS (managed, no provider keys)
                              │  - get_lead_context → Moss (per-lead, <10ms)
                              │  - runs UC1 or UC2 script (from use_case)
                              │  - book_meeting / log_outcome → Supabase
                              ▼
                           [Lead's phone]

[Dashboard live call view] ── joins the LiveKit room read-only ──▶ transcript + moss_context panel
```

Local dev = three processes: Next.js (`pnpm dev:frontend`, `:3000`), FastAPI
(`uvicorn`, `:8000`), and the agent worker (`pnpm dev:agent-py`, connects to LiveKit
Cloud). Website/dashboard → FastAPI → (Supabase + Moss + LiveKit dispatch) → agent dials.

---

## Components

### 1. Fake Pump Website (Next.js)

Two interactive flows that trigger calls:

**UC1 flow**: Simple signup form (first/last name, email, phone, company, cloud provider)

- On submit → `POST /triggers/new-signup`
- Shows "Account created! You'll hear from us shortly."

**UC2 flow**: Savings estimate tool

- Inputs: monthly cloud spend (AWS/GCP/Azure) + AI spend (OpenAI/Anthropic)
- Shows a result: "You could save **$13,240/month**"
- On result shown → `POST /triggers/estimate-completed`
- Shows "Your estimate is ready. We'll call you shortly."

---

### 2. Supabase Schema

**`companies` table**

```sql
id                uuid         primary key default gen_random_uuid()
name              text         not null
company_size      text         -- '1-10', '11-50', '51-200', '201-500', '500+'
cloud_provider    text         -- 'aws' | 'gcp' | 'azure'
spend_aws         numeric      not null default 0
spend_gcp         numeric      not null default 0
spend_azure       numeric      not null default 0
spend_openai      numeric      not null default 0
spend_anthropic   numeric      not null default 0
spend_total       numeric      not null default 0
savings_aws       numeric      not null default 0
savings_gcp       numeric      not null default 0
savings_azure     numeric      not null default 0
savings_openai    numeric      not null default 0
savings_anthropic numeric      not null default 0
savings_total     numeric      not null default 0
created_at        timestamptz  not null default now()
```

**`leads` table**

```sql
id              uuid         primary key default gen_random_uuid()
company_id      uuid         not null references companies(id)
first_name      text         not null
last_name       text         not null
email           text         not null
phone           text         not null
timezone        text         not null
use_case        text         not null  -- 'uc1_new_signup' | 'uc2_estimate_completed'
status          text         not null default 'pending'
                             -- 'pending' | 'calling' | 'called' | 'booked' | 'no_answer' | 'declined'
created_at      timestamptz  not null default now()
called_at       timestamptz            -- null until the call is placed
outcome_notes   text                   -- null until an outcome is logged
room_name       text                   -- LiveKit room for the active/last call (set at dispatch)
```

---

### 3. FastAPI Backend (the hub)

Every trigger does the same three things: **upsert** the lead/company in Supabase →
**index** the lead document into the Moss `leads` index → **dispatch** the agent
(`create_dispatch` with `{ phone_number, lead_id, use_case }`), storing the generated
`room_name` on the lead so the dashboard can join the call read-only.

**Trigger endpoints** (called by the fake website):

- `POST /triggers/new-signup` — UC1: create company+lead → index → dispatch
- `POST /triggers/estimate-completed` — UC2: set `savings_total` → re-index → dispatch

**Call management**:

- `POST /calls/trigger` — manual "Call Now" from dashboard (by `lead_id`) → index → dispatch
- `POST /calls/outcome` — persist `LogOutcome` (status + notes); also writable by the agent

**Lead endpoints** (read by dashboard):

- `GET /leads` — all leads with company + status (for queue + analytics)
- `GET /leads/:id` — single lead detail (+ `room_name` for the live call view)

Request/response shapes are the Pydantic models in `backend/src/models.py` — this is the
contract the frontend codes against.

---

### 4. LiveKit Voice Agent (Python)

- Registered dispatch name `agent-py` (must match `AGENT_NAME`). The backend dispatches
  it per call; do not rename.
- Reads **dispatch metadata** `{ phone_number, lead_id, use_case }` from `ctx.job.metadata`
  to know who to dial and which script to run.
- Tools:
  - `get_lead_context()` — Moss semantic search over the lead's profile (filtered by `lead_id`)
  - `search_knowledge(query)` — Moss RAG over Pump product/offer/objection facts
  - `book_meeting()` — marks the lead `booked` in Supabase
  - `log_outcome(outcome)` — updates lead `status` + `outcome_notes` in Supabase
- STT / LLM / TTS all run on **LiveKit Inference** — managed gateway, no separate provider API keys
- Qwen TTS is an optional stretch swap for a custom voice persona (see Key Technical Decisions)

**Dispatch metadata contract** (backend → agent, the internal seam):

```json
{ "phone_number": "+14155550101", "lead_id": "<uuid>", "use_case": "uc2_estimate_completed" }
```

---

### 4a. Outbound Calling (LiveKit SIP)

The agent is **agent-initiated outbound**: the backend dispatches the agent into a fresh
room with the metadata above, and the agent places the real phone call from inside the job.

- **Carrier (Twilio)**: outbound PSTN runs over a **Twilio Elastic SIP Trunk** — LiveKit's
  own phone numbers are inbound-only, so agent-dialed outbound needs a third-party trunk.
  One-time Twilio setup: buy a number, create an Elastic SIP Trunk, note its termination URI
  (`<name>.pstn.twilio.com`) + SIP credentials.
- **Outbound trunk**: register that Twilio trunk with LiveKit once via `lk sip outbound create`
  (pass the `<name>.pstn.twilio.com` address + the Twilio number); find the id with
  `lk sip outbound list` (`ST_xxxx`). Store `SIP_OUTBOUND_TRUNK_ID`, `SIP_AUTH_USERNAME`,
  `SIP_AUTH_PASSWORD` in `agent-py/.env.local`.
- **Dialing** (in the agent entrypoint, after `ctx.connect()`):
  `ctx.api.sip.create_sip_participant(CreateSIPParticipantRequest(room_name=ctx.room.name,
  sip_trunk_id=..., sip_call_to=phone_number, participant_identity=phone_number,
  wait_until_answered=True))`, then `await ctx.wait_for_participant(identity=phone_number)`
  before the agent's opening line.
- **Failure handling**: `create_sip_participant` raises `TwirpError` on busy/no-answer/
  trunk failure (inspect `sip_status_code`); call `ctx.shutdown()` and log `no_answer`.
- Reference implementation: `livekit-examples/outbound-caller-python`.
- **Fallback**: if PSTN is blocked, omit `phone_number` and run the same flow in-browser
  (a person joins the room as the "lead") — the dispatch path is otherwise identical.

---

### 5. Next.js Dashboard (separate from fake website)

- `/` — lead queue: name, company, use case badge (UC1/UC2), status, "Call Now" button
- `/calls/[id]` — live call view: real-time transcript, lead context panel (spend, savings, similar co)
- `/analytics` — funnel: triggered → called → picked up → interested → booked

---

## What Lives Where (the agent's brain)

Keeping these layers distinct is why the agent stays fast *and* its playbook is editable
without redeploying code.

| Layer | Holds | Edited by |
|---|---|---|
| **System prompt** (`agent-py/src/agent.py`) | Persona + call FLOW (open → hook → value → offer → qualify → book → close) | Andrew (code) |
| **Moss `knowledge` index** (`agent-py/knowledge.json`) | Script CONTENT: product/pricing/offer FAQ, objection rebuttals, per-use-case talking points. Retrieved mid-call via `search_knowledge`. | Paul (content) |
| **Moss `leads` index** (`agent-py/leads.json` dev / Supabase→Moss prod) | Per-lead facts (`LeadWithCompany`: name + company cloud/AI spend & savings). Fetched via `get_lead_context`, filtered by `lead_id`. | Paul (data) / Andrew (indexing) |
| **Supabase** (`backend/`) | Source of truth: companies, leads, status, outcomes | Andrew (schema) / Paul (seed) |

**Yes — the agent's scripts live in Moss.** The *flow* stays in the prompt for low latency
and reliability; the *content* (what to say about pricing, how to answer "is this an AI?",
the talking points per use case) lives in the Moss `knowledge` index, so it can be tuned
without touching agent code and is retrieved in <10ms mid-sentence.

> Ownership carve-out: `knowledge.json` (script) and `leads.json` (dev lead data) are the two
> *content* files under `agent-py/` that **Paul** owns; everything else in `agent-py/` is code (Andrew).

---

## Sponsor Integration Map


| Sponsor  | Where Used                                                                            |
| -------- | ------------------------------------------------------------------------------------- |
| LiveKit  | Voice agent infra, real-time audio session, **STT + LLM + TTS via LiveKit Inference** |
| Moss     | Lead context retrieval mid-call (<10ms RAG)                                           |
| Qwen     | Optional: voice cloning / TTS for a custom agent persona (stretch)                    |
| Minimax  | Optional: alternate LLM, selectable via LiveKit Inference                             |
| AWS      | Hosting                                                                               |
| Unsiloed | Optional: parse uploaded cloud/AI bills to generate real estimates                    |

> Twilio (Elastic SIP Trunking) is the PSTN carrier *under* LiveKit SIP for outbound — infrastructure, not a sponsor.


---

## Key Technical Decisions

- **Why two use cases?** They show different funnel stages and different emotional hooks — social proof vs. loss aversion. Much stronger demo story than one generic flow.
- **Why Supabase?** Real-time subscriptions let the dashboard update live as call status changes. No polling needed.
- **Why Moss?** Agent needs to recall "$13,240/month" or "similar to Acme Corp" mid-sentence without lag. Moss indexes this per-lead and returns it in <10ms.
- **Why LiveKit Inference for the LLM (no TrueFoundry)?** LiveKit Inference is a managed gateway that serves STT, LLM, and TTS with zero provider keys and is covered by our LiveKit credits — fastest, free, lowest-risk path to a working call. A separate gateway (e.g. TrueFoundry) would add governance/observability but requires bringing our own provider key and extra setup; not worth it for the demo. Noted as a production consideration only.
- **Why Qwen is optional?** A custom cloned voice makes the agent feel like a real SDR, which helps the demo land emotionally — but DashScope/Qwen TTS isn't OpenAI-compatible and has no official LiveKit plugin, so wiring it means a custom TTS plugin. We default to LiveKit Inference TTS and treat Qwen as a stretch swap if we're ahead of schedule.
- **Why Twilio for outbound (not a LiveKit number)?** LiveKit is the media/agent layer, not a carrier. Its first-party phone numbers are inbound-only (outbound is roadmap-only), so agent-dialed outbound needs a third-party SIP trunk *underneath* LiveKit SIP — we use Twilio Elastic SIP Trunking. Cost ≈ 2–3¢/min all-in (LiveKit agent + SIP minutes + Twilio origination + ~$1.15/mo number); trial credits cover the demo. (Twilio trial accounts only dial *verified* numbers — verify the demo phones early.)
- **Why the script content lives in Moss?** Keeps the system prompt lean (lower latency), lets us tune objection handling and talking points without redeploying the agent, and gives a strong Moss story: the sales playbook is retrieved in <10ms mid-call. Flow stays in the prompt; content lives in the `knowledge` index.

