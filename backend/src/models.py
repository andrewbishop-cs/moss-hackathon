from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

# ============================================================
# Enums
# ============================================================

UseCase = Literal["uc1_new_signup", "uc2_estimate_completed"]

# Shared lead-status contract: the UNION of every disposition the dashboard can
# display (Paul) and every outcome the agent can emit (see agent VALID_OUTCOMES).
#   - operational: "pending", "calling", "called"
#   - agent/script outcomes (docs/AGENT_SCRIPT.md): booked, not_qualified,
#     not_eligible, requested_human, callback, no_answer, declined, interested
#   - disposition framework Cat 5-7 (docs/LEAD_DISPOSITIONS.md, Paul): disqualified,
#     bad_data, reengage_90d
# NOTE: not_qualified/not_eligible (script) likely overlap with disqualified
# (disposition framework); consolidate once LEAD_DISPOSITIONS.md is the agreed
# source of truth. Kept as a superset for now so neither side breaks.
LeadStatus = Literal[
    "pending",
    "calling",
    "called",
    "booked",
    "interested",
    "callback",
    "not_qualified",
    "not_eligible",
    "requested_human",
    "no_answer",
    "declined",
    "disqualified",
    "bad_data",
    "reengage_90d",
]

# ============================================================
# Company
# ============================================================


class Company(BaseModel):
    id: UUID
    name: str
    company_size: str
    cloud_provider: str
    spend_aws: float = 0
    spend_gcp: float = 0
    spend_azure: float = 0
    spend_openai: float = 0
    spend_anthropic: float = 0
    spend_total: float = 0
    savings_aws: float = 0
    savings_gcp: float = 0
    savings_azure: float = 0
    savings_openai: float = 0
    savings_anthropic: float = 0
    savings_total: float = 0
    created_at: datetime


# ============================================================
# Lead
# ============================================================


class Lead(BaseModel):
    id: UUID
    company_id: UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    timezone: str
    use_case: UseCase
    status: LeadStatus = "pending"
    created_at: datetime
    called_at: Optional[datetime] = None
    outcome_notes: Optional[str] = None
    # LiveKit room for the lead's active/most-recent call. Set by the backend at
    # dispatch time so the dashboard can join that room read-only to watch the call.
    room_name: Optional[str] = None


class LeadWithCompany(Lead):
    company: Company


# ============================================================
# Request bodies
# ============================================================


class TriggerNewSignup(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    company_name: str
    company_size: str
    cloud_provider: str
    timezone: str = "America/New_York"


class TriggerEstimateCompleted(BaseModel):
    lead_id: UUID  # lead already exists in DB
    savings_total: float  # calculated on frontend


class LogOutcome(BaseModel):
    lead_id: UUID
    status: LeadStatus
    outcome_notes: Optional[str] = None
