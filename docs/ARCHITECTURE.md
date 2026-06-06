# Architecture

## High-Level Flow

```
[Mock CRM/DB] 
     │
     ▼
[Trigger Service] — detects high-intent drop-off events
     │
     ▼
[Call Orchestrator] — Python/FastAPI
     │  - pulls lead context from DB
     │  - loads context into Moss index
     │
     ▼
[LiveKit Agent] — Python voice agent
     │  - Qwen voice (custom voice clone)
     │  - Moss for real-time lead context retrieval mid-call
     │  - TrueFoundry AI gateway for LLM routing/governance
     │
     ▼
[Call Outcome Handler]
     │  - updates lead status in DB
     │  - if booked → creates calendar event / notifies human rep
     │
     ▼
[Next.js Dashboard]
     - live call monitor
     - lead queue
     - call outcomes + transcripts
```

## Components

### 1. Mock CRM / Lead DB
- SQLite or in-memory store for hackathon
- Schema: `leads` table with fields:
  - `id`, `name`, `email`, `phone` (optional)
  - `company`, `aws_spend_estimate` (product-specific context)
  - `funnel_stage` (visited_pricing, started_estimate, added_teammate, etc.)
  - `status` (pending, called, booked, no_answer, declined)
  - `enriched_data` (JSON blob from Clay-style enrichment)

### 2. Trigger Service
- Watches for leads in high-intent funnel stages
- Priority order:
  1. `started_estimate` + no signup
  2. `visited_pricing` 2+ times
  3. `added_teammate` + no trial
- Pushes to call queue

### 3. Call Orchestrator (FastAPI)
- `POST /calls/trigger` — manually trigger a call for a lead
- `POST /calls/webhook` — LiveKit call status updates
- `GET /calls/queue` — current queue state
- On trigger: loads lead data → indexes into Moss → initiates LiveKit session

### 4. LiveKit Voice Agent (Python)
- Uses `agent-starter-python` pattern from moss-hacker-starter
- Tools available to agent:
  - `get_lead_context` — Moss semantic search over lead's enriched profile
  - `book_meeting` — creates a calendar slot and sends confirmation
  - `log_outcome` — records call result (interested/not/callback/booked)
- Qwen for voice generation (natural, low-latency TTS)
- TrueFoundry as AI gateway (LLM calls routed through it for observability)

### 5. Next.js Dashboard
- `/` — lead queue with funnel stage, status, priority score
- `/calls/[id]` — live call view (transcript stream, agent status)
- `/analytics` — conversion funnel: called → picked up → interested → booked

## Sponsor Integration Map

| Sponsor | Where Used |
|---|---|
| LiveKit | Voice agent infra, real-time audio session |
| Moss | Lead context retrieval mid-call (<10ms RAG) |
| Qwen | Voice cloning / TTS for agent persona |
| TrueFoundry | AI gateway for LLM calls (observability, rate limiting) |
| AWS | Hosting (EC2 or Lambda for orchestrator) |
| Unsiloed | Optional: parse uploaded prospect docs / contracts |
| Minimax | Optional: fallback LLM or multilingual support |

## Key Technical Decisions

- **Why Moss?** Agent needs to recall lead-specific facts mid-conversation without lag. "You ran an estimate for $47K/month in EC2 spend" — that has to come from somewhere fast. Moss indexes this per-lead and retrieves it in <10ms.
- **Why Qwen for voice?** Custom voice persona makes the agent feel like a real company rep, not a robot. Qwen's voice cloning lets you create a consistent "brand voice."
- **Why TrueFoundry?** Gives you a control plane over all LLM calls — good for demo: shows judges you're thinking about production governance, not just a hack.
