# Anthropic Context Brief — Pump Voice AI Demo Script

Copy everything below the line into Anthropic when planning the demo script.

---

## What we're building

**YC Conversational AI Hackathon (June 6–7, 2026)** — Paul + Andrew.

**Product:** Pump — a fake-but-realistic SaaS that cuts **cloud (AWS/GCP/Azure) and AI (OpenAI/Anthropic)** bills. Our deliverable is a **voice AI agent ("Alex")** that calls warm PLG leads the moment they drop off the Pump funnel.

**Stack:** LiveKit Agents (Python) + Twilio SIP PSTN outbound + Moss RAG (playbook + lead context mid-call) + FastAPI backend + Supabase + Next.js dashboard + fake Pump website.

**Hackathon sponsors to name-drop:** LiveKit (SIP telephony + inference + real-time rooms), Moss (sub-10ms semantic search for playbook + lead context live during the call).

---

## Critical scope clarification: NOT three use cases

**The product has exactly TWO funnel use cases — there is no UC3:**

| Use case | Trigger | Agent hook |
|---|---|---|
| **UC1 — New signup** (`uc1_new_signup`) | Prospect creates account on `/pump` but never runs estimate/trial | Social proof — "companies like yours save $X/year"; must ask spend to qualify |
| **UC2 — Estimate completed** (`uc2_estimate_completed`) | Prospect runs savings estimate on `/pump/estimate` but doesn't convert | Loss aversion — "you found $X/year sitting there"; savings number is known |

**What the live demo shows instead is THREE SPEND TIERS** — not three use cases:

| Persona | Lead | Company | Monthly spend | Tier badge | Use case (background only) | Live PSTN call? |
|---|---|---|---|---|---|---|
| Sam Okonkwo | `b1000000-0017` | Pinewood AI | $4K | **Not qualified** | UC1 (signup) | **No** — point at queue row, narrate graceful wind-down |
| Alex Rivera | `b1000000-0016` | Beacon Labs | $12K | **SMB · DoorDash** | UC2 (estimate) | **Yes — Call 1** (optional if tight on time) |
| Michael Truell | `b1000000-0001` | Cursor | $8.5M | **Whale · Mac Mini** | UC2 (estimate) | **Yes — Call 2 (hero)** |

**Do not script or pitch this as "three use cases."** Script it as: *one intelligent agent that qualifies on spend, scales the offer by tier, and uses the right hook depending on where the lead is in the funnel (UC1 vs UC2)* — but the **judge-facing story is tier qualification**, with UC2 as the primary live trigger.

---

## Demo strategy (current run-of-show)

**Target:** 2 minutes · **UC2 first** · Real PSTN to Paul's iPhone

Source: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md)

### Pitch timing (2 min total)

| Segment | Time | What to say/do |
|---|---|---|
| Problem | 15s | PLG companies lose 90% of visitors. These aren't cold leads — they found savings and walked away. Nobody calls them. |
| Tier queue | 10s | Dashboard: **Not qualified** / **SMB · DoorDash** / **Whale · Mac Mini** — $5K/mo minimum, offer scales above |
| UC2 demo | 40s | Tier click path: SMB call + Whale call (see below) |
| UC1 demo | 15s | **Optional** — narrate Sam/Pinewood from queue (under $5K); do NOT need a live UC1 call |
| Why voice AI | 15s | Voice AI is finally good enough to do this at scale without an SDR team |
| Sponsors | 15s | LiveKit + Moss |
| Market | 10s | Every PLG company has this problem |

### Live click path (projector on dashboard)

**Queue beat (~10s):** Point at three rows with tier badges visible.

**Call 1 — SMB (~25s):**
1. Open `http://localhost:3000/pump/estimate?lead_id=b1000000-0016-0000-0000-000000000016`
2. Click **Get my plan** → dashboard shows Alex Rivera → status `calling`
3. Live call view → agent offers **$20 DoorDash credit** + annual savings hook
4. Run `reset_demo_leads.sql` before call 2 if needed

**Call 2 — Whale (~35s) — THE HERO:**
1. Open `http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001`
2. **Get my plan** → Michael Truell (Cursor, $8.5M/mo spend, ~$1.58M/mo savings) → `calling`
3. Live view → agent offers **Mac Mini + senior AE**
4. Optional: agent books meeting → status `booked` on analytics funnel

**Tight on time?** Skip Call 1 live — narrate Alex from the queue; keep Whale as the only PSTN call.

