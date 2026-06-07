# Paul's To-Do — Frontend / Website

You own: the fake Pump website + dashboard (all in `frontend/`), **plus all script + lead
content**: `agent-py/knowledge.json` (the agent's sales playbook in Moss — see AGENT_SCRIPT.md
for the entry shape), `agent-py/leads.json` (dev lead data), and `backend/seed/seed_data.json`
(companies + leads). You don't touch *code* in `backend/`/`agent-py/` or the Supabase
schema/migrations — just those content/data files. Code the UI against the REST contract in
`backend/src/models.py`. See [HACKATHON_PLAN.md](HACKATHON_PLAN.md) + [ARCHITECTURE.md](ARCHITECTURE.md).

> Done: Supabase project + schema + 15 seeded leads (Paul). Andrew owns the backend from here.

## Phase 1 — Scaffold (don't wait on Andrew)
- [x] Add routes: `/pump` (fake website) and `/dashboard`
- [x] Build UI against fake JSON shaped like `models.py` (`LeadWithCompany`, `Company`)
- [x] Confirm the existing voice starter still runs (`pnpm dev:frontend`)

## Phase 2 — Fake Pump website
- [x] UC1 signup form (name, email, company, phone, cloud provider) → `POST /triggers/new-signup`
  - Show "Account created! You'll hear from us shortly."
- [x] UC2 estimate calculator (cloud + AI spend → savings result) → `POST /triggers/estimate-completed`
  - Show "You could save $X/month." then "We'll call you shortly."
- [x] Style like a real SaaS landing page (logo, hero, pricing-ish)

## Phase 3 — Dashboard
- [x] Lead queue (`/dashboard`): table from `GET /leads` — name, company, UC1/UC2 badge, status
- [x] "Call Now" button → `POST /calls/trigger` (by `lead_id`)
- [x] Auto-dialer: select leads, Call selected, optional schedule
- [x] Live call view (`/dashboard/calls/[id]`):
  - Join the LiveKit room read-only using `room_name` from `GET /leads/:id` (token via `frontend/app/api/viewer-token/route.ts`)
  - Render transcript + Moss context panel (reuse `hooks/useMossContextEvents.ts` + `components/app/moss-results-panel.tsx`)
  - Show UC1/UC2 label + lead context (spend, savings, similar company)

## Phase 4 — Analytics + polish
- [x] Analytics (`/dashboard/analytics`): funnel triggered → called → booked (counts from `GET /leads`)
- [x] Supabase realtime (or polling) so status updates without refresh
- [x] Demo polish: Beep/Notion UI, UC1 vs UC2 badge colors, auto-dialer

## Content — the agent's words (do alongside the UI)
- [x] Author the agent playbook in `agent-py/knowledge.json` (29+ entries: product, pricing, objections, UC hooks)
- [ ] Ping Andrew to re-run `pnpm moss:index` after latest knowledge edits
- [ ] (Optional) tweak dev lead blurbs in `agent-py/leads.json` for the demo

## Phase 5 — Demo prep (joint with Andrew)
- [ ] Dry-run UC1 + UC2 — follow [DEMO_RUN_OF_SHOW.md](DEMO_RUN_OF_SHOW.md) + [INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)
- [ ] Set hero lead phone to your Twilio-verified number (SQL in DEMO_RUN_OF_SHOW)
- [ ] iPhone DND prep + test call with DND on
- [ ] Ping Andrew: `pnpm moss:index` after knowledge.json updates

## Phase 6 — Stretch: deeper UI, analytics, transcripts & follow-up (if time)

> Priority: 6a analytics/UI first · 6b transcripts second · 6c email/LinkedIn last.
> Paul owns frontend only; flag Andrew for any new API/table work.

