"""The call pipeline: index the lead into Moss, then dispatch the agent.

We use the agent-initiated outbound pattern: the backend only dispatches the agent into
a fresh room with `{ phone_number, lead_id, use_case }` metadata. The agent itself places
the SIP call (see agent-py/src/agent.py). The generated room name is stored on the lead so
the dashboard can join that room read-only.
"""

from __future__ import annotations

import json
import time
from uuid import UUID

from livekit import api

from src import db, moss_index
from src.config import AGENT_NAME

# Outcomes that trigger one instant automatic callback:
#   - no_answer: voicemail / no pickup. The retry lands inside iPhone's 3-minute
#     "Repeated Calls" window so the second call breaks through Do Not Disturb.
#   - declined: a soft/hard no. One more immediate attempt before giving up.
RETRY_OUTCOMES: frozenset[str] = frozenset({"no_answer", "declined"})

# Whether the most recent call dispatched for a lead was itself an auto-retry.
# Each fresh call (manual "Call Now" or a use-case trigger) is eligible for ONE
# retry; the retry it spawns is not, which caps it at one extra attempt per call
# without ever looping. Resets on every fresh call, so no backend restart is
# needed between demo runs.
_call_was_retry: dict[str, bool] = {}


def should_retry(lead_id: str | UUID) -> bool:
    """True if this lead's current call is allowed to spawn one auto-retry.

    A call is retry-eligible unless it was itself a retry.
    """
    return not _call_was_retry.get(str(lead_id), False)


async def start_call(lead_id: str | UUID, *, is_retry: bool = False) -> str:
    """Index the lead and dispatch the agent. Returns the LiveKit room name."""
    lead = db.get_lead(lead_id)
    await moss_index.upsert_lead(lead)

    room_name = f"call-{str(lead.id)[:8]}-{int(time.time())}"
    metadata = json.dumps(
        {
            "phone_number": lead.phone,
            "lead_id": str(lead.id),
            "use_case": lead.use_case,
        }
    )

    lkapi = api.LiveKitAPI()
    try:
        await lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=AGENT_NAME,
                room=room_name,
                metadata=metadata,
            )
        )
    finally:
        await lkapi.aclose()

    # Record this attempt in the calls table (history + transcript live there).
    # The agent's later outcome/transcript writes correlate back by room_name.
    db.create_call(lead.id, room_name, lead.use_case, is_retry)
    # Lead keeps a denormalized snapshot of the latest call for the table view.
    db.mark_calling(lead.id, room_name)
    _call_was_retry[str(lead.id)] = is_retry
    return room_name
