# Alex Implementation Backlog

Translates [BEHAVIORAL_PRINCIPLES.md](BEHAVIORAL_PRINCIPLES.md) into code, prompt, knowledge, and tests. Cursor owns architecture lane; Paul + ChatGPT own sales behavior lane.

| Priority | Principle | Proposed Change | File(s) | Owner | Status |
|----------|-----------|-----------------|---------|-------|--------|
| P0 | All principles | Add coaching loop docs (log, principles, backlog) | `docs/COACHING_LOG.md`, `docs/BEHAVIORAL_PRINCIPLES.md`, `docs/IMPLEMENTATION_BACKLOG.md` | Cursor | implemented |
| P0 | Savings-centric + incentive nudge | Add `# Sales behavior` section to system prompt | `agent-py/src/agent.py` | Cursor | implemented |
| P0 | Internal tiers private | Ban spoken tier/size language in prompt; rewrite enterprise/whale offer kb + spoken Michael example | `agent.py`, `knowledge.json`, `AGENT_SCRIPT.md` | Cursor | implemented |
| P0 | Behavioral anchors | Add `kb-behavior-*` entries (6) | `knowledge.json` | Cursor | implemented |
| P1 | Early soft meeting | Expand positive-curiosity phrases (onboarding, security, pricing, customers) | `call_signals.py` | Cursor | implemented |
| P1 | Weak agreement | Add `fine`; align coaching hints with principles | `call_signals.py` | Cursor | implemented |
| P1 | Scheduling recovery | Align rebuild hint with principles; document 3-cycle rule in prompt | `agent.py`, `call_signals.py` | Cursor | implemented |
| P1 | Conversational persistence | Add persistence + hard-stop rules to prompt; `is_hard_stop()` helper | `agent.py`, `call_signals.py` | Cursor | implemented |
| P1 | AGENT_SCRIPT sync | Add Behavioral Principles section; fix offer scripts | `docs/AGENT_SCRIPT.md` | Cursor | implemented |
| P1 | Tests | Expand `test_call_signals.py`; add `test_behavior_knowledge.py` | `agent-py/tests/` | Cursor | implemented |
| P2 | Opening tease | Opening says "I have an offer" before Q&A — confirm this matches savings-first positioning | `agent.py`, `knowledge.json` | Paul | implemented |
| P1 | Opener (short and conversational) | Update `_opening_for()`, OPEN step, kb-uc1/2-opening, AGENT_SCRIPT.md | `agent.py`, `knowledge.json`, `docs/` | Cursor | implemented |
| P1 | Direct answering | Add `# Answering questions` section + `kb-behavior-direct-answering` | `agent.py`, `knowledge.json` | Cursor | implemented |
| P1 | Call-start latency | Investigate startup timing, LiveKit connect, VAD thresholds, turn detection, initial greeting trigger; prewarm Moss indexes + phase timing logs | `agent.py` | Cursor | implemented |
| P1 | Conversation drop-off | Investigate response streaming, turn detection, interruption handling, session lifecycle, timeout config, worker stability | `agent.py` | Cursor | open |
| P1 | Hard stop exit | HARD_STOP_HINT, expanded phrases, prompt tightening, safety net, kb-behavior-hard-stop-exit | `call_signals.py`, `agent.py`, `knowledge.json` | Cursor | implemented |
| P1 | Canonical opener | Fixed pump.co opener via `_spoken_opening`; update kb + docs | `agent.py`, `knowledge.json`, `docs/` | Cursor | implemented |
| P1 | Four-sentence cap | Hard 4-sentence max; last sentence must be a question | `agent.py`, `knowledge.json` | Cursor | implemented |
| P2 | Rebuild cycle counter | Runtime counter for 3 full rebuild+schedule cycles (today: prompt-only) | `agent.py` | Cursor | open |
| P2 | LLM-judged behavior evals | Judge tests for incentive-as-nudge and no tier language in speech | `test_agent.py` | Cursor | open |
| P2 | Training export sync | Regenerate export corpus after kb offer script changes | `agent-py/export/` | Cursor | open |

---

## Workflow

```mermaid
flowchart LR
  CL[COACHING_LOG.md] -->|promote| BP[BEHAVIORAL_PRINCIPLES.md]
  BP -->|ticket| IB[IMPLEMENTATION_BACKLOG.md]
  IB -->|implement| Code[agent.py / kb / signals / tests]
  Code -->|mark implemented| IB
```

1. **Observe** — row in COACHING_LOG (`observed`)
2. **Promote** — Paul + ChatGPT add/update BEHAVIORAL_PRINCIPLES (`promoted`)
3. **Ticket** — row in IMPLEMENTATION_BACKLOG (`open`)
4. **Implement** — Cursor lands changes (`implemented`)
5. **Re-index** — `pnpm moss:index` after `knowledge.json` edits

---

## Questions requiring human sales judgment

| # | Question | Default until decided |
|---|----------|----------------------|
| 1 | Should opening line drop "I have an offer for you" and lead with savings/estimate only? | **Decided:** yes — opener includes UC2 savings + soft questions invite; no offer/incentive in opener |
| 2 | Mac Mini + senior AE loop-in — speak about senior team without referencing spend tier? | "I'll make sure the right person from our team joins the demo" |
| 3 | Disqualify scripts use "at that spend level" — acceptable because it's exit not flattery? | Yes, keep for not-qualified exits |
