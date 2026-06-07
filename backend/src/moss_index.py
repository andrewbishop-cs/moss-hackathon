"""Per-lead indexing into the Moss `leads` index.

The agent's `get_lead_context` filters this index by `metadata.lead_id` (see
agent-py/src/agent.py), so we key each doc by the Supabase lead UUID and upsert it
right before dispatching the call.
"""

from __future__ import annotations

from moss import DocumentInfo, MutationOptions

from src import db
from src.config import LEADS_INDEX, moss
from src.models import Company, LeadWithCompany


def _money(amount: float) -> str:
    return f"${int(round(amount)):,}"


def build_lead_document(
    lead: LeadWithCompany, similar: Company | None = None
) -> DocumentInfo:
    company = lead.company
    name = f"{lead.first_name} {lead.last_name}"

    metadata = {
        "lead_id": str(lead.id),
        "name": name,
        "first_name": lead.first_name,
        "company": company.name,
        "use_case": lead.use_case,
    }

    if lead.use_case == "uc2_estimate_completed":
        # Spend stays monthly (tiers qualify on monthly spend). Savings is given
        # both monthly AND pre-computed annual (monthly x 12) so the agent can read
        # the annual figure directly for the UC2 hook instead of doing fragile
        # seven-figure mental math live on the call. See _instructions_for() in
        # agent-py/src/agent.py ("quote ANNUAL savings").
        annual_savings = company.savings_total * 12
        text = (
            f"{name} from {company.name} ({company.company_size} employees) "
            f"ran a savings estimate on the Pump website. "
            f"INTERNAL (tier routing only — never speak spend aloud): "
            f"monthly spend {_money(company.spend_total)}. "
            f"SPOKEN HOOK: annual savings {_money(annual_savings)} — "
            f"use this when leading with their estimate. "
            f"They completed the estimate but did not start a trial. "
            f"Use case: UC2 (estimate completed, no trial)."
        )
        metadata.update(
            {
                "monthly_spend": _money(company.spend_total),
                "monthly_savings": _money(company.savings_total),
                "annual_savings": _money(annual_savings),
                "estimate_completed": "true",
            }
        )
    else:
        similar_text = ""
        if similar is not None:
            similar_text = (
                f" Companies similar to {company.name}, like {similar.name}, save "
                f"about {_money(similar.savings_total)} per month with Pump."
            )
        text = (
            f"{name} signed up on the Pump website from {company.name} "
            f"({company.company_size} employees) but never ran a savings estimate."
            f"{similar_text} Use case: UC1 (new signup, no estimate)."
        )
        metadata["estimate_completed"] = "false"

    return DocumentInfo(
        id=str(lead.id),
        text=text,
        metadata={k: str(v) for k, v in metadata.items()},
    )


def _similar_for(lead: LeadWithCompany) -> Company | None:
    if lead.use_case == "uc1_new_signup":
        return db.get_similar_company(lead.company.company_size, lead.company.id)
    return None


def lead_profile_text(lead: LeadWithCompany) -> str:
    """The lead's profile as plain text — same content the agent used to fetch from
    the Moss leads index. We now pass this straight to the agent via dispatch
    metadata so it never has to query Moss for per-lead context (that path was
    slow, filter-only-on-local-index, and flaky with 503s)."""
    return build_lead_document(lead, _similar_for(lead)).text


async def upsert_lead(lead: LeadWithCompany) -> None:
    doc = build_lead_document(lead, _similar_for(lead))
    await moss.add_docs(LEADS_INDEX, [doc], MutationOptions(upsert=True))
