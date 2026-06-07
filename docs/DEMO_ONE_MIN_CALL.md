# One-Minute Demo Call Script (Prospect Lines)

Prospect-side script for a ~60-second live PSTN call that hits Alex's highest-impact behaviors in one booked conversation.

**Presenter pitch:** [DEMO_SCRIPT.md](DEMO_SCRIPT.md) · **Full validation checklist:** [TRAIN_CALL_VALIDATION.md](TRAIN_CALL_VALIDATION.md)

---

## Setup (before you answer)

```bash
pnpm dev                    # or backend + agent-py + frontend
pnpm reset:leads            # Michael should be pending, not booked
pnpm train:call             # dispatches Michael Truell (whale UC2)
# or: open estimate page for b1000000-0001-0000-0000-000000000001 → Get my plan
```

**Lead:** Michael Truell · Cursor · UC2 estimate completed · ~$19M/year savings hook  
**Goal outcome:** `booked`  
**Pace:** Speak each line once, clearly; let Alex finish before the next beat.

---

## Capability map (what each line triggers)

| Time | You say | Alex should demonstrate |
|------|---------|-------------------------|
| 0s | *(answer phone)* "Hello?" | Canonical opener — AI identity, pump.co, estimate follow-up |
| 8s | "Wait — who is this? Are you a robot?" | AI identity philosophy + why the call exists |
| 18s | "Why are you calling me?" | Direct answer + annual savings + demo bridge (no spend re-ask) |
| 28s | "How is Pump free?" | Product answer + same-turn bridge toward demo |
| 38s | "I'm not interested." | Wolf persistence — rebuild, no goodbye |
| 48s | "Okay, I guess. What times do you have?" | Weak agreement → soft scheduling (interest warming) |
| 55s | "Tuesday at two works." | `book_meeting` + confirm invite |
| 60s | *(listen to confirm, hang up)* | `log_outcome(booked)` |

**Not in this 60s script** (use separate clips or the 2-min [DEMO_SCRIPT.md](DEMO_SCRIPT.md) instead):

- DNC ("take me off your list") — ends the call
- Email deferral ("just send me an email") — known weak spot; educate-first path is longer
- Talk-over twice / active-listening vent — needs longer agent turns
- UC1 spend ask / not-qualified exit — different lead (Sam or Alex SMB)

---

## The script (prospect lines only)

Read naturally; do not rush. Approximate timing assumes Alex responds in ~8–12s per turn.

```
[0s — phone rings, answer]

"Hello?"

[8s — right after Alex starts opener; optional talk-over beat]

"Wait — who is this? Are you a robot?"

[18s]

"Why are you calling me?"

[28s]

"How is Pump free?"

[38s]

"I'm not interested."

[48s — after Alex rebuilds once]

"Okay, I guess. What times do you have?"

[55s — when Alex proposes a slot]

"Tuesday at two works."

[60s — let Alex confirm booking, then hang up]
```

---

## Pass criteria (quick self-check)

After the call, confirm in dashboard / transcript:

- Alex disclosed AI in opener or first reply
- Alex cited **annual** savings (~nineteen million), never asked monthly spend
- Alex answered "how is Pump free" before pushing calendar
- Alex did **not** say goodbye after "not interested"
- Lead status → **`booked`**
- Transcript shows Moss context panel populated (if audience is watching dashboard)

---

## Delivery tips

- **One line per beat** — do not stack objections; 60s is tight.
- **"I'm not interested"** is the wolf beat — give Alex a full reply before softening.
- **Skip email deferral** in this script — it adds a turn and currently tends toward email capitulation.
- If Alex is slow on the first turn, skip the talk-over beat ("Wait — who is this?") and go straight to "Why are you calling me?"
- If booking slips past 60s, agreeing to any specific time is fine — the demo still lands.
