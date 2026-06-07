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

    if lead.use_case == "uc2_estimate_completed":
        text = (
            f"{name} from {company.name} ({company.company_size} employees) ran a "
            f"savings estimate on the Pump website showing about "
            f"{_money(company.spend_total)} per month in cloud spend, and Pump "
            f"projected they could save around {_money(company.savings_total)} per "
            f"month. They completed the estimate but did not start a trial. "
            f"Use case: UC2 (estimate completed, no trial)."
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

    metadata = {
        "lead_id": str(lead.id),
        "name": name,
        "first_name": lead.first_name,
        "company": company.name,
        "use_case": lead.use_case,
    }
    return DocumentInfo(
        id=str(lead.id),
        text=text,
        metadata={k: str(v) for k, v in metadata.items()},
    )


async def upsert_lead(lead: LeadWithCompany) -> None:
    similar = None
    if lead.use_case == "uc1_new_signup":
        similar = db.get_similar_company(lead.company.company_size, lead.company.id)
    doc = build_lead_document(lead, similar)
    await moss.add_docs(LEADS_INDEX, [doc], MutationOptions(upsert=True))
