"""Supabase access for companies + leads.

Returns Pydantic models from `models.py` so the API responses match the contract the
frontend codes against. supabase-py is synchronous; calling it from async endpoints is
fine for the hackathon's load.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from src.config import supabase
from src.models import (
    Company,
    LeadStatus,
    LeadWithCompany,
    TriggerNewSignup,
)

# Embed the related company row under the alias `company` for LeadWithCompany.
_LEAD_SELECT = "*, company:companies(*)"

# New UC1 signups insert companies without spend rows; Supabase returns nulls.
_COMPANY_NUMERIC = (
    "spend_aws",
    "spend_gcp",
    "spend_azure",
    "spend_openai",
    "spend_anthropic",
    "spend_total",
    "savings_aws",
    "savings_gcp",
    "savings_azure",
    "savings_openai",
    "savings_anthropic",
    "savings_total",
)


def _normalize_company(row: dict) -> dict:
    normalized = dict(row)
    for key in _COMPANY_NUMERIC:
        if normalized.get(key) is None:
            normalized[key] = 0
    return normalized


def _to_lead_with_company(row: dict) -> LeadWithCompany:
    company = _normalize_company(row.pop("company"))
    return LeadWithCompany(**row, company=Company(**company))


def list_leads() -> list[LeadWithCompany]:
    res = (
        supabase.table("leads")
        .select(_LEAD_SELECT)
        .order("created_at", desc=False)
        .execute()
    )
    return [_to_lead_with_company(r) for r in res.data]


def get_lead(lead_id: str | UUID) -> LeadWithCompany:
    res = (
        supabase.table("leads")
        .select(_LEAD_SELECT)
        .eq("id", str(lead_id))
        .single()
        .execute()
    )
    return _to_lead_with_company(res.data)


def create_signup(p: TriggerNewSignup) -> LeadWithCompany:
    """UC1: create the company (defaults to zero spend) and the lead."""
    company = (
        supabase.table("companies")
        .insert(
            {
                "name": p.company_name,
                "company_size": p.company_size,
                "cloud_provider": p.cloud_provider,
            }
        )
        .execute()
        .data[0]
    )
    lead = (
        supabase.table("leads")
        .insert(
            {
                "company_id": company["id"],
                "first_name": p.first_name,
                "last_name": p.last_name,
                "email": p.email,
                "phone": p.phone,
                "timezone": p.timezone,
                "use_case": "uc1_new_signup",
                "status": "pending",
            }
        )
        .execute()
        .data[0]
    )
    return get_lead(lead["id"])


def set_estimate(lead_id: str | UUID, savings_total: float) -> LeadWithCompany:
    """UC2: record the estimate on the lead's company and flag the lead as UC2."""
    lead = get_lead(lead_id)
    supabase.table("companies").update({"savings_total": savings_total}).eq(
        "id", str(lead.company_id)
    ).execute()
    supabase.table("leads").update({"use_case": "uc2_estimate_completed"}).eq(
        "id", str(lead_id)
    ).execute()
    return get_lead(lead_id)


def mark_calling(lead_id: str | UUID, room_name: str) -> None:
    supabase.table("leads").update(
        {
            "status": "calling",
            "room_name": room_name,
            "called_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", str(lead_id)).execute()


def set_outcome(
    lead_id: str | UUID, status: LeadStatus, notes: str | None = None
) -> None:
    supabase.table("leads").update(
        {"status": status, "outcome_notes": notes}
    ).eq("id", str(lead_id)).execute()


def reset_leads() -> int:
    """Reset every lead to a clean pre-demo state. Returns the row count.

    Mirrors backend/seed/reset_leads.sql: sets status back to `pending` and clears
    the transient call fields so the dashboard/queue/analytics start fresh.
    Contact info and use-case are preserved. The `.neq` on a sentinel id is the
    supabase-py idiom for "update all rows".
    """
    res = (
        supabase.table("leads")
        .update(
            {
                "status": "pending",
                "room_name": None,
                "called_at": None,
                "outcome_notes": None,
            }
        )
        .neq("id", "00000000-0000-0000-0000-000000000000")
        .execute()
    )
    return len(res.data)


def get_similar_company(
    company_size: str, exclude_id: str | UUID
) -> Company | None:
    """Pick a comparable company (same size, biggest savings) for the UC1 hook."""
    res = (
        supabase.table("companies")
        .select("*")
        .eq("company_size", company_size)
        .neq("id", str(exclude_id))
        .order("savings_total", desc=True)
        .limit(1)
        .execute()
    )
    return Company(**_normalize_company(res.data[0])) if res.data else None
