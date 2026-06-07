# Demo Prep — Paul + Andrew Split with Timeline

## Context (current state)
- Phases 1–4 are done; we're in demo-prep. PSTN is confirmed working end-to-end (real phone rings).
- Andrew just shipped persisted transcripts on the backend (`POST /calls/transcript`, `GET /leads/:id/transcript`, `GET /calls/:id/transcript`, `calls` table). Decision: keep these endpoints as a **data asset only** — do NOT surface in the UI. Transcripts feed Paul's agent tuning.
- Demo is tier-based: Sam/Pinewood ($4K, not qualified) · Alex/Beacon Labs ($12K, SMB → DoorDash) · Michael/Cursor ($8.5M, Whale → Mac Mini). Hero call = Michael (`...0001`); SMB = Alex (`...0016`).
- Coordination risk: both Paul and Andrew may touch [agent-py/src/agent.py](../agent-py/src/agent.py) (Paul on `_instructions_for`/`_opening_for`, Andrew on transcript/SIP code). Pull before editing, keep edits in separate functions, commit small.

## Timeline (now ~12:23 AM → submit ~10:53 AM)
- **Hour 0–1 (12:23–1:23):** Paul trains agent · Andrew runs full stability test pass.
- **Hour 1–3 (1:23–3:23):** Paul applies content fixes + dry-run support · Andrew fixes any bugs the test pass surfaced, then joins dry runs.
- **Hour 3–4 (3:23–4:23):** Joint: 2–3 clean dry runs (UC2 SMB + Whale, UC1 gesture), record demo video + fallback video.
- **Then sleep.** Leave morning buffer for one final dry run + submission.

## Paul — Hour 1: Agent Training
Goal: tighten what the agent says using [agent-py/knowledge.json](../agent-py/knowledge.json), `_instructions_for()`/`_opening_for()`/`_USE_CASE_HOOKS` in [agent-py/src/agent.py](../agent-py/src/agent.py), and the new transcript data from recent calls.
- Pull transcript data: `GET /leads/:id/transcript` (or read the `calls` table) for recent dry-run calls; note where the agent rambled, missed the savings number, mishandled an objection, or didn't qualify on the $5K threshold.
- Fix prompt: keep opening line tight (lead name + savings number + offer), enforce the tier→offer mapping (SMB=$20 DoorDash, Whale=Mac Mini + senior AE, <$5K=graceful disqualify), confirm objection handling ("is this a scam?", "talk to a human").
- Fix knowledge: ensure `knowledge.json` tier/offer/pricing/objection entries match [docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md). Keep [docs/AGENT_SCRIPT.md](AGENT_SCRIPT.md) in sync.
- After knowledge edits: re-run `pnpm moss:index` (flag Andrew if it 429s — 3-index cap; delete-then-recreate or `add_docs(upsert=True)`).
- Restart `pnpm dev:agent-py` and do one console/voice test (`pnpm agent:py:console`) before any phone dry run.

## Paul — Hours 1–3: Todo after training
- Verify tier badges/offers render correctly on `/dashboard` for the three demo personas.
- iPhone DND prep + one test call with DND on ([docs/DEMO_IPHONE_PREP.md](DEMO_IPHONE_PREP.md)).
- (Optional polish, only if green) post-call summary column on the queue (`outcome_notes`, disposition, `called_at`) from [docs/TODO_PAUL.md](TODO_PAUL.md) phase 6a.
- Support joint dry runs; own the spoken pitch ([docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md)).

## Andrew — Demo Flow Stability Tests (the main ask)
Run each flow end-to-end against the real stack (3 processes up + `./scripts/smoke-backend.sh`). For each, confirm the expected result and the data written to Supabase. Reset between runs with `backend/seed/reset_demo_leads.sql` (or `uv --directory backend run python -m src.reset`); hero phones stay set.

1. **Cold boot + smoke:** `pnpm dev:backend`, `pnpm dev:agent-py`, `pnpm dev:frontend` → `./scripts/smoke-backend.sh` all green; `/health` ok.
2. **Dashboard load (`GET /leads`):** `/dashboard` shows all real leads, tier column correct, no "backend offline" badge.
3. **UC2 SMB (Alex, `...0016`):** `/pump/estimate?lead_id=...0016` → Get my plan → `POST /triggers/estimate-completed` → dashboard flips to `calling`, `room_name` set → real phone rings → agent gives ~$33K savings + DoorDash offer → outcome badge updates.
4. **UC2 Whale HERO (Michael, `...0001`):** same path → Mac Mini + senior AE offer → optional `book_meeting` → status `booked` → reflected on analytics.
5. **UC1 new signup:** `/pump` form (verified phone) → `POST /triggers/new-signup` → new lead with UC1 badge in queue → call → social-proof hook.
6. **Not-qualified exit (Sam, `...0017`, <$5K):** agent qualifies and winds down gracefully → status `disqualified` (no hard sell).
7. **Manual Call Now:** `/dashboard` → Call Now → `POST /calls/trigger` → routes to `/dashboard/calls/[id]`.
8. **Live call view:** read-only room join, live transcript renders, Moss context panel populates, header shows spend/savings.
9. **Outcome write-back + retry:** agent `log_outcome`/`book_meeting` → `POST /calls/outcome` → status updates; `no_answer`/`declined` triggers exactly one instant callback (lands in iPhone repeated-calls DND window), retry can't spawn another.
10. **Transcript persistence (data):** after a call, `GET /leads/:id/transcript` returns stored text and a row lands in `calls` (verify `save_call_transcript` keyed by `room_name` actually fires on agent shutdown).
11. **Analytics funnel:** `/dashboard/analytics` triggered → called → booked counts update via polling within ~5s.
12. **Failure/fallback drills:** status stuck on `calling` → reset SQL recovers; SIP/agent-worker-down → in-browser room-join fallback path still dispatches.

## Andrew — Hours 1–3
- Triage and fix any bug found in the test pass (priority: anything in flows 3, 4, 8 — the hero path).
- Re-run `pnpm moss:index` for Paul if it 429s.
- Join joint dry runs; own SIP/backend fallback if anything wobbles live.

## Hour 3–4: Lock + Record (joint)
- 2–3 clean dry runs following [docs/DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md) (UC2 SMB → Whale → UC1 gesture).
- Record the live demo video + a fallback clean-run video ([docs/FALLBACK_VIDEO.md](FALLBACK_VIDEO.md)).
- Freeze code. Sleep. Final dry run + submit in the morning with buffer.