### 6a — Deeper analytics & dashboard UI (frontend-only)
- [ ] Analytics: UC1 vs UC2 conversion split (group `use_case` on existing `GET /leads` data)
- [ ] Analytics: connect rate + booked rate (% of triggered → called → booked)
- [ ] Analytics: disposition breakdown by spend tier (`lib/tiers.ts`) and cloud provider
- [ ] Analytics: simple bar chart or visual funnel (keep polling; no new endpoint required)
- [ ] Lead queue: post-call summary column or expandable row (`outcome_notes`, disposition, `called_at`)
- [ ] Live call view: post-call mode when `room_name` clears — show final disposition + insights instead of idle placeholder
- [ ] Call insights: richer call summary (disposition next action from LEAD_DISPOSITIONS.md + key Moss topics + highlights)

### 6b — Transcript reference (post-call)
- [ ] Ping Andrew: persist transcript chunks to Supabase during/after call + `GET /leads/:id/transcript` (see HACKATHON_PLAN fallback)
- [ ] **OR** frontend-only fallback: capture live transcript in session state during live view and stash per `lead_id` (localStorage / in-memory) for demo replay
- [ ] Post-call transcript panel on `/dashboard/calls/[id]` — scrollable replay after room ends
- [ ] Copy transcript button (clipboard) for quick reference

### 6c — Email & LinkedIn follow-up scripts (end-of-hackathon)
- [ ] Follow-up panel on call detail: draft **email** body from disposition + transcript highlights + lead context (name, savings, UC hook)
- [ ] Same panel: draft **LinkedIn** connection/note message (shorter, conversational tone)
- [ ] Surface disposition next action from [LEAD_DISPOSITIONS.md](LEAD_DISPOSITIONS.md) as the suggested CTA (e.g. "re-queue in 2 days", "AE notified")
- [ ] Copy-to-clipboard for each draft — no SendGrid/LinkedIn API needed for demo
- [ ] (Optional) Pull objection-handling lines from `agent-py/knowledge.json` / Moss topics discussed as "script reference" snippets

**Checkpoints**: P1 stubbed dashboard · P2 website fires triggers · P3 Call Now + live transcript · P4 analytics live
**Stretch checkpoint**: P6a richer funnel · P6b post-call transcript · P6c email/LinkedIn drafts

---

# API Contract — what to collect & what you get back

Base URL: `http://localhost:8000` (Andrew runs FastAPI here; ask him to enable CORS for `localhost:3000`).
All shapes come from `backend/src/models.py`. Enums:
- `company_size`: `"1-10" | "11-50" | "51-200" | "201-500" | "500+"`
- `cloud_provider`: `"aws" | "gcp" | "azure"`
- `use_case`: `"uc1_new_signup" | "uc2_estimate_completed"`
- `status`: `"pending" | "calling" | "called" | "booked" | "interested" | "callback" | "no_answer" | "declined"`

Shared response objects:

```jsonc
// Company
{
  "id": "uuid", "name": "Acme Corp", "company_size": "51-200", "cloud_provider": "aws",
  "spend_aws": 42000, "spend_gcp": 0, "spend_azure": 0, "spend_openai": 0, "spend_anthropic": 0, "spend_total": 42000,
  "savings_aws": 13240, "savings_gcp": 0, "savings_azure": 0, "savings_openai": 0, "savings_anthropic": 0, "savings_total": 13240,
  "created_at": "2026-06-06T10:00:00Z"
}

// Lead
{
  "id": "uuid", "company_id": "uuid",
  "first_name": "Sarah", "last_name": "Chen", "email": "sarah@acme.com", "phone": "+14155550101",
  "timezone": "America/New_York", "use_case": "uc2_estimate_completed", "status": "pending",
  "created_at": "2026-06-06T10:00:00Z", "called_at": null, "outcome_notes": null
}

// LeadWithCompany = Lead + { "company": Company }  ← what GET /leads returns
```

### Endpoints you call

