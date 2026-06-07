# Integration Checklist — Frontend ↔ Backend ↔ Agent

Run this when Andrew's FastAPI hub is up on `:8000`. Paul owns the frontend; Andrew owns the backend + agent worker.

## Prerequisites (three terminals)

```bash
# Terminal 1 — backend hub
pnpm dev:backend          # http://localhost:8000

# Terminal 2 — agent worker (needed for dispatch / calls)
pnpm dev:agent-py

# Terminal 3 — frontend
pnpm dev:frontend         # http://localhost:3000
```

**Env checks**

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_BACKEND_URL` | `frontend/.env.local` | Points at `http://localhost:8000` (default if unset) |
| `NEXT_PUBLIC_USE_FIXTURES` | `frontend/.env.local` | Leave **unset** or `false` for real integration |
| Supabase + LiveKit creds | `backend/.env`, `agent-py/.env.local` | Andrew configures |

## Step 0 — Automated smoke test

```bash
chmod +x scripts/smoke-backend.sh
./scripts/smoke-backend.sh              # read-only: health + GET /leads
./scripts/smoke-backend.sh --full       # also POST triggers (dispatches agent!)
```

**Pass criteria (read-only):** all checks green, `/leads` returns ≥1 lead with nested `company`.

If smoke fails with connection refused → start `pnpm dev:backend`.

---

## Step 1 — Dashboard loads real data

1. Open http://localhost:3000/dashboard
2. **Expect:** lead queue table (no “Couldn't reach the backend” error)
3. **Expect:** 15 seeded leads from Supabase (Cursor, Clay, Perplexity, etc.)
4. **Not expect:** amber “Demo data · backend offline” badge

**If it fails:** CORS (check browser console), wrong API URL, or backend not running.

---

## Step 2 — UC2 estimate flow (hero demo)

1. Open http://localhost:3000/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001
   - Demo lead: Michael Truell @ Cursor (UC2, pending)
2. Enter monthly spend, click **Get my plan**
3. **Expect:** success message (“We'll call you shortly”)
4. **Expect:** `POST /triggers/estimate-completed` → `{ lead, room_name }`
5. Open http://localhost:3000/dashboard — lead status should update (may show `calling`)
6. If agent worker is running: phone rings (or in-browser fallback if SIP not wired)

---

## Step 3 — UC1 signup flow

1. Open http://localhost:3000/pump
2. Fill signup form (use a **verified** phone number if Twilio trial)
3. Submit
4. **Expect:** “Account created — you'll hear from us shortly”
5. **Expect:** new lead appears in dashboard queue with `uc1_new_signup`

---

## Step 4 — Call Now + live view

1. Open http://localhost:3000/dashboard
2. Click **Call Now** on a pending lead
3. **Expect:** navigates to `/dashboard/calls/[id]`
4. **Expect:** `GET /leads/:id` returns `room_name`
5. **Expect:** live transcript area connects (or “Connecting…” then messages)
6. **Expect:** right panel shows lead context + Moss results as agent runs

**If no room:** backend didn't store `room_name` on dispatch — ping Andrew.

**If transcript empty but connected:** agent worker may not be running (`pnpm dev:agent-py`).

---

## Step 5 — Analytics

1. Open http://localhost:3000/dashboard/analytics
2. **Expect:** funnel counts match lead statuses from `GET /leads`
3. Trigger a call or change a status — counts should update within ~5s (polling)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| “Couldn't reach the backend” | `:8000` not running | `pnpm dev:backend` |
| CORS error in browser console | Origin not allowed | Andrew: `FRONTEND_ORIGIN` / CORS in `main.py` |
| Empty lead list | Seed not loaded | Re-run Supabase migrations + seed |
| Call Now succeeds but no transcript | Agent worker down | `pnpm dev:agent-py` |
| Phone doesn't ring | SIP not wired / Twilio trial | Verified number on lead, or in-browser fallback |
| `fetch failed` | Wrong host/port | Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` |

---

## Demo-day run-of-show (UC2 first)

1. **Pitch problem** (20s) — PLG visitors walk away after finding savings
2. **UC2 demo** (40s) — estimate page → submit → phone rings → show dashboard live view + transcript → booked
3. **UC1 demo** (20s) — signup form → phone rings → social proof hook
4. **Sponsor callouts** — LiveKit (SIP + inference), Moss (real-time context)

Keep dashboard open on projector before starting UC2 so judges see the queue update in real time.
