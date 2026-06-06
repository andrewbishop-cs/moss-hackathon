# Hackathon Execution Plan

## Time Budget: ~24 hours (June 6–7)

---

## Phase 1 — Foundation (Hours 1–4) [Andrew leads, Paul supports]

### Goal: Get a voice call working end-to-end, even if dumb

- [ ] Clone `moss-hacker-starter` repo
  - https://github.com/livekit-examples/moss-hacker-starter
- [ ] Set up LiveKit project + get API keys
- [ ] Set up Moss account + get API keys
- [ ] Set up TrueFoundry AI gateway (route LLM calls through it)
- [ ] Get Qwen API access for voice
- [ ] Verify: can make a voice call in browser via LiveKit agent

**Checkpoint**: Agent says "Hello, this is Alex from Acme" out loud in a browser tab.

---

## Phase 2 — Lead Data Layer (Hours 3–6) [Paul leads, Andrew supports]

### Goal: Fake CRM with realistic data the agent can use

- [ ] Create SQLite DB with `leads` table (see ARCHITECTURE.md schema)
- [ ] Seed 10–20 mock leads with varied funnel stages and AWS spend estimates
- [ ] Build `GET /leads` and `GET /leads/:id` endpoints in FastAPI
- [ ] Index lead data into Moss on startup
- [ ] Verify: Moss can answer "What's Sarah's AWS spend estimate?" in <10ms

**Checkpoint**: Moss returns correct lead context from a test query.

---

## Phase 3 — Agent Intelligence (Hours 5–10) [Andrew leads]

### Goal: Agent that follows the script and uses Moss mid-call

- [ ] Implement agent system prompt (see AGENT_SCRIPT.md)
- [ ] Add `get_lead_context` tool (calls Moss with lead_id)
- [ ] Add `book_meeting` tool (creates a fake calendar event, logs it)
- [ ] Add `log_outcome` tool (updates lead status in DB)
- [ ] Wire lead_id into LiveKit session metadata so agent knows who it's calling
- [ ] Test: call a mock lead, agent references their specific spend estimate

**Checkpoint**: Agent says "[Name], I see you ran an estimate for $42K/month" and it's correct.

---

## Phase 4 — Outbound Call Trigger (Hours 8–12) [Andrew leads]

### Goal: Actually dial out to a real phone number

- [ ] Research LiveKit SIP / PSTN outbound calling (or use Twilio as bridge)
- [ ] Implement `POST /calls/trigger` endpoint
- [ ] Test: trigger a call to Paul's cell, agent picks up and runs script

**Note**: This is the highest-risk phase. If outbound PSTN via LiveKit is blocked/slow, fall back to browser-based demo where "the lead" joins via a link. Don't let this kill the whole project.

**Checkpoint**: Paul's phone rings and Alex greets him by name.

---

## Phase 5 — Dashboard (Hours 10–16) [Paul leads on design, Andrew on data]

### Goal: Visual demo layer that makes judges say "oh shit"

- [ ] Next.js app with 3 pages:
  1. **Lead Queue** (`/`) — table of leads, funnel stage, status, "Call Now" button
  2. **Live Call View** (`/calls/[id]`) — real-time transcript, agent status indicator, lead context panel
  3. **Analytics** (`/analytics`) — funnel: called → picked up → interested → booked
- [ ] Connect to FastAPI backend via REST
- [ ] "Call Now" button triggers `POST /calls/trigger`
- [ ] Transcript streams in real-time (WebSocket or polling)

**Checkpoint**: Click "Call Now" from dashboard, watch transcript appear live.

---

## Phase 6 — Polish & Demo Prep (Hours 16–22)

- [ ] Record a clean demo run (lead → call → booking)
- [ ] Prep the 2-min pitch:
  - Problem: PLG drop-off, nobody calls warm leads
  - Demo: click Call Now, live transcript, booked meeting
  - Why now: voice AI is finally good enough, PLG is table stakes
  - Sponsor callouts: LiveKit (infra), Moss (memory), Qwen (voice), TrueFoundry (governance)
- [ ] Stress test: call 5 mock leads back to back
- [ ] Make sure demo works on bad wifi (it's a hackathon)

---

## Fallback Plans

| Risk | Fallback |
|---|---|
| Outbound PSTN doesn't work | Demo in-browser: judge joins as "the lead" via link |
| Moss integration is slow | Pre-load context into agent system prompt directly |
| Qwen voice quality is bad | Use LiveKit default TTS |
| TrueFoundry setup takes too long | Skip — call LLM directly, mention it in pitch as "production consideration" |

---

## Division of Labor

| Who | Primary Ownership |
|---|---|
| Andrew | LiveKit agent, Moss integration, FastAPI backend, outbound calling |
| Paul | Mock CRM data, agent script tuning, Next.js dashboard, demo prep, pitch |

---

## Winning Criteria (reverse-engineer the judges)

To win this you need:
1. **It actually works** — live demo, real call, real transcript
2. **Sponsor integration** — use LiveKit + Moss deeply, mention others
3. **Real use case** — PLG drop-off recovery is a $B problem, not a toy
4. **Clean demo story** — problem → solution → demo → market in 2 minutes
