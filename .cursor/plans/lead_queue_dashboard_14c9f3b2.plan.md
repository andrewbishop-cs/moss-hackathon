---
name: Lead Queue Dashboard
overview: Build a Next.js lead-queue dashboard that displays the 15 seeded Supabase leads with company context and live status, plus a per-lead "Call" action (and auto-call-pending mode) that dispatches the LiveKit agent with the lead's use_case so it runs the right script.
todos:
  - id: supabase-client
    content: Add @supabase/supabase-js + Supabase env vars to frontend; create server-side lead fetch helper (lib/leads.ts)
    status: completed
  - id: dashboard-ui
    content: "Build /dashboard route with lead table: name, company, UC badge, spend, savings, status badge"
    status: completed
  - id: realtime
    content: Add Supabase realtime (or polling fallback) so lead status updates live
    status: completed
  - id: call-route
    content: Add /api/call route that dispatches the agent with {lead_id, use_case} metadata and sets status to calling
    status: completed
  - id: call-ui
    content: Add per-lead Call button + Auto-call pending toggle to the dashboard
    status: completed
  - id: agent-contract
    content: Document the lead_id/use_case dispatch metadata contract for Andrew's agent changes
    status: completed
isProject: false
---

# Lead Queue Dashboard

## Recommendation
Build the **dashboard** before the fake website. It uses the data you just seeded, has no dependency on Andrew's backend, and is where call-triggering naturally lives.

## What exists to build on
- Supabase has 5 companies + 15 leads (live), schema matches [backend/src/models.py](backend/src/models.py).
- Frontend is a Next.js 15 app; LiveKit agent dispatch pattern already exists in [frontend/app/api/token/route.ts](frontend/app/api/token/route.ts) (uses `RoomAgentDispatch` + metadata).
- Supabase keys live in [agent-py/.env.local](agent-py/.env.local) (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUB_KEY`).

## Phase 1 - Read + display leads (no Andrew dependency)
- Add `@supabase/supabase-js` to [frontend/package.json](frontend/package.json) and the Supabase env vars to `frontend/.env.local`.
- Add a server-side data helper `frontend/lib/leads.ts` that fetches `leads` joined with `companies` using the secret key (server-only, avoids any row-level-security surprises).
- New route `frontend/app/dashboard/page.tsx` rendering a table: name, company, UC1/UC2 badge, monthly spend, monthly savings, status badge. Leave `/` as the existing voice demo.
- Build small presentational components (status badge, UC badge) styled to look like a real SaaS dashboard.

## Phase 2 - Live status updates
- Add a client component that subscribes to Supabase realtime on the `leads` table so status changes (`pending` -> `calling` -> `called`/`booked`) update without refresh.
- Note: realtime from the browser needs an RLS `select` policy for the publishable key; if RLS blocks it, fall back to lightweight polling of a server route. Decide at build time based on the project's RLS state.

## Phase 3 - Call trigger (the "auto-trigger" piece)
- Add `frontend/app/api/call/route.ts` that, given a `lead_id`, looks up the lead + company, then dispatches the agent into a new room with metadata `{ lead_id, use_case }` (same `livekit-server-sdk` + `RoomAgentDispatch` approach as the token route), and flips the lead's status to `calling` in Supabase.
- Dashboard UI: a per-lead "Call" button plus an "Auto-call pending" toggle that fires the pending leads sequentially.
- Agent contract (flag for Andrew): the Python agent in `agent-py/src/agent.py` currently reads only `user_id` from dispatch metadata; to run the right script it needs to also read `lead_id` + `use_case`. This is his Phase 3 work - I'll document the metadata shape the dashboard sends.

## What works now vs. depends on Andrew
- Works now: dashboard, live status, dispatching the agent for an in-browser call (the documented PSTN fallback in [docs/HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md)).
- Depends on Andrew: a real phone ringing (LiveKit SIP outbound trunk) and the agent reading `lead_id`/`use_case` to pick UC1 vs UC2.

## Open question for you
- Phone calls for the demo: are we targeting a real phone ringing (needs Andrew's SIP setup), or is the in-browser "judge joins as the lead" version fine for now? This only affects Phase 3 wiring, not Phases 1-2.