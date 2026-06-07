# Call Flow & Where to Change Behavior

A practical map of what happens from pressing **Call** to logging an outcome, and
the exact file/function to edit for each kind of behavior change. Companion to
`AGENT_SCRIPT.md` (the human-readable script) and `ARCHITECTURE.md` (the system).

---

## The call cycle, end to end

```
[Dashboard] press "Call Now"
     │  POST /calls/trigger { lead_id }
     ▼
[FastAPI hub]  backend/src/main.py  ──►  calls.start_call()  backend/src/calls.py
     │   1. db.get_lead(lead_id)                 # pull lead + company from Supabase
     │   2. moss_index.upsert_lead(lead)         # (re)write this lead's doc into Moss `leads`
     │   3. create room name  "call-<id>-<ts>"
     │   4. agent_dispatch.create_dispatch(room, metadata={phone, lead_id, use_case})
     │   5. db.mark_calling(lead, room_name)     # status -> calling, store room_name
     ▼
[LiveKit Cloud]  routes the dispatch to the registered "agent-py" worker
     ▼
[Agent worker]  agent-py/src/agent.py  ──►  my_agent(ctx)
     │   1. parse metadata -> lead_id, use_case, phone_number
     │   2. build AgentSession (STT + LLM + TTS + VAD + turn detection)
     │   3. ctx.connect() into the room
     │   4. if phone_number: create_sip_participant() -> dials the phone, waits for pickup
     │   5. session.start(Assistant(...))         # Assistant.on_enter runs here
     │        - preload Moss indexes
     │        - query `leads` index for THIS lead -> inject profile into system prompt
     │   6. session.generate_reply(_opening_for(use_case))   # speaks the first line
     ▼
[Live conversation loop]  (repeats every turn)
     user speaks ─► STT (Deepgram) ─► turn detector closes turn
                 ─► LLM (Gemini) decides: answer? or call a tool?
                       • search_knowledge(query)  -> queries Moss `knowledge` index
                       • get_lead_context()        -> re-queries Moss `leads` index
                       • book_meeting(when, tier)  -> POST /calls/outcome (booked)
                       • log_outcome(outcome, notes)-> POST /calls/outcome
                 ─► LLM text ─► TTS (Inworld) ─► audio to caller
     ▼
[End of call]  log_outcome() persists status to Supabase via the hub.
     │   if outcome in {no_answer, declined}: agent hangs up the room.
     ▼
[FastAPI hub]  POST /calls/outcome  ──►  db.set_outcome()
     │   if outcome in RETRY_OUTCOMES and should_retry(): start_call(is_retry=True)
     ▼   (one automatic callback; the retry can't spawn another)
[Dashboard]  polls GET /leads, shows the new status.
```

### When is Moss actually queried?

Common misconception: Moss does **not** run on every user utterance. There are two
indexes, queried at different times:

| Index | Holds | Queried when | Code |
| --- | --- | --- | --- |
| `leads` | one doc per lead (name, company, spend, savings, use case) | **once at call start** (injected into the prompt) + on-demand via `get_lead_context` | `Assistant.on_enter` / `_query_lead` (`agent.py`); doc built in `backend/src/moss_index.py` |
| `knowledge` | Pump product facts, pricing, promo/tiers, objection handling | **only when the LLM calls `search_knowledge`** (prompt tells it to before answering any Pump question) | `Assistant.search_knowledge` (`agent.py`); source corpus `agent-py/knowledge.json` |

So per-lead facts are "context injected at the start," and product knowledge is
"RAG pulled on demand when the model needs it."

---

## Where to change behavior

| I want to change… | Edit | Notes |
| --- | --- | --- |
| **What the agent says / persona / tone** | `_instructions_for()` in `agent-py/src/agent.py` | The system prompt. The single biggest lever. Keep `AGENT_SCRIPT.md` in sync. |
| **The opening line** | `_opening_for()` in `agent.py` | First spoken turn, per use case. |
| **Per-use-case angle (UC1 vs UC2)** | `_USE_CASE_HOOKS` in `agent.py` | Only the "hook" differs between use cases; everything else is shared. |
| **Call flow / qualification gates / tiers / offers** | "Call flow" + "OFFER" sections of `_instructions_for()` | Spend thresholds, tier→gift mapping, booking urgency all live in the prompt text. |
| **Product facts, pricing, promo, objection answers** | `agent-py/knowledge.json`, then re-run `pnpm moss:index` | This is the RAG corpus `search_knowledge` reads. Changes need a re-index to take effect. |
| **What lead facts the agent knows** | `build_lead_document()` in `backend/src/moss_index.py` | The natural-language profile injected at call start. Re-indexed automatically on each call (via `upsert_lead`). |
| **Valid outcomes / disposition taxonomy** | `VALID_OUTCOMES` in `agent.py` **and** `LeadStatus` in `backend/src/models.py` | Must match, or the hub rejects the write (422). See `LEAD_DISPOSITIONS.md`. |
| **Voice (TTS) — model, voice, speed** | `AgentSession(tts=inference.TTS(...))` in `my_agent()` (`agent.py`) | Currently Inworld TTS-2 "Serena" @ 1.3x. `speaking_rate`/`temperature` via `extra_kwargs`. |
| **Ears (STT)** | `AgentSession(stt=inference.STT(...))` | Currently Deepgram nova-3 (English). |
| **Brain (LLM) — model choice** | `Assistant.__init__` `llm=inference.LLM(...)` | Currently `google/gemini-2.5-flash-lite`. Bigger model = smarter but slower. |
| **Response latency / turn-taking feel** | `min_endpointing_delay`, `max_endpointing_delay`, `preemptive_generation` in `AgentSession` | How fast a turn closes after the user stops talking. |
| **Add a new capability the agent can invoke** | New `@function_tool()` method on `Assistant` (`agent.py`) | The docstring is what the LLM reads to decide when to call it — write it carefully. |
| **Voicemail handling** | "Voicemail and automated systems" section of `_instructions_for()` + `log_outcome` hangup logic (`agent.py`) | Agent stays silent and logs `no_answer`. |
| **Auto-retry rules (which outcomes ring back, how many times)** | `RETRY_OUTCOMES` + `should_retry()` in `backend/src/calls.py`; `call_outcome` in `backend/src/main.py` | One instant callback for `no_answer`/`declined`; a retry can't spawn another. |
| **What "press Call" does (trigger pipeline)** | `start_call()` in `backend/src/calls.py`; endpoints in `backend/src/main.py` | Indexing + dispatch + status update. |
| **Dialing / SIP / phone setup** | SIP block in `my_agent()` (`agent.py`) + `SIP_OUTBOUND_TRUNK_ID` in `agent-py/.env.local` | `create_sip_participant`, `wait_until_answered`. |

---

## Quick rules of thumb

- **Changing *what it says*** → `agent.py` prompt functions (`_instructions_for`,
  `_opening_for`, `_USE_CASE_HOOKS`). No re-index needed; just restart `pnpm dev`.
- **Changing *what it knows about Pump*** → `knowledge.json` + `pnpm moss:index`.
- **Changing *what it knows about the lead*** → `moss_index.build_lead_document`
  (re-indexed automatically each call).
- **Changing *how it sounds*** → the `AgentSession` STT/TTS/LLM config in `my_agent`.
- **Changing *what happens after the call*** → `backend/src/calls.py` +
  `backend/src/main.py`.
- After editing outcomes, keep `VALID_OUTCOMES` (agent) and `LeadStatus`
  (backend) identical.
```

