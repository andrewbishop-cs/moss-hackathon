# Alex Coaching Log

Raw call-review observations. Paul + ChatGPT promote validated observations into [BEHAVIORAL_PRINCIPLES.md](BEHAVIORAL_PRINCIPLES.md). Cursor implements promoted rules via [IMPLEMENTATION_BACKLOG.md](IMPLEMENTATION_BACKLOG.md).

**Statuses:** `observed` → `promoted` → `implemented` | `rejected`

| Date | Call / Lead | Observation | Impact | Proposed Rule | Status |
|------|-------------|-------------|--------|---------------|--------|
| 2026-06-07 | — | Initial behavioral principles drafted from call-review sessions (savings-centric selling, incentive nudges, internal tiers, weak agreement, scheduling recovery, persistence). | High — shapes offer framing and booking flow | See BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Michael / UC2 | Opener should be short, direct, conversational — identify caller, explain why calling, start conversation. UC2 may include monthly savings from lead context. Soft "any questions about Pump?" invite OK. No promotions, incentives, Mac Mini, qualification questions, or pitch completion in opener. | High — first impression; repeated bad openers feel like spam | See Opener (Short and Conversational) in BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Multiple calls | Prospect says "Hello?" repeatedly before Alex speaks — call feels like robocall/spam before conversation begins. | High — trust destroyed before pitch starts | Engineering: call startup timing, LiveKit connect, VAD, turn detection, greeting trigger | promoted |
| 2026-06-07 | Multiple calls | When prospect asks a direct question (e.g. "Why are you calling me?"), Alex sometimes pivots to product pitch instead of answering first. | High — creates distrust and frustration | See Direct Answering in BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Multiple calls | Alex sometimes stops speaking unexpectedly — long pauses, incomplete responses, abrupt termination, mid-call drop-offs. | High — conversation feels abandoned | Engineering: response streaming, turn detection, interruption handling, session lifecycle, timeouts, worker stability | promoted |

---

## How to add a row

1. After reviewing a call transcript or live listen, add a row with `observed`.
2. If Paul + ChatGPT agree it should become a rule, move to `promoted` and add/update BEHAVIORAL_PRINCIPLES.md.
3. Open an IMPLEMENTATION_BACKLOG item for Cursor; mark `implemented` when merged.
4. Use `rejected` with a one-line reason if the observation does not generalize.

**Keep notes raw here** — incomplete sentences, timestamps, quotes from the prospect are fine. Polished canonical wording belongs in BEHAVIORAL_PRINCIPLES.md only.
