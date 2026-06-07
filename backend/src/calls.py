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

# Leads already auto-retried after a no_answer this process. Prevents the retry's
# own no_answer from looping into infinite calls. In-memory is fine for the
# hackathon (resets on restart); cleared when a non-no_answer outcome arrives so
# a future fresh call can retry again.
_retried_leads: set[str] = set()


def mark_retry_if_first(lead_id: str | UUID) -> bool:
    """Record + return True if this lead hasn't been auto-retried yet."""
    key = str(lead_id)
    if key in _retried_leads:
        return False
    _retried_leads.add(key)
    return True


def clear_retry(lead_id: str | UUID) -> None:
    """Forget a lead's retry flag (call on any non-no_answer outcome)."""
    _retried_leads.discard(str(lead_id))


async def start_call(lead_id: str | UUID) -> str:
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

    db.mark_calling(lead.id, room_name)
    return room_name
