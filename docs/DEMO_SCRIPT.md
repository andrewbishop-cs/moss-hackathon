# Demo Script — Pump Voice AI (2 min)

Exact spoken words for the live pitch. **Three tiers, not three use cases.** UC2 is the primary live trigger; UC1 is a one-line queue gesture.

Click path and setup: [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md) · Context for Anthropic: [ANTHROPIC_DEMO_CONTEXT.md](ANTHROPIC_DEMO_CONTEXT.md)

---

## Full version (~2:00)

**Screen:** Dashboard open at `http://localhost:3000/dashboard`

### 1. Problem (0:00–0:15)

> "PLG companies lose ninety percent of visitors before they ever convert. These aren't cold leads — they just ran a savings estimate, found real money on the table, and walked away. Nobody calls them. Email drip doesn't work. We built an AI that does."

---

### 2. Tier queue (0:15–0:25)

*Point at three rows — do not mention UC1/UC2 badges.*

> "Here's our lead queue. Same agent, three outcomes. Sam at Pinewood — four thousand a month — **not qualified**, under our five-K minimum. Alex at Beacon Labs — twelve K — **SMB**, gets a DoorDash credit. Michael Truell at Cursor — eight and a half million a month — **whale**, gets a Mac Mini and a senior AE. One agent qualifies on spend and scales the offer."

| Row | Say |
|-----|-----|
| Sam Okonkwo · Not qualified | "Under threshold — agent winds down gracefully, no hard sell." |
| Alex Rivera · SMB · DoorDash | "Qualified — DoorDash credit on a demo." |
| Michael Truell · Whale · Mac Mini | "Whale — Mac Mini, senior AE looped in." |

---

### 3. UC2 demo — Call 1, SMB (0:25–0:50)

**Paul says (transition to estimate page):**

> "Watch what happens when someone abandons their estimate."

*Navigate to:* `http://localhost:3000/pump/estimate?lead_id=b1000000-0016-0000-0000-000000000016`

*Click **Get my plan**.*

**Paul says (while dashboard flips to `calling`):**

> "That triggers an outbound call in under a second. Alex at Beacon Labs — twelve K a month, about thirty-three K a year in savings sitting there."

*Click Alex's row → live call view.*

**Paul says (over live transcript):**

> "Phone's ringing. Alex — our AI CSM — opens with their savings number, qualifies them, and offers the DoorDash credit. You can see the transcript and Moss pulling playbook context live on the right."

**Agent should say (reference — don't read aloud):**

> "Hey Alex, this is Alex — I'm an AI customer success manager at Pump. You ran a savings estimate on our site and I wanted to follow up personally — I actually have an offer for you. … I'm calling because we found thirty-three thousand in savings for you this year … We'd love to send you a twenty-dollar DoorDash credit as a thank you."

*If call connects: answer briefly, let agent run one exchange, hang up or let it book.*

**Paul says (transition):**

> "Same agent, different tier — watch the offer change."

*Run `reset_demo_leads.sql` if status stuck on `calling`.*

---

### 4. UC2 demo — Call 2, Whale (0:50–1:25) — HERO

*Navigate to:* `http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001`

*Click **Get my plan**.*

**Paul says:**

> "Michael Truell at Cursor — eight and a half million a month in cloud spend. Estimate found one point five eight million a month in savings. That's nineteen million a year."

*Phone rings — answer on speaker if possible.*

**Paul says (over live call / transcript):**

> "Mac Mini, senior AE flagged. Real PSTN call over LiveKit SIP — not a browser toy."

**Agent should say (reference):**

> "Hey Michael, this is Alex — I'm an AI customer success manager at Pump. … We found nineteen million in savings for you this year … for a company your size, we'll send you a Mac Mini on us. I'm also going to personally loop in one of our senior team members."

*Optional: agree to a meeting time → status flips to `booked` on analytics.*

---

### 5. UC1 beat — optional, one sentence (1:25–1:30)

*Gesture at Sam's row — no live call.*

> "And for new signups who never ran an estimate — same agent, social-proof hook instead of savings — but under five K, it still knows to walk away."

---

### 6. Why voice AI (1:30–1:45)

> "This only works now. Voice AI is finally good enough to qualify, handle objections, and book meetings — without a twenty-person SDR team. Warm leads, real-time, personalized."

---

### 7. Sponsors (1:45–2:00)

> "**LiveKit** — SIP telephony, inference, real-time rooms. The call you just heard went out over their stack. **Moss** — sub-ten-millisecond semantic search so the agent pulls the right playbook and lead context mid-conversation. Every PLG company in this room has this problem."

---

## Tight-time variant (~1:15)

Use when you're running long or only have one clean PSTN window.

| Segment | Time | Script |
|---------|------|--------|
| Problem | 12s | Same as full, trimmed: stop after "Nobody calls them." |
| Tier queue | 15s | All three rows in one breath — Sam not qualified, Alex SMB DoorDash, Michael whale Mac Mini |
| Whale call only | 45s | Skip estimate page for Alex. Go straight to Michael's estimate URL → Get my plan → live view → answer phone |
| UC1 gesture | 5s | Point at Sam: "New signup, under threshold — agent exits gracefully." |
| Why + sponsors | 18s | Combine: "Voice AI is finally good enough… Built on LiveKit for telephony and Moss for live context." |

**Tight-time narration for skipped SMB call:**

> "Alex at Beacon Labs would get a DoorDash credit — same flow, smaller offer. I'm going straight to the whale."

---

## Paul vs agent — cheat sheet

| Moment | Paul | Agent (Alex) |
|--------|------|--------------|
| Queue intro | Names tiers and spend | — |
| Before Call 1 | "Watch what happens when someone abandons their estimate." | — |
| During Call 1 | Narrate savings + DoorDash offer from dashboard | Opens with estimate follow-up, quotes ~$33K/yr savings, offers DoorDash |
| Between calls | "Same agent, different tier." | — |
| Before Call 2 | "$8.5M spend, $19M/year savings, Mac Mini." | — |
| During Call 2 | "Real PSTN over LiveKit." | Whale offer + senior AE |
| UC1 gesture | One sentence on Sam row | (Would say: "saw you created an account" → ask spend → not qualified exit) |

---

## Screen transitions

```
Dashboard (queue)
  → /pump/estimate?lead_id=...0016  [Call 1]
  → /dashboard/calls/b1000000-0016...  [live view]
  → Dashboard (reset if needed)
  → /pump/estimate?lead_id=...0001  [Call 2 — hero]
  → /dashboard/calls/b1000000-0001...  [live view]
  → Dashboard (optional: /dashboard/analytics if booked)
```

---

## Pre-demo checklist

- [ ] `pnpm dev:backend`, `pnpm dev:agent-py`, `pnpm dev:frontend` running
- [ ] `./scripts/smoke-backend.sh` passes
- [ ] `setup_tier_demo.sql` run once; `reset_demo_leads.sql` before this run
- [ ] Hero phone set to Twilio-verified E.164
- [ ] iPhone: DND off for demo window, ringer on, Twilio number in Favorites
- [ ] Dashboard tab pre-loaded; estimate URLs bookmarked

---

## Fallback lines

| Issue | Say |
|-------|-----|
| Phone doesn't ring | "Call dispatched — you can see the live transcript and Moss context on the dashboard. PSTN is the same path; we're showing the agent side." |
| Agent slow to start | "Agent worker is joining the room — transcript will populate in a few seconds." |
| Call 1 fails | Skip to Whale: "Tight on time — going straight to the whale call." |
