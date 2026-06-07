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
    Call,
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


# ------------------------------------------------------------
# Calls: one row per attempt. Source of truth for history + transcripts.
# Correlated to the agent's later writes by room_name (unique per dispatch).
# ------------------------------------------------------------

_CALL_SELECT = (
    "id, lead_id, room_name, use_case, is_retry, status, outcome_notes, "
    "created_at, ended_at"
)


def create_call(
    lead_id: str | UUID,
    room_name: str,
    use_case: str | None,
    is_retry: bool = False,
) -> dict:
    """Insert a call row at dispatch time. The agent fills in outcome + transcript
    later, keyed on room_name. Returns the inserted row."""
    return (
        supabase.table("calls")
        .insert(
            {
                "lead_id": str(lead_id),
                "room_name": room_name,
                "use_case": use_case,
                "is_retry": is_retry,
                "status": "calling",
            }
        )
        .execute()
        .data[0]
    )


def set_call_outcome(
    room_name: str, status: LeadStatus, notes: str | None = None
) -> None:
    """Stamp the call attempt's disposition + end time (matched by room_name)."""
    supabase.table("calls").update(
        {
            "status": status,
            "outcome_notes": notes,
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("room_name", room_name).execute()


def save_call_transcript(room_name: str, transcript: object) -> None:
    """Persist the full transcript on the call attempt (matched by room_name)."""
    supabase.table("calls").update(
        {"transcript": transcript, "ended_at": datetime.now(timezone.utc).isoformat()}
    ).eq("room_name", room_name).execute()


def list_calls(lead_id: str | UUID) -> list[Call]:
    """All call attempts for a lead, newest first. Transcript omitted (lean)."""
    res = (
        supabase.table("calls")
        .select(_CALL_SELECT)
        .eq("lead_id", str(lead_id))
        .order("created_at", desc=True)
        .execute()
    )
    return [Call(**row) for row in res.data]


def get_call_transcript(call_id: str | UUID) -> object | None:
    """The transcript for one specific call attempt (None if not stored yet)."""
    res = (
        supabase.table("calls")
        .select("transcript")
        .eq("id", str(call_id))
        .single()
        .execute()
    )
    return res.data.get("transcript")


def get_latest_transcript(lead_id: str | UUID) -> object | None:
    """The transcript of the lead's most recent call attempt (None if none)."""
    res = (
        supabase.table("calls")
        .select("transcript")
        .eq("lead_id", str(lead_id))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0].get("transcript") if res.data else None


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


def reset_calls() -> int:
    """Delete all call history + transcripts so each demo run starts clean.
    Returns the number of rows removed."""
    res = (
        supabase.table("calls")
        .delete()
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
