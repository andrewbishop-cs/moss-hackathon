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
