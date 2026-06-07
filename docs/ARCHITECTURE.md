# Architecture

## High-Level Flow

```
[Fake Pump Website]
     │
     ├── UC1: Account created (no estimate)
     └── UC2: Estimate completed (no trial)
     │
     ▼
[Trigger Service] — FastAPI endpoint called by website on funnel event
     │  - determines which use case (UC1 vs UC2)
     │  - pulls lead context from Supabase
     │  - indexes context into Moss
     │
     ▼
[LiveKit Voice Agent] — Python
     │  - LiveKit Inference for STT + LLM + TTS (managed, no provider keys)
     │  - Moss for real-time lead context retrieval mid-call
     │  - Runs UC1 or UC2 script based on trigger type
     │
     ▼
[Call Outcome Handler]
     │  - updates lead status in Supabase
     │  - if booked → logs meeting
     │
     ▼
[Next.js Dashboard]
     - fake Pump website (triggers the demo)
     - live call monitor with transcript
     - lead queue with UC1/UC2 labels
     - analytics funnel
```

---

## Components

### 1. Fake Pump Website (Next.js)

Two interactive flows that trigger calls:

**UC1 flow**: Simple signup form (name, email, company, phone, AWS spend range)

- On submit → `POST /triggers/new-signup`
- Shows "Account created! You'll hear from us shortly."

**UC2 flow**: Savings estimate tool

- Inputs: monthly AWS spend, main services used (EC2, S3, RDS etc.)
- Shows a result: "You could save **$13,240/month**"
- On result shown → `POST /triggers/estimate-completed`
- Shows "Your estimate is ready. We'll call you shortly."

---

### 2. Supabase Schema

**`companies` table**

```sql
id                uuid primary key
name              text
company_size      text     -- '1-10', '11-50', '51-200', '201-500', '500+'
cloud_provider    text     -- 'aws' | 'gcp' | 'azure'
spend_aws         numeric  default 0
spend_gcp         numeric  default 0
spend_azure       numeric  default 0
spend_openai      numeric  default 0
spend_anthropic   numeric  default 0
spend_total       numeric  default 0
savings_aws       numeric  default 0
savings_gcp       numeric  default 0
savings_azure     numeric  default 0
savings_openai    numeric  default 0
savings_anthropic numeric  default 0
savings_total     numeric  default 0
created_at        timestamp
```

**`leads` table**

```sql
id              uuid primary key
company_id      uuid references companies(id)
first_name      text
last_name       text
email           text
phone           text
timezone        text
use_case        text  -- 'uc1_new_signup' | 'uc2_estimate_completed'
status          text  -- 'pending' | 'calling' | 'called' | 'booked' | 'no_answer' | 'declined'
created_at      timestamp
called_at       timestamp
outcome_notes   text
```

---

### 3. FastAPI Backend

**Trigger endpoints** (called by website):

- `POST /triggers/new-signup` — UC1 trigger
- `POST /triggers/estimate-completed` — UC2 trigger

**Call management**:

- `POST /calls/trigger` — manually trigger a call (dashboard use)
- `POST /calls/webhook` — LiveKit status callbacks
- `GET /calls/queue` — current queue

**Lead endpoints**:

- `GET /leads` — all leads with status
- `GET /leads/:id` — single lead detail + call transcript

---

### 4. LiveKit Voice Agent (Python)

- Reads `use_case` from session metadata to determine which script to run
- Tools:
  - `get_lead_context(lead_id)` — Moss semantic search over lead profile
  - `book_meeting(lead_id)` — logs booked meeting, updates Supabase
  - `log_outcome(lead_id, outcome)` — updates status in Supabase
- STT / LLM / TTS all run on **LiveKit Inference** — managed gateway, no separate provider API keys
- Qwen TTS is an optional stretch swap for a custom voice persona (see Key Technical Decisions)

---

### 5. Next.js Dashboard (separate from fake website)

- `/` — lead queue: name, company, use case badge (UC1/UC2), status, "Call Now" button
- `/calls/[id]` — live call view: real-time transcript, lead context panel (spend, savings, similar co)
- `/analytics` — funnel: triggered → called → picked up → interested → booked

---

## Sponsor Integration Map


| Sponsor  | Where Used                                                                            |
| -------- | ------------------------------------------------------------------------------------- |
| LiveKit  | Voice agent infra, real-time audio session, **STT + LLM + TTS via LiveKit Inference** |
| Moss     | Lead context retrieval mid-call (<10ms RAG)                                           |
| Qwen     | Optional: voice cloning / TTS for a custom agent persona (stretch)                    |
| Minimax  | Optional: alternate LLM, selectable via LiveKit Inference                             |
| AWS      | Hosting                                                                               |
| Unsiloed | Optional: parse uploaded AWS bills to generate real estimates                         |


---

## Key Technical Decisions

- **Why two use cases?** They show different funnel stages and different emotional hooks — social proof vs. loss aversion. Much stronger demo story than one generic flow.
- **Why Supabase?** Real-time subscriptions let the dashboard update live as call status changes. No polling needed.
- **Why Moss?** Agent needs to recall "$13,240/month" or "similar to Acme Corp" mid-sentence without lag. Moss indexes this per-lead and returns it in <10ms.
- **Why LiveKit Inference for the LLM (no TrueFoundry)?** LiveKit Inference is a managed gateway that serves STT, LLM, and TTS with zero provider keys and is covered by our LiveKit credits — fastest, free, lowest-risk path to a working call. A separate gateway (e.g. TrueFoundry) would add governance/observability but requires bringing our own provider key and extra setup; not worth it for the demo. Noted as a production consideration only.
- **Why Qwen is optional?** A custom cloned voice makes the agent feel like a real SDR, which helps the demo land emotionally — but DashScope/Qwen TTS isn't OpenAI-compatible and has no official LiveKit plugin, so wiring it means a custom TTS plugin. We default to LiveKit Inference TTS and treat Qwen as a stretch swap if we're ahead of schedule.

