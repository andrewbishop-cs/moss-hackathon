from pydantic import BaseModel, Field
from typing import Any, Optional, Literal
from datetime import datetime
from uuid import UUID

# ============================================================
# Enums
# ============================================================

UseCase = Literal["uc1_new_signup", "uc2_estimate_completed"]

# Lead-status contract. Canonical taxonomy = the 7-category disposition framework
# in docs/LEAD_DISPOSITIONS.md (what the dashboard displays + the agent emits),
# plus operational statuses the backend sets while a call is in flight.
#   - operational: "pending" (not yet called), "calling" (dispatched), "called"
#     (generic fallback)
#   - Cat 1 Meeting booked:        "booked"
#   - Cat 2 Interested / Not ready: "interested" (general) / "callback" (has a time)
#   - Cat 3 Not interested:        "declined"
#   - Cat 4 No connect:            "no_answer"
#   - Cat 5 Disqualified:          "disqualified"
#   - Cat 6 Bad data:              "bad_data"
#   - Cat 7 Re-engage in 90 days:  "reengage_90d"
LeadStatus = Literal[
    "pending",
    "calling",
    "called",
    "booked",
    "interested",
    "callback",
    "declined",
    "no_answer",
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
    # The call attempt this outcome belongs to. When present, the hub also stamps
    # the matching row in the `calls` table; the lead always gets the snapshot.
    room_name: Optional[str] = None


class SaveTranscript(BaseModel):
    lead_id: UUID
    # Correlates to a single row in the `calls` table (unique per dispatch).
    room_name: str
    # Full conversation as serialized by LiveKit's `session.history.to_dict()`
    # (a dict with an "items" list). Kept as `Any` so we don't couple the API to
    # the exact LiveKit schema — it's stored verbatim as jsonb and rendered by the
    # dashboard.
    transcript: Any


# ============================================================
# Call (one row per attempt in the `calls` table)
# ============================================================


class Call(BaseModel):
    """A single call attempt. Transcript is omitted here to keep list responses
    lean; fetch it per-call via GET /calls/{call_id}/transcript."""

    id: UUID
    lead_id: UUID
    room_name: str
    use_case: Optional[str] = None
    is_retry: bool = False
    status: str = "calling"
    outcome_notes: Optional[str] = None
    created_at: datetime
    ended_at: Optional[datetime] = None