| What | Method + path | You SEND | You GET back |
|---|---|---|---|
| UC1 signup (auto-calls) | `POST /triggers/new-signup` | `TriggerNewSignup` (below) | `{ "lead": LeadWithCompany, "room_name": string }` |
| UC2 estimate done (auto-calls) | `POST /triggers/estimate-completed` | `{ "lead_id": uuid, "savings_total": number }` | `{ "lead": LeadWithCompany, "room_name": string }` |
| "Call Now" (dashboard) | `POST /calls/trigger` | `{ "lead_id": uuid }` | `{ "lead_id": uuid, "room_name": string }` |
| List leads (queue + analytics) | `GET /leads` | — | `LeadWithCompany[]` |
| Lead detail (live view) | `GET /leads/:id` | — | `LeadWithCompany` (+ `room_name` if a call is live) |

`TriggerNewSignup` body (UC1 form collects exactly this):

```json
{
  "first_name": "Sarah",
  "last_name": "Chen",
  "email": "sarah@acme.com",
  "phone": "+14155550101",
  "company_name": "Acme Corp",
  "company_size": "51-200",
  "cloud_provider": "aws",
  "timezone": "America/New_York"
}
```

> Phone must be E.164 (`+1` + 10 digits). For UC2, the lead must already exist, so the
> estimate page needs a `lead_id` (pass it via query param, e.g. `/pump/estimate?lead_id=...`,
> or pick a demo lead). If you want the estimate to work for brand-new visitors, tell Andrew —
> that changes the `/triggers/estimate-completed` contract.

---

# Copy-paste prompts (paste into Cursor, one at a time)

### 1. UC1 signup page
```
Create a Next.js page at frontend/app/pump/page.tsx for a fake SaaS product called "Pump"
that cuts cloud and AI bills. Hero + a signup form collecting: first_name, last_name, email,
phone (E.164, default +1), company_name, company_size (select: 1-10, 11-50, 51-200,
201-500, 500+), cloud_provider (select: aws, gcp, azure). Default timezone to
"America/New_York". On submit, POST the JSON to http://localhost:8000/triggers/new-signup,
then show "Account created — you'll hear from us shortly." Use the existing Tailwind +
shadcn/ui components in the repo. Handle loading and error states.
```

### 2. UC2 estimate calculator page
```
Create a Next.js page at frontend/app/pump/estimate/page.tsx: a "cloud + AI savings estimate"
calculator. Read lead_id from the query string. Inputs: monthly cloud + AI spend (number) and a
few checkboxes (Compute, Storage, AI inference). Compute savings_total = spend * 0.23 and show
"You could save $X/month" with a big number. On "Get my plan", POST
{ lead_id, savings_total } to http://localhost:8000/triggers/estimate-completed, then show
"We'll call you shortly." Match the Pump styling from app/pump/page.tsx.
```

### 3. Dashboard lead queue
```
Create frontend/app/dashboard/page.tsx: fetch GET http://localhost:8000/leads (returns
LeadWithCompany[]). Render a table: lead name, company.name, a UC1/UC2 badge from
use_case, status badge, and total spend (company.spend_total). Add a "Call Now" button per
row that POSTs { lead_id: lead.id } to http://localhost:8000/calls/trigger and, on success,
routes to /dashboard/calls/[lead_id]. Poll the list every 3s so statuses update.
```

### 4. Live call view (joins the LiveKit room read-only)
```
Create frontend/app/dashboard/calls/[id]/page.tsx. Fetch GET
http://localhost:8000/leads/:id to get the lead + company + room_name. Connect to that
LiveKit room as a read-only viewer using a token from the existing /api/token route, render
the live transcript, and show a Moss context side panel by reusing
hooks/useMossContextEvents.ts and components/app/moss-results-panel.tsx. Show a header with
the lead name, UC1/UC2 label, total spend (company.spend_total), and savings_total.
```

### 5. Analytics funnel
```
Create frontend/app/dashboard/analytics/page.tsx: fetch GET http://localhost:8000/leads and
compute a funnel from status counts: triggered (all) -> called (called/booked/no_answer/
declined) -> booked. Render three big stat cards plus a simple bar. Auto-refresh every 5s.
```