**UC1 (secondary, don't over-index):** Sam Okonkwo is already in queue as UC1 + Not qualified. You can gesture at the row ("new signup, under threshold, agent winds down gracefully") without triggering a live call.

---

## Agent persona and conversation design

**Agent:** Alex — AI Customer Success Manager at Pump  
**Voice:** Warm, confident, slightly casual. Helpful first, sales second.  
**AI disclosure:** Always upfront in opening — own it as a differentiator.

**Agent tools:**
- `get_lead_context(lead_id)` — start of call (usually pre-injected)
- `search_knowledge(query)` — Moss RAG for product Q&A and objections
- `book_meeting(lead_id, datetime, tier)` — after time agreed
- `log_outcome(lead_id, status, tier, notes)` — end of call

**Qualification gates (in order):**
1. **Spend:** < $5K/mo → `not_qualified`, graceful exit
2. **Eligibility:** Active EDP or cloud credits → `not_eligible`, graceful exit
3. **Tier + offer** (if qualified):

| Tier | Monthly spend | Offer |
|---|---|---|
| SMB | $5K–$15K | $20 DoorDash credit |
| Core | $15K–$30K | $50 AWS credits |
| Mid-Market | $30K–$60K | World Cup jersey |
| Enterprise | $60K–$150K | Custom company pullover |
| Whale | $150K+ | Mac Mini + flag senior AE |

**UC1 vs UC2 script difference (same agent, different hook):**
- **UC2 opening:** "You ran a savings estimate… I have an offer for you."
- **UC1 opening:** "You just created an account… I have an offer for you." → social proof, must ask spend.

Full scripted flows, objection handling, and booking urgency rounds: [AGENT_SCRIPT.md](AGENT_SCRIPT.md)

---

## Hero lead details (Michael Truell / Cursor)

From [backend/seed/seed_data.json](../backend/seed/seed_data.json):

- **Company:** Cursor
- **Monthly spend:** $8,500,000 (AWS $2.8M + OpenAI $1.2M + Anthropic $4.5M)
- **Monthly savings:** $1,583,000 → **~$19M/year** hook for UC2
- **Tier:** Whale → Mac Mini + senior AE
- **Phone:** Paul's Twilio-verified E.164 (set via `setup_tier_demo.sql` / `set_demo_phone.sql`)

This is the "wow" call — real phone rings, judge sees live transcript + Moss context panel on dashboard.

---

## What judges see on screen

1. **Fake Pump website** (`/pump`, `/pump/estimate`) — triggers real outbound call
2. **Dashboard lead queue** (`/dashboard`) — tier badges, UC1/UC2 badges (secondary), status updates live
3. **Live call view** (`/dashboard/calls/[id]`) — real-time transcript + Moss context panel (playbook snippets pulled mid-call)
4. **Analytics** (`/dashboard/analytics`) — funnel: triggered → called → booked

---

## Demo logistics (for script pacing)

- **iPhone:** Twilio caller ID in Contacts + Favorites; DND configured; **turn DND off for the 2 live minutes** (safest)
- **Three terminals:** `pnpm dev:backend` (:8000), `pnpm dev:agent-py`, `pnpm dev:frontend` (:3000)
- **Before each dry run:** `backend/seed/reset_demo_leads.sql` in Supabase
- **Fallbacks:** narrate from dashboard transcript if phone doesn't ring; in-browser room join if SIP fails

---

## What Anthropic should help plan

Given the above, help us write:

1. **Exact spoken words** for the 2-min pitch (problem → tier queue → live demo beats → sponsors → market)
2. **Narration lines** for the three tier rows (especially Sam/Not qualified without a live call)
3. **What Paul says vs what the agent says** during Call 1 (SMB) and Call 2 (Whale)
4. **Transitions** between dashboard, estimate page, and live call view
5. **Tight-time variant** (Whale-only live call, narrate SMB + Not qualified)
6. **Optional 15s UC1 beat** — one sentence max, no live trigger

**Constraints:**
- Do NOT invent a third use case
- Do NOT demo UC1 as equal weight to UC2 — UC2 is primary, UC1 is a queue gesture
- The "three things" in the demo are **three tiers**, not three funnel triggers
- Keep total under 2 minutes
- Name LiveKit and Moss explicitly

---

## Key reference files

- Demo run-of-show: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md)
- **Spoken script (output):** [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- Agent scripts (UC1 + UC2 full prompts): [AGENT_SCRIPT.md](AGENT_SCRIPT.md)
- Tier logic: [frontend/lib/tiers.ts](../frontend/lib/tiers.ts)
- Demo seed SQL: [backend/seed/setup_tier_demo.sql](../backend/seed/setup_tier_demo.sql)
- Agent implementation: [agent-py/src/agent.py](../agent-py/src/agent.py) (lines 107–268 for use-case hooks)
- Moss playbook: [agent-py/knowledge.json](../agent-py/knowledge.json)
