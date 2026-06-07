# Agent Script & Conversation Design

## Agent Persona
- **Name**: Alex
- **Voice**: Qwen voice clone — warm, confident, slightly casual
- **Framing**: "I'm reaching out from Pump" — not "I'm an AI" unless asked
- **Tone**: Knowledgeable, not pushy. Always references something specific about them.

> **Where this script lives:** the *flow* (this doc's structure) is encoded in the agent's
> system prompt (`agent-py/src/agent.py`, Andrew). The *content* the agent looks up mid-call —
> objection rebuttals, product/pricing/offer facts, per-use-case talking points — lives in the
> Moss `knowledge` index, authored by **Paul** in `agent-py/knowledge.json` as
> `{ "id", "text", "metadata": { "category", "topic" } }` entries, retrieved via
> `search_knowledge`. Tune wording there, not in code. The objection table below is the seed
> for those entries.
>
> **Product framing:** Pump cuts **cloud (AWS/GCP/Azure) and AI (OpenAI/Anthropic)** spend —
> not AWS alone. The seed leads are AI companies (Cursor, ElevenLabs, Perplexity…) whose
> biggest line items are inference bills, so lean on "cloud *and* AI" savings.

---

# UC1 — New Signup Script
**Trigger**: Prospect created an account but hasn't run an estimate or trialed

### Opening
```
"Hey [Name], this is Alex from Pump. 
You just created an account — wanted to reach out personally. 
Did I catch you at an okay time?"
```

### Relevance Hook (use Moss to pull `similar_company` + `similar_savings`)
```
"We actually work with a bunch of companies similar to [Company] — 
[similar_company] for example is saving about [similar_savings] a month with us. 
Given your setup, I'd guess you're in a similar range."
```

### Value Statement
```
"What we do is automatically optimize your cloud and AI spend — 
you connect your accounts, we show you exactly what you'd save, 
takes about 10 minutes and there's no commitment."
```

### The Offer
```
"We're running a promo right now — anyone who starts a free trial 
and hops on a 20-minute call with our team gets a Mac Mini on us. 
We've done this for about 30 companies this month."
```

### Book the Call
```
"Worth a quick 20 minutes — I can send you a calendar link right now. 
Would that work?"
```

---

# UC2 — Estimate Completed Script
**Trigger**: Prospect ran a savings estimate (has a specific dollar amount) but didn't sign up

### Opening
```
"Hey [Name], this is Alex from Pump. 
You just ran a savings estimate on our site — wanted to follow up personally. 
Did I catch you at an okay time?"
```

### The Hook (lead with the number — this is the whole pitch)
```
"So you found [savings_estimate] in monthly savings — 
that's sitting there right now, you're just not capturing it. 
That's [annual_savings] a year."
```
*Note: calculate annual_savings = savings_estimate * 12, agent does this math*

### Value Statement
```
"Claiming it is actually pretty simple — 
you connect your cloud and AI accounts, we handle the optimization automatically. 
Most customers are live within a day."
```

### Close (no Mac Mini needed here — the savings IS the offer)
```
"Would it be worth a 20-minute call to walk through exactly how to capture that? 
I can send you a calendar link right now."
```

*Only add Mac Mini offer if they hesitate:*
```
"And just so you know — anyone who trials and gets on a call 
gets a Mac Mini on us. So there's really no downside."
```

---

## Shared Objection Handling

| Objection | Response |
|---|---|
| "We already have someone managing cloud costs" | "That's great — most of our customers use us alongside their existing setup. We find savings they haven't caught, especially on the AI/inference side. Worth a 20-min look?" |
| "We're not focused on this right now" | "Makes sense. When do you think it comes back up? I can circle back then." |
| "Is this an AI?" | "Yes, I'm an AI assistant from Pump. Want me to connect you with a human instead, or I can just send the calendar link?" |
| "How'd you get my number?" | "You provided it when you signed up / ran your estimate. Want me to remove it from our list?" |
| "Not interested" | "Totally fair, I'll note that and won't call again. Have a good one." → `log_outcome: declined_dnc` |
| "How much does it cost?" | "Pump takes a small percentage of what you save — so if we don't save you money, you don't pay anything." |

---

## Call Flow States

```
answered → opening → hook → value → offer → book → close
                                              ↓
                                          objection_handling → book / decline
```

## Moss Context Schema (indexed per lead before call)

The `leads` index holds one document per lead, derived from `LeadWithCompany` (the lead +
its joined company). Spend/savings are **cloud + AI**, matching the Supabase `companies`
table. Example (ElevenLabs lead):

```json
{
  "lead_id": "uuid",
  "first_name": "Mati",
  "company": "ElevenLabs",
  "company_size": "51-200",
  "cloud_provider": "aws",
  "spend_total": "$4.02M/month",
  "savings_total": "$999K/month",
  "spend_breakdown": "AWS $3.6M, OpenAI $420K",
  "savings_breakdown": "AWS $936K, OpenAI $63K",
  "use_case": "uc2_estimate_completed"
}
```

- The `text` field of the indexed doc is a natural-language blurb of the above (what the
  agent reads/speaks); `metadata.lead_id` is the filter key for `get_lead_context`.
- **UC1 social-proof reference** (`similar_company` / `similar_savings`) is *derived* by the
  backend at index time (pick a comparable seed company), not a column on the lead.

Agent queries Moss mid-call via `get_lead_context` (filtered by `lead_id`) — returns in
<10ms, agent speaks it naturally without breaking cadence.
