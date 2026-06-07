"""FastAPI hub. The fake website and dashboard call these endpoints; nothing else
talks to Supabase / Moss / LiveKit directly.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src import calls, db
from src.config import FRONTEND_ORIGIN
from src.models import (
    LogOutcome,
    SaveTranscript,
    TriggerEstimateCompleted,
    TriggerNewSignup,
)

app = FastAPI(title="Pump backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CallTrigger(BaseModel):
    lead_id: UUID


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/leads")
def get_leads():
    return db.list_leads()


@app.get("/leads/{lead_id}")
def get_lead(lead_id: UUID):
    try:
        return db.get_lead(lead_id)
    except Exception as exc:  # noqa: BLE001 - surface as 404 for the dashboard
        raise HTTPException(status_code=404, detail="lead not found") from exc


@app.get("/leads/{lead_id}/calls")
def get_calls(lead_id: UUID):
    """All call attempts for a lead, newest first (no transcripts — lean)."""
    return db.list_calls(lead_id)


@app.get("/leads/{lead_id}/transcript")
def get_transcript(lead_id: UUID):
    """The transcript of the lead's most recent call (null if none yet).

    Convenience for the dashboard's lead view. For a specific attempt, use
    GET /calls/{call_id}/transcript.
    """
    return {"lead_id": str(lead_id), "transcript": db.get_latest_transcript(lead_id)}


@app.get("/calls/{call_id}/transcript")
def get_call_transcript(call_id: UUID):
    """The transcript of one specific call attempt (null if not stored yet)."""
    return {"call_id": str(call_id), "transcript": db.get_call_transcript(call_id)}


@app.post("/triggers/new-signup")
async def trigger_new_signup(payload: TriggerNewSignup):
    """UC1: create the lead, then call them."""
    lead = db.create_signup(payload)
    room_name = await calls.start_call(lead.id)
    return {"lead": db.get_lead(lead.id), "room_name": room_name}


@app.post("/triggers/estimate-completed")
async def trigger_estimate_completed(payload: TriggerEstimateCompleted):
    """UC2: record the estimate on an existing lead, then call them."""
    db.set_estimate(payload.lead_id, payload.savings_total)
    room_name = await calls.start_call(payload.lead_id)
    return {"lead": db.get_lead(payload.lead_id), "room_name": room_name}


@app.post("/calls/trigger")
async def trigger_call(payload: CallTrigger):
    """Manual 'Call Now' from the dashboard."""
    room_name = await calls.start_call(payload.lead_id)
    return {"lead_id": str(payload.lead_id), "room_name": room_name}


@app.post("/calls/outcome")
async def call_outcome(payload: LogOutcome):
    # Lead snapshot (drives the dashboard table) + this attempt's row in `calls`.
    db.set_outcome(payload.lead_id, payload.status, payload.outcome_notes)
    if payload.room_name:
        db.set_call_outcome(payload.room_name, payload.status, payload.outcome_notes)
    retried = False
    if payload.status in calls.RETRY_OUTCOMES and calls.should_retry(payload.lead_id):
        # Voicemail/no-answer or a decline: re-dispatch ONCE, immediately. The
        # retry fires within seconds — for no_answer it lands inside iPhone's
        # 3-minute "Repeated Calls" window so the second call breaks through Do
        # Not Disturb / Focus; for declined it's one more instant attempt. The
        # retry is flagged so its own outcome can't spawn another (one per call).
        await calls.start_call(payload.lead_id, is_retry=True)
        retried = True
    return {"ok": True, "retried": retried}


@app.post("/calls/transcript")
async def save_transcript(payload: SaveTranscript):
    """Persist the full call transcript at call end (agent shutdown callback).

    Keyed by room_name to the matching row in the `calls` table.
    """
    db.save_call_transcript(payload.room_name, payload.transcript)
    return {"ok": True}
