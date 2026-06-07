# Ping Andrew — lead disposition sync

Copy-paste into Slack/text:

---

Hey Andrew — quick status sync on lead dispositions:

**Done on dashboard (Paul):**
- Full **7-category Pump disposition framework** wired — badges, labels, analytics, fixtures, auto-dialer
- Display labels (see [LEAD_DISPOSITIONS.md](LEAD_DISPOSITIONS.md)):
  - `booked` → "Meeting booked"
  - `interested` → "Spends on cloud – interested"
  - `callback` → "Interested / Not ready"
  - `declined` → "Not interested"
  - `no_answer` → "No connect"
  - `disqualified` → "Disqualified"
  - `bad_data` → "Bad data"
  - `reengage_90d` → "Re-engage in 90 days"
- [AGENT_SCRIPT.md](AGENT_SCRIPT.md) aligned to the same contract (no more `not_qualified` / `requested_human` slugs)

You can check off the "Heads-up for Paul" item in TODO_ANDREW.

**Need from you to complete the framework (categories 5–7):**
Dashboard is ready to display these, but backend + agent can't emit them yet:
- `disqualified` (Cat 5 — wrong ICP, no AWS/GCP, already a customer, not qualified/eligible on spend)
- `bad_data` (Cat 6 — wrong number, left company, duplicate)
- `reengage_90d` (Cat 7 — meeting held, revisit in ~90 days)

Suggested backend work:
1. Add those 3 values to `LeadStatus` in `backend/src/models.py`
2. Add to `VALID_OUTCOMES` in `agent-py/src/agent.py`
3. Teach agent `log_outcome` when to use each (mapping in AGENT_SCRIPT + LEAD_DISPOSITIONS)
4. Supabase migration if status is constrained
5. Re-run `pnpm moss:index` if knowledge entries change

Full spec: [LEAD_DISPOSITIONS.md](LEAD_DISPOSITIONS.md)
