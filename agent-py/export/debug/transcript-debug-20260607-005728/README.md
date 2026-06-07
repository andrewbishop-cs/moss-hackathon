# Transcript debug export

- **Exported:** 2026-06-07T07:57:28Z
- **Lead:** `b1000000-0001-0000-0000-000000000001`
- **Room:** `call-b1000000-1780817950`
- **Backend:** http://localhost:8000 (health=000000)

## Local transcript files (agent-py)
 - /Users/paulrusso/moss-hackathon/agent-py/export/debug/transcript-debug-20260607-005728/local/agent-py-transcripts/b1000000-0001-0000-0000-000000000001-call-b1000000-1780815464.json
 - /Users/paulrusso/moss-hackathon/agent-py/export/debug/transcript-debug-20260607-005728/local/agent-py-transcripts/b1000000-0001-0000-0000-000000000001-call-b1000000-1780815558.json

## Local transcript files (backend/data)
 - /Users/paulrusso/moss-hackathon/agent-py/export/debug/transcript-debug-20260607-005728/local/backend-data-transcripts/b1000000-0001-0000-0000-000000000001/call-b1000000-1780815464.json


## Transcript persistence paths (code)
1. **Agent shutdown (LiveKit history):** `agent.py` → `POST /calls/transcript` with `session.history.to_dict()`
2. **Agent shutdown (event turns):** `transcript_store.py` → local `agent-py/export/transcripts/` + `POST /calls/transcript` with `{turns: [...]}`
3. **Backend:** `db.save_call_transcript(room_name)` → Supabase `calls.transcript`

## Common failure modes
- Call interrupted before agent shutdown → no transcript written
- `train:call:wait` Ctrl+C'd early → poll stopped, transcript may still land later
- Backend down at shutdown → agent POST fails (logged as `transcript write failed`)
- Duplicate shutdown callbacks: both history + event-based paths register in `agent.py`
