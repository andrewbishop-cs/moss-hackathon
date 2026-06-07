# One-Minute Demo Call Script (Prospect Lines)

Prospect-side script for a **~60–90 second** live PSTN call — five beats that hit Alex's highest-impact behaviors in one booked conversation.

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
**Pace:** Speak each line once, clearly; let Alex finish before the next beat (~15s per Alex turn on PSTN).

---

## Capability map (what each line triggers)

| Time | You say | Alex should demonstrate |
|------|---------|-------------------------|
| 0s | *(answer phone)* "Hello?" | Canonical opener — AI identity, pump.co, estimate follow-up |
| 15s | "Why are you calling me?" | Direct answer + annual savings + **named tier gift** (Mac Mini) + demo ask |
| 30s | "I'm not interested." | Wolf persistence — rebuild with savings/proof/ease + **explicit gift nudge**, no goodbye |
| 45s | "Okay, what times do you have?" *(optional)* | Alex proposes **Tuesday at two** — skip this beat if Alex already offered the slot |
| 55s | "Tuesday at two works." | `book_meeting` + confirm invite |
| 60–90s | *(listen to confirm, hang up)* | `log_outcome(booked)` |

**Not in this script** (use separate clips or the 2-min [DEMO_SCRIPT.md](DEMO_SCRIPT.md) instead):

- Robot / talk-over ("who is this? are you a robot?") — opener already discloses AI; adds a full extra turn
- "How is Pump free?" — product Q&A; wolf rebuild and savings answer usually cover "free to start"
- DNC ("take me off your list") — ends the call
- Email deferral ("just send me an email") — known weak spot; educate-first path is longer
- Talk-over twice / active-listening vent — needs longer agent turns
- UC1 spend ask / not-qualified exit — different lead (Sam or Alex SMB)

---

## The script (prospect lines only)

Read naturally; do not rush. Approximate timing assumes Alex responds in **~15s per turn** on live PSTN.

```
[0s — phone rings, answer]

"Hello?"

[15s — after Alex finishes opener]

"Why are you calling me?"

[30s]

"I'm not interested."

[45s — after Alex rebuilds once]

"Okay, what times do you have?"

[55s — when Alex proposes a slot]

"Tuesday at two works."

[60–90s — let Alex confirm booking, then hang up]
```

---

## Pass criteria (quick self-check)

After the call, confirm in dashboard / transcript:

- Alex disclosed AI in opener or first reply
- Alex cited **annual** savings (~nineteen million), never asked monthly spend
- Alex named the **Mac Mini** on the first bridge and again on the wolf beat
- Alex proposed **Tuesday at two** before the prospect volunteered a time
- Alex did **not** say goodbye after "not interested"
- Lead status → **`booked`**
- Transcript shows Moss context panel populated (if audience is watching dashboard)

---

## Delivery tips

- **One line per beat** — do not stack objections; five beats is the floor for a booked demo.
- **~15s per Alex turn** — wait for the full reply before your next line.
- **"I'm not interested"** is the wolf beat — give Alex a full reply before softening.
- Alex should propose **Tuesday at two** on weak agreement or when asked for times — if she does inside the wolf rebuild, **skip** "what times do you have?" and go straight to "Tuesday at two works."
- **Skip email deferral** — adds a turn and currently tends toward email capitulation.
- If booking runs past 90s, agreeing to any specific time still counts as a pass.
