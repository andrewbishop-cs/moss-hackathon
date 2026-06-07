# Alex Coaching Log

Raw call-review observations. Paul + ChatGPT promote validated observations into [BEHAVIORAL_PRINCIPLES.md](BEHAVIORAL_PRINCIPLES.md). Cursor implements promoted rules via [IMPLEMENTATION_BACKLOG.md](IMPLEMENTATION_BACKLOG.md).

**Statuses:** `observed` → `promoted` → `implemented` | `rejected`

| Date | Call / Lead | Observation | Impact | Proposed Rule | Status |
|------|-------------|-------------|--------|---------------|--------|
| 2026-06-07 | — | Initial behavioral principles drafted from call-review sessions (savings-centric selling, incentive nudges, internal tiers, weak agreement, scheduling recovery, persistence). | High — shapes offer framing and booking flow | See BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Michael / UC2 | Opener should be short, direct, conversational — identify caller, explain why calling, start conversation. UC2 may include monthly savings from lead context. Soft "any questions about Pump?" invite OK. No promotions, incentives, Mac Mini, qualification questions, or pitch completion in opener. | High — first impression; repeated bad openers feel like spam | See Opener (Short and Conversational) in BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Multiple calls | Prospect says "Hello?" repeatedly before Alex speaks — call feels like robocall/spam before conversation begins. | High — trust destroyed before pitch starts | Engineering: call startup timing, LiveKit connect, VAD, turn detection, greeting trigger | promoted |
| 2026-06-07 | Multiple calls | When prospect asks a direct question (e.g. "Why are you calling me?"), Alex sometimes pivots to product pitch instead of answering first. | High — creates distrust and frustration | See Direct Answering in BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Multiple calls | Alex continues after "not interested"; sometimes writes log_outcome in speech instead of calling the tool — call stays open. | High — feels like spam; prospect keeps saying hello | See Respect Hard Stops in BEHAVIORAL_PRINCIPLES.md | promoted |
| 2026-06-07 | Train call | Alex opens hook-first ("Hey, I saw you ran an estimate") without identity intro; rambles past 3 sentences. | High — robocall feel; loses prospect attention | Canonical pump.co opener + four-sentence cap | promoted |
| 2026-06-07 | Michael / UC2 | Alex re-asks monthly spend after prospect ran estimate / read results. Prospect: "I thought you had my estimate data." | High — breaks trust; contradicts estimate flow | See Estimate-Aware Qualification in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Michael / UC2 | "Why are you calling?" answers stop at Q&A + evaluate savings — no demo/AE/free-trial bridge; feels circular. | High — no clear path to offer | See Direct Answering + Same-Turn Demo Bridge in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Multiple calls | After direct questions, Alex loops back to discovery instead of bridging same-turn to savings + demo/offer. | Medium — call stalls without moving toward booking | See Same-Turn Demo Bridge in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Multiple calls | Alex gives up too early on "not interested" / "I'm good" — logs declined and ends instead of rebuilding interest. | High — loses recoverable prospects | See Wolf Persistence in BEHAVIORAL_PRINCIPLES.md (reverses prior "Respect Hard Stops" row for soft objections) | implemented |
| 2026-06-07 | Multiple calls | Alex keeps talking when talked over twice — feels rude; also too silent when prospect is venting (robocall feel). | Medium — conversational etiquette + engagement | See Talk-Over Yield + Active Listening Ad-libs in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | — | Manual train-call validation for wolf / talk-over / DNC not yet run on live phone. | Medium — demo confidence | See [TRAIN_CALL_VALIDATION.md](TRAIN_CALL_VALIDATION.md) | open |
| 2026-06-07 | Multiple calls | When asked "are you a bot?" Alex should explain why the AI exists (programmed follow-up on savings opportunities), not dodge or mimic human. | High — trust on AI disclosure | See AI Identity Philosophy in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Michael / `call-b1000000-1780819582` | Scam skepticism → Alex proactively offers email (*"send more details by email"*). AI discomfort (*"weird sales tactic… back and forth in AI"*) → capitulates: *"What's the best email?"* | High — loses whale on deferral instead of selling meeting | See Meeting Value Selling in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Michael / `call-b1000000-1780822778` | Privacy pushback (*"not comfortable… you have my data"*) → immediate email offer instead of 10-min meeting argument | High — email escape hatch before prospect even asked | See Meeting Value Selling in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Multiple calls | On call deferral, Alex loops calendar asks without educating — doesn't give product info when prospect says no to meeting | High — feels like robocall, not helpful CSM | See Educate Before Re-Ask + Interest Threshold in BEHAVIORAL_PRINCIPLES.md | implemented |
| 2026-06-07 | Multiple calls | Alex asks for meeting before interest threshold met — premature calendar close on cold prospects | High — erodes trust on early nos | See Interest Threshold Framework in BEHAVIORAL_PRINCIPLES.md | implemented |

---

## How to add a row

1. After reviewing a call transcript or live listen, add a row with `observed`.
2. If Paul + ChatGPT agree it should become a rule, move to `promoted` and add/update BEHAVIORAL_PRINCIPLES.md.
3. Open an IMPLEMENTATION_BACKLOG item for Cursor; mark `implemented` when merged.
4. Use `rejected` with a one-line reason if the observation does not generalize.

**Keep notes raw here** — incomplete sentences, timestamps, quotes from the prospect are fine. Polished canonical wording belongs in BEHAVIORAL_PRINCIPLES.md only.
