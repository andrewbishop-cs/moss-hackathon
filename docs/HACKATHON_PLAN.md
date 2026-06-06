# Hackathon Execution Plan

## Time Budget: ~24 hours (June 6–7)
## Two Demo Targets: UC1 (new signup) + UC2 (estimate completed)

---

## Phase 1 — Foundation (Hours 1–4) [Andrew leads]

### Goal: Get a voice call working end-to-end, even if dumb

- [ ] Clone `moss-hacker-starter`: https://github.com/livekit-examples/moss-hacker-starter
- [ ] Get API keys: LiveKit, Moss (STT/LLM/TTS run on LiveKit Inference — no extra provider keys; Qwen/Minimax optional stretch)
- [ ] Set up Supabase project + create `leads` table (schema in ARCHITECTURE.md)
- [ ] Verify: agent says "Hello, this is Alex from Pump" out loud in a browser tab

**Checkpoint**: Agent speaks in browser.

---

## Phase 2 — Lead Data + Fake Website (Hours 2–5) [Paul leads]

### Goal: Fake Pump site that triggers calls + seeded lead data

- [ ] Seed Supabase with 15 mock leads (mix of UC1 and UC2 — ask Claude to generate JSON)
- [ ] Build fake Pump website in Next.js — two flows:
  - UC1: Signup form → `POST /triggers/new-signup`
  - UC2: Estimate calculator → shows savings result → `POST /triggers/estimate-completed`
- [ ] Style it to look like a real SaaS product (doesn't need to be perfect)
- [ ] Index lead data into Moss on backend startup

**Checkpoint**: Submit fake signup form → lead appears in Supabase with status `pending`.

---

## Phase 3 — Agent Intelligence (Hours 4–9) [Andrew leads]

### Goal: Agent runs correct script (UC1 vs UC2) using real lead data from Moss

- [ ] Implement UC1 system prompt + UC2 system prompt (see AGENT_SCRIPT.md)
- [ ] Agent reads `use_case` from session metadata to pick script
- [ ] Add `get_lead_context` tool → Moss query
- [ ] Add `book_meeting` tool → logs to Supabase
- [ ] Add `log_outcome` tool → updates lead status
- [ ] Wire lead_id into LiveKit session metadata

**UC1 Checkpoint**: Agent says "[Name], companies similar to [Company] save $X/month with us."
**UC2 Checkpoint**: Agent says "You found $13,240/month — that's $158K a year sitting there."

---

## Phase 4 — Outbound Calling (Hours 7–11) [Andrew leads]

### Goal: Website action → phone actually rings

- [ ] Implement `POST /triggers/new-signup` and `POST /triggers/estimate-completed` in FastAPI
- [ ] On trigger: look up lead → index into Moss → fire LiveKit outbound call
- [ ] Test: fill out fake Pump signup form → Paul's phone rings → agent runs UC1 script
- [ ] Test: complete fake estimate → phone rings → agent runs UC2 script with correct savings number

**⚠️ Fallback**: If PSTN outbound is blocked, demo in-browser — judge clicks a link to join as "the lead." Don't waste more than 1 hour on PSTN issues.

**Checkpoint**: Website action → phone rings within 30 seconds.

---

## Phase 5 — Dashboard (Hours 9–15) [Paul leads]

### Goal: Visual layer that shows the full story to judges

- [ ] Lead queue (`/`) — table with name, company, UC1/UC2 badge, status, "Call Now" button
- [ ] Live call view (`/calls/[id]`):
  - Real-time transcript (WebSocket from Supabase realtime or polling)
  - Lead context panel: spend, savings estimate, similar company
  - UC1/UC2 label so judges know which script is running
- [ ] Analytics (`/analytics`) — funnel: triggered → called → booked
- [ ] Supabase realtime subscription → dashboard updates without refresh

**Checkpoint**: Complete the UC2 demo flow end-to-end from dashboard.

---

## Phase 6 — Polish + Demo Prep (Hours 15–22)

- [ ] Run full UC1 demo 3x cleanly
- [ ] Run full UC2 demo 3x cleanly
- [ ] Prep 2-min pitch (structure below)
- [ ] Make sure demo works on bad wifi
- [ ] Prep fallback: recorded video of a clean run in case live demo fails

### Pitch Structure (2 min)
1. **Problem** (20s): PLG companies lose 90% of visitors. These aren't cold leads — they just found $13K/month in savings and walked away. Nobody calls them.
2. **Demo UC2** (40s): Show estimate → phone rings → transcript → booked
3. **Demo UC1** (20s): Show signup → phone rings → social proof hook
4. **Why voice AI, why now** (15s): Voice AI is finally good enough. This is the first time you can do this at scale without an SDR team.
5. **Sponsor callouts** (15s): LiveKit for infra + STT/LLM/TTS (Inference), Moss for real-time memory, Qwen for voice (if wired)
6. **Market** (10s): Every PLG company has this problem. This is the first tool built for it.

---

## Division of Labor

| Who | Primary Ownership |
|---|---|
| Andrew | LiveKit agent, Moss integration, FastAPI backend, outbound call trigger |
| Paul | Fake Pump website, mock lead data, Next.js dashboard, demo prep, pitch |

---

## Fallback Plans

| Risk | Fallback |
|---|---|
| PSTN outbound doesn't work | In-browser demo: judge joins as lead via link |
| Moss too slow to integrate | Pre-load lead context into agent system prompt directly |
| Qwen voice bad quality / no time to wire | Use LiveKit Inference TTS (default) |
| UC2 estimate calculator too complex | Hardcode the savings number for demo — just show "$13,240/month" |

---

## Winning Criteria

1. **It works live** — real call, real transcript, judges see it happen
2. **Two use cases** — shows product thinking, not just a hack
3. **Sponsor depth** — LiveKit + Moss deeply integrated
4. **Real problem** — every PLG company in the room has this problem
5. **Clean story** — problem → demo → market in 2 minutes flat
