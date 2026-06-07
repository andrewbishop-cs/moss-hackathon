"""FastAPI hub. The fake website and dashboard call these endpoints; nothing else
talks to Supabase / Moss / LiveKit directly.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src import calls, db, transcripts
from src.config import FRONTEND_ORIGIN
from src.models import (
    LogOutcome,
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


class TranscriptTurn(BaseModel):
    role: str
    text: str
    timestamp: str
    signal: str | None = None


class CallTranscriptPayload(BaseModel):
    lead_id: UUID
    room_name: str
    use_case: str
    turns: list[TranscriptTurn]
    saved_at: str | None = None


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


@app.get("/leads/{lead_id}/transcript")
def get_lead_transcript(lead_id: UUID):
    data = transcripts.get_latest_transcript(lead_id)
    if data is None:
        raise HTTPException(status_code=404, detail="transcript not found")
    return data


@app.post("/calls/transcript")
def save_call_transcript(payload: CallTranscriptPayload):
    path = transcripts.save_transcript(payload.model_dump(mode="json"))
    return {"ok": True, "path": str(path)}


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
    db.set_outcome(payload.lead_id, payload.status, payload.outcome_notes)
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
