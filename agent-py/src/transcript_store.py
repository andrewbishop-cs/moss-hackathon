"""Persist call transcripts for training data and post-call review."""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import aiohttp

logger = logging.getLogger("agent")

AGENT_DIR = Path(__file__).resolve().parent.parent
LOCAL_TRANSCRIPT_DIR = AGENT_DIR / "export" / "transcripts"


@dataclass
class TranscriptTurn:
    role: str
    text: str
    timestamp: str
    signal: str | None = None


@dataclass
class CallTranscript:
    lead_id: str
    room_name: str
    use_case: str
    turns: list[TranscriptTurn] = field(default_factory=list)

    def add_turn(self, role: str, text: str, *, signal: str | None = None) -> None:
        cleaned = (text or "").strip()
        if not cleaned:
            return
        self.turns.append(
            TranscriptTurn(
                role=role,
                text=cleaned,
                timestamp=datetime.now(timezone.utc).isoformat(),
                signal=signal,
            )
        )

    def to_dict(self) -> dict:
        return {
            "lead_id": self.lead_id,
            "room_name": self.room_name,
            "use_case": self.use_case,
            "turns": [asdict(t) for t in self.turns],
            "saved_at": datetime.now(timezone.utc).isoformat(),
        }


def save_transcript_local(transcript: CallTranscript) -> Path:
    """Write transcript JSON under agent-py/export/transcripts/."""
    LOCAL_TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{transcript.lead_id}-{transcript.room_name}.json"
    path = LOCAL_TRANSCRIPT_DIR / filename.replace("/", "_")
    path.write_text(
        json.dumps(transcript.to_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return path


async def post_transcript_to_backend(
    transcript: CallTranscript, backend_url: str
) -> bool:
    """Best-effort POST to FastAPI hub. Failures are logged, never raised."""
    payload = transcript.to_dict()
    try:
        timeout = aiohttp.ClientTimeout(total=5)
        async with (
            aiohttp.ClientSession(timeout=timeout) as session,
            session.post(f"{backend_url}/calls/transcript", json=payload) as resp,
        ):
            if resp.status >= 400:
                body = await resp.text()
                logger.error("transcript write failed: HTTP %s %s", resp.status, body)
                return False
            return True
    except Exception:
        logger.exception("failed to POST call transcript to backend")
        return False
