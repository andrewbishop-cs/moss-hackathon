# Pump Lead Disposition Framework

> For use across call dispositions. Every lead maps to exactly one category. Each category has a single automated next action.

---

## Category 1 — Meeting Booked

**Next action:** AE notified immediately → deal created

### Qualifies if:
- Prospect agreed to a calendar hold with date and time confirmed
- Decision maker or strong influencer was on the call
- Call disposition is `Meeting booked`

**Backend status:** `booked`

---

## Category 2 — Interested / Not Ready

**Next action:** Re-queued in sequence → follow-up in **2 business days**
*(If prospect gives a specific future date, that date overrides the 2-day default)*

### Qualifies if:
- Expressed interest but gave a reason they can't move now
- Asked for a specific callback time or date
- Evaluating options, has a renewal coming up, or is in a budget cycle
- Call disposition is `Spends on cloud – interested`
- No hard no — door is clearly open

**Backend status:** `interested` (general interest) or `callback` (specific callback time in `outcome_notes`)

---

## Category 3 — Not Interested

**Next action:** Contact archived → account tagged **"Hard No"** with date

### Qualifies if:
- Explicitly said no with no opening left
- Currently locked into a long-term competitor contract
- No budget and no timeline to revisit

**Backend status:** `declined`

> **BDR judgment call:** The line between Category 2 and Category 3 is the most important call BDRs make. Misclassifying a 2 as a 3 is direct revenue loss. When in doubt, default to Category 2.

---

## Category 4 — No Connect

**Next action:** Back in dial queue → max 3 attempts → email-only sequence after 3rd miss

### Qualifies if:
- Voicemail reached
- Phone rang, no answer
- Gatekeeper answered with no referral or path forward

**Backend status:** `no_answer`

---

## Category 5 — Disqualified

**Next action:** Removed from all sequences → account flagged

### Qualifies if:
- No AWS or GCP usage, or wrong cloud provider entirely
- Company too small or outside ICP
- Wrong person contacted with no referral to the right one
- Call disposition did not result in "Spends on cloud – interested" or "Meeting booked"
- Already a Pump customer

**Backend status:** `disqualified` *(not yet in `models.py` — Andrew to add)*

---

## Category 6 — Bad Data

**Next action:** Routed to GTM engineer → re-enrich or delete

### Qualifies if:
- Phone number is wrong or disconnected
- Person no longer works at the company
- Duplicate contact record

**Backend status:** `bad_data` *(not yet in `models.py` — Andrew to add)*

---

## Category 7 — Re-engage in 90 Days

**Next action:** Parked → auto re-queued at 90 days *(HubSpot workflow needed — see note below)*

### Qualifies if:
- First meeting was held but prospect asked to revisit in a few months
- Not interested today but no hard disqualifier (e.g. budget freeze, recent reorg)
- Voicemail + no callback after 3 attempts with no disqualifying signal

**Backend status:** `reengage_90d` *(not yet in `models.py` — Andrew to add)*

> **Pipeline leak:** Contacts in this state currently fall through because the "Meeting Held" tag excludes them from standard filters. A dedicated workflow needs to be built to auto re-queue these contacts at 90 days. This is an open RevOps item.

---

## Channel-to-Category Mapping

| Call Disposition | Category | Backend `status` |
|---|---|---|
| Meeting booked | 1 — Meeting Booked | `booked` |
| Spends on cloud – interested | 2 — Interested / Not Ready | `interested` |
| Callback time requested | 2 — Interested / Not Ready | `callback` |
| Explicit no, locked in competitor | 3 — Not Interested | `declined` |
| Voicemail / no answer / gatekeeper | 4 — No Connect | `no_answer` |
| Wrong ICP, no AWS/GCP usage, already a customer | 5 — Disqualified | `disqualified` |
| Wrong number, left company, duplicate record | 6 — Bad Data | `bad_data` |
| Meeting held, asked to revisit later | 7 — Re-engage in 90 Days | `reengage_90d` |

---

## Dashboard display labels (Paul)

The frontend maps API `status` values to disposition labels in `frontend/lib/leads.ts` → `STATUS_LABEL`.

---

*Last updated: June 2026 | Sources: Nooks dispositions, Notion (Lead Stage Changes, RevOps Guide), Pump sales internal*
